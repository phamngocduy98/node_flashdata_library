import * as admin from "firebase-admin";
import {
    CollectionCreationData,
    Database,
    DatabaseCollection,
    DataTypeOfCollectionData,
    DocumentData,
    getRegisteredNestedAndLinkingMetadata,
    IDatabaseEntity,
    IsCollectionParent,
    RealtimeCollection,
    RealtimeDocument,
    RealtimeMap
} from "../internal";

export type DatabaseDocumentConstructor<D extends DocumentData> = {
    new (
        root: Database,
        ref: admin.database.Reference,
        parent: DatabaseDocumentParent,
        dataValue: D
    ): DatabaseDocument<D>;
};
export type DatabaseDocumentParent = DatabaseCollection<any> | Database | DatabaseDocument<any>;
export type DocumentDataOf<T> = T extends DatabaseDocument<infer D> ? D : never;
export type DocumentDataCreationType<D extends DocumentData> = Omit<
    {
        [key in keyof D]: D[key] extends DocumentData ? DocumentDataCreationType<D[key]> : D[key];
    },
    "_key"
>;
export type DocumentDataUpdateType<D extends DocumentData> = Partial<
    Omit<{[key in keyof D]: D[key] extends DocumentData ? DocumentDataUpdateType<D[key]> : D[key]}, "_key">
>;

export type DocumentDataPropertyNames<D> = D extends DocumentData
    ? {[key in keyof D]: D[key] extends DocumentData ? key : never}[keyof D]
    : never;
export type CollectionDataPropertyNames<D> = D extends DocumentData
    ? {[key in keyof D]: D[key] extends Map<string, any> ? key : never}[keyof D]
    : never;

/**
 * DatabaseDocument class for FlashData - Realtime Database Library
 * https://github.com/phamngocduy98/node_flashdata_library
 */
export class DatabaseDocument<D extends DocumentData> extends IsCollectionParent {
    protected _nested: Map<string, DatabaseDocument<any>>;
    public isExists: boolean = false;

    constructor(
        public root: Database,
        public ref: admin.database.Reference,
        public parent: DatabaseDocumentParent,
        protected _dataValue: D
    ) {
        super(ref);
        if (this.ref.key == null) throw Error("You can not declare root as Document. Use Database instead!");
        this._nested = new Map();
        let registeredData = getRegisteredNestedAndLinkingMetadata(this._dataValue);
        this.constructCollectionFrom(this._dataValue);
        for (let record of registeredData) {
            let key: keyof D = record.propertyKey as keyof D;
            if (record.type === "nested" && record.constructor !== undefined) {
                const nestDataValue = new record.constructor();
                const nestedDoc = new RealtimeDocument(root, ref.child(record.propertyKey), this, nestDataValue);
                // nestedDocument is stored in parentDocument
                (this as any)[key] = nestedDoc;
                // nestedData is stored in parentData
                (this._dataValue as any)[key] = nestDataValue;
                this._nested.set(record.propertyKey, nestedDoc);
            }
        }
    }

    // TODO: any type
    _onSnap(snap: admin.database.DataSnapshot) {
        super._onSnap(snap);
        this.isExists = snap.exists();
        if (!this.isExists) {
            Object.keys(this._dataValue).forEach((key) => {
                delete this._dataValue[key as keyof D];
            });
            return;
        }
        const val = snap.val();
        for (let property in val) {
            if (this[property as keyof this] instanceof IDatabaseEntity && snap.hasChild(property)) {
                // nested document/collection/mapArray
                ((this[property as keyof this] as any) as IDatabaseEntity)._onSnap(snap.child(property));
            } else {
                // normal value
                (this._dataValue as any)[property] = val[property];
            }
        }
    }

    async value(): Promise<D> {
        // TODO: null of {} for not exist document
        let snap = await this.ref.once("value");
        this._onSnap(snap);
        return this._dataValue;
    }

    _rawValue() {
        return this._dataValue;
    }

    nested<D2 extends D[DocumentDataPropertyNames<D>]>(
        key: DocumentDataPropertyNames<D>
    ): RealtimeDocument<Extract<D[typeof key], D2>> {
        return (this._nested.get(key as string) as any) as RealtimeDocument<Extract<D[typeof key], D2>>;
    }

