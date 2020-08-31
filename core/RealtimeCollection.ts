import * as admin from "firebase-admin";
import {Database, DatabaseCollection, DocumentData, DocumentDataConstructor, IsCollectionParent} from "../internal";

/**
 * RealtimeCollection class for Realtime Flashbase Library
 * https://github.com/phamngocduy98/node_flashbase_library
 */
export class RealtimeCollection<D extends DocumentData> extends DatabaseCollection<D> {
    constructor(
        root: Database,
        parent: IsCollectionParent,
        ref: admin.database.Reference,
        itemConstructor: DocumentDataConstructor<D>
    ) {
        super(root, parent, ref, itemConstructor);
        this.addedListeners = [];
        this.changedListeners = [];
        this.removedListeners = [];
        this.ref.on("child_added", (snap, prevKey) => {
            let doc = this.child(snap.key!);
            doc._onSnap(snap);
            for (let listener of this.addedListeners) {
                listener(snap.key!, doc);
            }
        });
        this.ref.on("child_changed", (snap) => {
            const doc = this.child(snap.key!);
            doc._onSnap(snap);
            for (let listener of this.changedListeners) {
                listener(snap.key!, doc);
            }
        });
        this.ref.on("child_removed", (snap, prevKey) => {
            let doc = this._list.get(snap.key!);
            // assume that if the document isn't in list, it means the document is not listened by any
            if (doc !== undefined) {
                doc._onSnap(snap);
                for (let listener of this.removedListeners) {
                    listener(snap.key!, doc);
                }
            }
        });
    }
}
