import * as admin from "firebase-admin";
import {
    AbstractRealtimeList,
    DocumentData,
    getRegisteredCollections,
    IDatabaseEntity,
    RealtimeCollection,
    RealtimeMap
} from "../internal";

/**
 * IsCollectionParent class for FlashData - Realtime Database Library
 * https://github.com/phamngocduy98/node_flashdata_library
 */
export abstract class IsCollectionParent extends IDatabaseEntity {
    private collections: Map<string, AbstractRealtimeList<any>>;

    protected constructor(ref: admin.database.Reference) {
        super(ref);
        this.collections = new Map();
        this.constructCollectionFrom(this);
    }

    // TODO: any type
    constructCollectionFrom(source: DocumentData | IsCollectionParent) {
        let collections = getRegisteredCollections(source);
        for (let collection of collections) {
            let key = collection.collectionName;
            if (collection.dataConstructor !== undefined) {
                // console.warn("register RealtimeCollection at " + key);
                const collectionInstance = new RealtimeCollection<any>(
                    this.getRoot(),
                    this,
                    this.ref.child(collection.collectionName),
                    collection.dataConstructor
                );
                this.collections.set(collection.collectionName, collectionInstance);
                (source as any)[key] = collectionInstance.value();
                (this as any)[key] = collectionInstance;
            } else if (collection.type !== undefined) {
                // console.warn("register RealtimeMap at " + key);
                const realtimeMapArrayInstance = new RealtimeMap(
                    this.getRoot(),
                    this.ref.child(collection.collectionName),
                    this
                );
                this.collections.set(collection.collectionName, realtimeMapArrayInstance);
                (source as any)[key] = realtimeMapArrayInstance.value();
                (this as any)[key] = realtimeMapArrayInstance;
            } else {
                throw Error("Invalid RealtimeCollection or RealtimeMap registration");
            }
        }
    }

    collection(key: string) {
        return this.collections.get(key);
    }

    _onSnap(snap: admin.database.DataSnapshot): void {
        for (let collection of this.collections.values()) {
            if (snap.hasChild(collection.key)) {
                collection._onSnap(snap.child(collection.key));
            }
        }
    }

    getChild(path: string): IDatabaseEntity | undefined {
        const paths = path.split("/");
        const collection = this.collections.get(paths[0]);
        if (collection !== undefined) {
            return paths.length === 1 ? collection : collection.getChild(paths.slice(1).join("/"));
        }
        return undefined;
    }
}
