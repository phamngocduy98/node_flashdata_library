import * as admin from "firebase-admin";

import {Database, DatabaseDocument, DatabaseDocumentParent, DocumentData} from "../internal";

/**
 * RealtimeDocument class for Realtime Flashbase Library
 * https://github.com/phamngocduy98/node_flashbase_library
 */
export class RealtimeDocument<D extends DocumentData> extends DatabaseDocument<D> {
    changedListeners: Array<OnDocumentChangedCallback<this>>;

    constructor(
        root: Database,
        ref: admin.database.Reference,
        parent: DatabaseDocumentParent,
        dataValues: D,
    ) {
        super(root, ref, parent, dataValues);
        this.changedListeners = [];
        if ((parent instanceof Database)) {
            this.ref.on("value", snap => {
                this._onSnap(snap);
                console.error("onSnap", this._rawValue());
            });
        }
    }

    _onSnap(snap: admin.database.DataSnapshot) {
        super._onSnap(snap);
        for (let listener of this.changedListeners) {
            listener(this);
        }
    }

    async value(): Promise<D> {
        return this.isExists === undefined ? await super.value() : this._dataValue;
    }

    onChanged(callback: OnDocumentChangedCallback<this>) {
        if (this.changedListeners.includes(callback)) return;
        this.changedListeners.push(callback);
    }

    offChanged(callback: OnDocumentChangedCallback<this>) {
        const index = this.changedListeners.indexOf(callback);
        if (index !== -1) {
            this.changedListeners.splice(index, 1);
        }
    }

}

type OnDocumentChangedCallback<T extends RealtimeDocument<any>> = (doc: T) => any;
