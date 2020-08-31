import * as admin from "firebase-admin";
import {IsCollectionParent} from "../internal";

/**
 * Database class for Realtime Flashbase Library
 * https://github.com/phamngocduy98/node_flashbase_library
 */
export class Database extends IsCollectionParent {
    root?: Database | undefined; // useless
    constructor(private db: admin.database.Database) {
        super(db.ref());
    }

    getRoot(): Database {
        return this;
    }
}
