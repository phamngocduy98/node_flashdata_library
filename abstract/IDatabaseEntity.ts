import * as admin from "firebase-admin";
import {Database} from "..";

/**
 * IDatabaseEntity class for Realtime Flashbase Library
 * https://github.com/phamngocduy98/node_flashbase_library
 */
export abstract class IDatabaseEntity {
    abstract root?: Database;

    protected constructor(
        public ref: admin.database.Reference
    ) {
    }

    abstract _onSnap(snap: admin.database.DataSnapshot): void;

    abstract getRoot(): Database;

    get key(): string {
        return this.ref.key!;
    }

    abstract getChild(path: string): IDatabaseEntity | undefined;
}
