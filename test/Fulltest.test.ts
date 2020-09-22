import "mocha";
import {expect} from "chai";
import * as admin from "firebase-admin";
import {config} from "dotenv";
import {resolve} from "path";
import {RealtimeCollection, RealtimeDocument, RealtimeMap} from "..";

import {MyDatabase} from "../sample_db/MyDatabase";
import {User} from "../sample_db/User";
import {Player} from "../sample_db/Player";
import {Room} from "../sample_db/Room";
import {State} from "../sample_db/State";
import {SortedArray} from "../SortedArray";

config({path: resolve(__dirname, "../.env")});

admin.initializeApp({
    credential: admin.credential.cert({
        privateKey: process.env.FIREBASE_PRIVATE_KEY ?? "",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
        projectId: process.env.FIREBASE_PROJECT_ID ?? ""
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL ?? ""
});
const db = new MyDatabase(admin.database());

describe("RealtimeBase library and database structure test", function () {
    this.timeout(10000);

    it("sortedArray", (done) => {
        let a = new SortedArray<number>();
        a.push(2, 2, 3, 3, 2, 1, 1, 3, 3, 3, 2, 1);
        expect(a).to.have.lengthOf(3);
        expect(a[0]).to.equal(1);
        expect(a[1]).to.equal(2);
        expect(a[2]).to.equal(3);
        done();
    });

    it("create/get document", async () => {
        let newUserData = new User("testing user", "avatar");
        let user = await db.users.set("user_test", newUserData);
        let userData = await user.value();
        console.info(userData);
        expect(userData).not.to.be.null;
        expect(userData!.name, "check document data : name").to.equal(newUserData.name);
        expect(userData!.avatarUrl, "check document data : avatarUrl").to.equal(newUserData.avatarUrl);
    });

    it("get collection documents", async () => {
        let users = await db.users.children();
        console.info(await Promise.all(users.map((user) => user.value())));
        expect(users, "check result length").to.have.length.greaterThan(0);
        expect(await users[0].value(), "check result document data: check property name").to.have.haveOwnProperty(
            "name"
        );
    });

    it("check methods and properties", async () => {
        let userDoc = await db.users.set("user_test", new User("testing user", "avatar"));
        expect(userDoc.root, "check FirestoreDocument#root property").to.equal(db);
        expect(userDoc.parent, "check FirestoreDocument#parentCollection property").to.equal(db.users);
        expect(db.getChild("users/user_test"), "IDatabaseEntity#getChild method").to.equal(userDoc);
        expect(db.users.getChild("user_test"), "IDatabaseEntity#getChild method").to.equal(userDoc);
        expect(db.users.child("user_test").getChild("any"), "IDatabaseEntity#getChild method").to.undefined;
    });

    it("create complex-nested object, access nested object / collection", async () => {
        let testRoomDoc = await db.rooms.set(
            "test_room",
            new Room(
                new State(
                    "111",
                    new Map([
                        ["1", 1],
                        ["2", 2]
                    ]),
                    new Map<string, Player>([["duy1", new Player("duy1", "Duy", "avatar", true)]])
                )
            )
        );
        console.log(await testRoomDoc.value());
        let stateDoc = testRoomDoc.nested<State>("state")!;
        console.log(await stateDoc.value());
        let players = stateDoc.subCollection<Player>("players");
        let playerDoc = players.child("duy1");
        let player = await playerDoc.value();
        console.log(player);
        expect(player).not.to.be.null;
        expect(player.name, "check player data").to.equal("Duy");
        expect(player.avatar, "check player data").to.equal("avatar");
    });

    it("update nested object", async () => {
        let testRoomDoc = await db.rooms.child("test_room");
        await testRoomDoc.update({
            state: {
                roomId: "222"
            }
        });
        console.log(await testRoomDoc.value());
        let stateDoc = (await testRoomDoc.nested("state"))!;
        let state = await stateDoc.value();
        console.log(state);
        expect(state.roomId, "check updated roomId").to.equal("222");
    });

    it("delete a key", async () => {
        let userDoc = await db.users.set("to_delete", {name: "to_delete", avatarUrl: "delete"});
        expect((await userDoc.value()).name).to.equal("to_delete");
        await userDoc.delete();
        await userDoc.value();
        expect(userDoc.isExists).to.equal(false);
    });

    it("Collection test", async () => {
        let players = (db.getChild("rooms/test_room/state/players") as unknown) as RealtimeCollection<Player>;
        expect(players).to.not.null;
        await players.clearCollection();
        const batchAddTasks = [];
        for (let i = 0; i < 5; i++) {
            batchAddTasks.push(
                players.set(undefined, {
                    playerId: "player" + i,
                    avatar: "avatar" + i,
                    name: "Player" + i,
                    alive: true
                })
            );
        }
        await Promise.all(batchAddTasks);
        await players.set("playerZ", {
            playerId: "playerZ",
            avatar: "avatarZ",
            name: "PlayerZ",
            alive: true
        });
        players.getAt(0);
        // use as a array
        let player3Doc = players.getAt(3)!;
        let player3 = await player3Doc.value();
        console.log(player3);
        expect(player3.playerId).to.equal("player3");
        // use as a map
        const playerZDoc = players.child("playerZ");
        const playerZ = await playerZDoc.value();
        console.log(playerZ);
        expect(playerZ.playerId).to.equal("playerZ");
    });

    it("RealtimeArrayMap test", async () => {
        let testRoomDoc = db.rooms.child("test_room");
        let stateDoc: RealtimeDocument<State> = testRoomDoc.nested("state");
        let stateVal: State = (await stateDoc.value())!;
        console.log(stateVal.setup);
        let setup: RealtimeMap<number> = stateDoc.subMap("setup");
        await setup.clear();
        await setup.set("setup1", 2); // add (or overwrite) at key = "setup1" with value "2"
        let setup1: number | undefined = setup.get("setup1");
        expect(setup1).to.equal(2);
        // await setup.remove("setup1"); // remove a key
        console.log(stateVal.setup);

        await setup.add(1); // add with auto ID (or use a an array)
        let setupAt0 = setup.getAt(0); // if you use map as an array
        expect(setupAt0).to.not.null;
        // await setup.removeAt(0); // remove if you use map as an array
        console.log(stateVal.setup);
        console.log(setup.value());
    });
});
