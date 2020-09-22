# FlashData - Realtime Database

A realtime database library that making it easier to CRUD data with typescript

## How to use

### 0. You need to know before using this library:

While realtime database stores data in a JSON tree. It can be structured by documents and collections like Firebase Firestore after flattening the data structure.  
So, your data is now collections and documents :D

### 1. Define document type class

Define properties of your document by extending `DocumentData` class

```typescript
import {DocumentData} from "../";

export class User extends DocumentData {
    name: string;
    avatarUrl: string;

    constructor(name: string, avatarUrl: string) {
        super();
        this.name = name;
        this.avatarUrl = avatarUrl;
    }
}
```

### 2. Define nested document:

If you have a `Room` that contains a `State` document:

```typescript
export class Room extends DocumentData {
    @NestedDocument(State)
    state!: State;

    constructor(state: State) {
        super();
        this.state = state;
    }
}
```

### 3. Define collections:

For example, you have a root collection whose name is `users`
Use `@Collection` decorator tells the library what is the type of collection's document.

```typescript
import {Collection, Database, RealtimeCollection} from "./.";
import {User} from "./";

export class MyDatabase extends Database {
    @Collection(User)
    users!: RealtimeCollection<User>;
}
```

Then you have subcollection, here is the example how to define a subcollection:

```typescript
import {Collection, DocumentData, MapArray} from "../";
import {Player} from "./Player";

export class State extends DocumentData {
    @Collection(Player)
    players!: Map<string, Player>;

    constructor(public roomId: string, players: Map<string, Player>) {
        super();
        this.players = players;
    }
}
```

Oh! Did you see the difference here?  
Collection in Database is kept in type of RealtimeCollection while
Subcollection in State document is stored as Map.  
The library convert subcollection into map to make it easier to read data.

### 4. Define a Map:

Map is just a collection of primitives type instead of document. Here is example how to use it:

```typescript
export class State extends DocumentData {
    @MapArray("number")
    setup!: Map<string, number>;
    constructor(setup: Map<string, number>) {
        super();
        this.setup = setup;
    }
}
```

### 5. CRUD

For example, you have a root `rooms` collection, a room contains a nested `State` document.
Then inside `State` there is a subcollection `players`.

##### Create

```typescript
let testRoomDoc: RealtimeDocument<Room> = await db.rooms.create(
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
```

##### Read

```typescript
testRoomDoc = await db.rooms.child("test_room");
let room: Room = await testRoomDoc.value();
console.log(room);
```

##### Nested document

```typescript
let stateDoc: RealtimeDocument<State> = testRoomDoc.nested<State>("state")!;
let state: State = await stateDoc.value();
console.log(state);
```

##### Sub collection:

```typescript
let players: RealtimeCollection<Player> = stateDoc.subCollection<Player>("players");
let playerDoc: RealtimeDocument<Player> = players.child("duy1"); // as Map
playerDoc = players.getAt(0); // use collection as Array (while document are sorted by id and id is increment overtime)
players.set("player1", new Player()); // set value of key player1
players.add(new Player()); // create using auto key id
let allPlayers: Map<string, Player> = await players.children(); // get all
players.clearCollection(); // delete all collection data
```

##### Map

```typescript
let setup: RealtimeMap<number> = stateDoc.subMap("setup");
await setup.clear();
await setup.set("setup1", 2); // add (or overwrite) at key = "setup1" with value "2"
let setup1 = setup.get("setup1");
await setup.remove("setup1"); // remove a key

await setup.add(1); // add with auto ID (or use a an array)
let setup0 = setup.getAt(0); // if you use map as an array
await setup.removeAt(0); // remove if you use map as an array
```

##### Get a deep item from path:

```typescript
playerDoc = db.getChild("rooms/test_room/state/players/duy1") as RealtimeDocument<Player>;
```

##### Get root / parent:

```typescript
// get root:
playerDoc.root;
// get parent:
playerDoc.parent;
```

##### UPDATE:

```typescript
testRoomDoc.update({
    state: {
        roomId: "222"
    }
});
```

##### DELETE:

```typescript
testRoomDoc.delete();
```

##### SET:

overwrite (the same as delete() then update())

```typescript
testRoomDoc.set(new Room());
```

### Linking support like FlashStore

Coming soon in the next update.
