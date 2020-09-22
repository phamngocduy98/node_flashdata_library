import * as admin from "firebase-admin";
import {IsCollectionParent} from "../internal";

/**
 * Database class for FlashData - Realtime Database Library
 * https://github.com/phamngocduy98/node_flashdata_library
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
