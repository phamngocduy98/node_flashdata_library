import * as admin from "firebase-admin";

import {Collection, Database, RealtimeCollection} from "../internal";
import {Room} from "./Room";
import {User} from "./User";

export class MyDatabase extends Database {
    @Collection(Room)
    rooms!: RealtimeCollection<Room>;

    @Collection(User)
    users!: RealtimeCollection<User>;

    constructor(db: admin.database.Database) {
        super(db);
    }
}
