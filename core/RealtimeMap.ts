import {Database, IDatabaseEntity, IsCollectionParent} from "../internal";
import * as admin from "firebase-admin";
import {AbstractRealtimeList} from "../abstract/AbstractRealtimeList";

/**
 * RealtimeMap class for FlashData - Realtime Database Library
 * https://github.com/phamngocduy98/node_flashdata_library
 */
export class RealtimeMap<D extends string | number | boolean> extends AbstractRealtimeList<D> {
    constructor(public root: Database, public ref: admin.database.Reference, public parent: IsCollectionParent) {
        super(root, ref);
        this.ref.on("child_added", (snap, prevKey) => {
            let value = snap.val();
            this._listSet(snap.key!, value);
            for (let listener of this.addedListeners) {
                listener(snap.key!, value);
            }
        });
        this.ref.on("child_changed", (snap) => {
            let value = snap.val();
            this._listSet(snap.key!, value);
            for (let listener of this.changedListeners) {
                listener(snap.key!, value);
            }
        });
        this.ref.on("child_removed", (snap, prevKey) => {
            let value = this._list.get(snap.key!);
            // assume that if the document isn't in list, it means the document is not listened by any
            if (value !== undefined) {
                for (let listener of this.removedListeners) {
                    listener(snap.key!, value);
                }
                this._list.delete(snap.key!);
            }
        });
    }

    value() {
        return this._list;
    }

    _onSnap(snap: admin.database.DataSnapshot): void {
        this._list.clear();
        snap.forEach((childSnap) => {
            this._listSet(childSnap.key!, childSnap.val());
        });
    }

    add(value: D) {
        return this.set(undefined, value);
    }

    remove(key: string) {
        return this.set(key, null);
    }

    removeAt(index: number) {
        if (index < 0 || index >= this._arrayIndex.length) throw Error("index out of bound");
        return this.remove(this._arrayIndex[index]);
    }

    set(key: string | undefined, value: D | null): Promise<any> {
        if (key !== undefined) return this.ref.update({[key]: value});
        const pushRes = this.ref.push(value);
        return new Promise<any>((rs, rj) => pushRes.then(rs).catch(rj));
    }

    get(key: string): D | undefined {
        return this._list.get(key);
    }

    clear() {
        super._listClear();
        return this.ref.set({});
    }

    getChild(path: string): IDatabaseEntity | undefined {
        // const paths = path.split("/");
        // let child = this._list.get(paths[0]);
        return undefined; // TODO: its child's type is not IDabaseEntity so it got undefined
    }
}
