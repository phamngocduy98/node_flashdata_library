import * as admin from "firebase-admin";

import {
    AbstractRealtimeList,
    Database,
    DatabaseDocument,
    DocumentData,
    DocumentDataConstructor,
    DocumentDataCreationType,
    IDatabaseEntity,
    IsCollectionParent
} from "../internal";

/**
 * DatabaseCollection class for FlashData - Realtime Database Library
 * https://github.com/phamngocduy98/node_flashdata_library
 */
export class DatabaseCollection<D extends DocumentData> extends AbstractRealtimeList<DatabaseDocument<D>> {
    _value: Map<String, D>;

    constructor(
        public root: Database,
        public parent: IsCollectionParent,
        public ref: admin.database.Reference,
        public itemConstructor: DocumentDataConstructor<D>
    ) {
        super(root, ref);
        this._value = new Map();
    }

    _onSnap(snap: admin.database.DataSnapshot) {
        snap.forEach((childSnap) => {
            this.child(childSnap.key!)._onSnap(childSnap);
        });
    }

    child(key: string): DatabaseDocument<D> {
        let doc = this._list.get(key);
        if (doc !== undefined) {
            return doc;
        } else {
            let newData = new this.itemConstructor();
            newData._key = key;
            let newDoc = new DatabaseDocument<D>(this.root, this.ref.child(key), this, newData);
            this._listSet(key, newDoc);
            return newDoc;
        }
    }

    protected _listSet(key: string, value: DatabaseDocument<D>) {
        super._listSet(key, value);
        this._value.set(key, value._rawValue());
    }

    value() {
        return this._value;
        // TODO: convert Map<string, RealtimeDocument<D>> to Map<string, D>
        // const value: Partial<CollectionDataValues<D>> = {};
        // for (let key of this._list.keys()) {
        //     let doc = this._list.get(key);
        //     if (doc?.isExists) {
        //         value[key] = await doc.value();
        //     }
        // }
        // return new CollectionCreationData(value as CollectionDataValues<D>);
    }

    async children() {
        let snaps = await this.ref.once("value");
        let docs: DatabaseDocument<D>[] = [];
        snaps.forEach((snap) => {
            let doc = this.child(snap.key!);
            docs.push(doc);
            doc._onSnap(snap);
        });
        return docs;
    }

    // TODO: support query
    // async query(queryInput: (ref: admin.database.Reference) => admin.database.Query): Promise<extractDocumentDataOfDatabaseDocument<T>[]> {
    //     let query = queryInput(this.ref);
    //     let querySnap = await query.once("value");
    //     let docsData = [];
    //     querySnap.forEach(snap => {
    //         docsData.push(snap.val() as extractDocumentDataOfDatabaseDocument<T>);
    //     });
    //     return docsData;
    // }

    async set(key: string | undefined, docData: DocumentDataCreationType<D>): Promise<DatabaseDocument<D>> {
        const doc = this.child(key ?? this.ref.push().key!);
        this._listSet(doc.key, doc);
        await doc.set(docData);
        return doc;
    }

    /**
     * is alias of set(undefined, docData)
     * @param docData
     */
    add(docData: DocumentDataCreationType<D>): Promise<DatabaseDocument<D>> {
        return this.set(undefined, docData);
    }

    delete(key: string) {
        return this.ref.child(key).remove();
    }

    clearCollection() {
        // TODO: need more testing
        this._listClear();
        return this.ref.set({});
    }

    getChild(path: string): IDatabaseEntity | undefined {
        const paths = path.split("/");
        let child = this.child(paths[0]);
        return paths.length === 1 ? child : child.getChild(paths.slice(1).join("/"));
    }
}