    subCollection<D2 extends DataTypeOfCollectionData<D[CollectionDataPropertyNames<D>]>>(
        key: CollectionDataPropertyNames<D>
    ): RealtimeCollection<Extract<DataTypeOfCollectionData<D[typeof key]>, D2>> {
        return super.collection(key as string)! as RealtimeCollection<
            Extract<DataTypeOfCollectionData<D[typeof key]>, D2>
        >;
    }

    subMap(key: CollectionDataPropertyNames<D>): RealtimeMap<any> {
        return super.collection(key as string)! as RealtimeMap<any>; // as RealtimeMap<DataTypeOfCollectionData<D[typeof key]>>;
    }

    /**
     * @warning
     * @deprecated use set() ( which is a combo of delete() then update() ) for a safer way to set data
     *
     * hardSet will overwrite current data tree with documentData, so be aware to do so
     * don't use set unless you need to do so
     * @param documentData
     */
    async hardSet(documentData: DocumentDataCreationType<D>) {
        this.isExists = true;
        return this.ref.set(documentData);
    }

    async set(documentData: DocumentDataCreationType<D>) {
        await this.delete();
        await this.update(documentData);
    }

    delete(): Promise<void> {
        // TODO: null of {} for not exist document
        Object.keys(this._dataValue).forEach((key) => {
            delete this._dataValue[key as keyof D];
        });
        return this.ref.remove();
    }

    // TODO: any type
    async update(updateParams: DocumentDataUpdateType<D>) {
        this.isExists = true;
        let firstLeverData: Partial<D> = {};
        const updateParamsKeys = Object.keys(updateParams).filter((key) => !["_key"].includes(key));
        for (let _key of updateParamsKeys) {
            let key = _key as keyof DocumentDataUpdateType<D>;
            // if (this.dataValue.hasOwnProperty(key)) {
            const thisAtKey = this[key as keyof this];
            if (thisAtKey instanceof DatabaseDocument) {
                await (thisAtKey as DatabaseDocument<any>).update(updateParams[key]!);
            } else if (updateParams[key] instanceof CollectionCreationData) {
                const collectionDataValues = (updateParams[key] as any) as CollectionCreationData<any>;
                if (thisAtKey instanceof DatabaseCollection) {
                    for (let itemToAdd of collectionDataValues.valuesToAdd) {
                        await (thisAtKey as DatabaseCollection<any>).set(undefined, itemToAdd);
                    }
                } else {
                    console.error("Property at '" + key + "' is not DatabaseCollection");
                }
            } else if (updateParams[key] instanceof Map) {
                const collectionDataValues = (updateParams[key] as any) as Map<string, any>;
                if (thisAtKey instanceof DatabaseCollection) {
                    for (let [k, v] of collectionDataValues) {
                        await (thisAtKey as DatabaseCollection<any>).child(k).update(v);
                    }
                } else if (thisAtKey instanceof RealtimeMap) {
                    for (let [k, v] of collectionDataValues) {
                        await (thisAtKey as RealtimeMap<any>).set(k, v);
                    }
                } else {
                    console.error("Property at '" + key + "' is not RealtimeMap");
                }
            } else {
                // normal property
                (this._dataValue as any)[key] = updateParams[key];
                (firstLeverData as any)[key] = updateParams[key];
            }
            // }
        }
        return this.ref.update(firstLeverData);
    }

    /**
     * @deprecated
     * @param updateCallback
     */
    updateInTransaction(updateCallback: (currentData: DocumentDataCreationType<D>) => DocumentDataCreationType<D>) {
        return this.ref.transaction(updateCallback);
    }

    getRoot(): Database {
        return this.root;
    }

    getChild(path: string): IDatabaseEntity | undefined {
        const collection = super.getChild(path);
        if (collection !== undefined) return collection;
        const paths = path.split("/");
        let child = this[paths[0] as keyof this];
        if (this.hasOwnProperty(paths[0]) && child instanceof IDatabaseEntity) {
            return paths.length === 1 ? child : child.getChild(paths.slice(1).join("/"));
        } else {
            return undefined;
        }
    }
}
