/**
 * DocumentData class for Realtime Flashbase Library
 * https://github.com/phamngocduy98/node_flashbase_library
 */
export class DocumentData {
    constructor() {
    }

    protected _toPureObject() {
    }
}

export class CollectionCreationData<D extends DocumentData> {
    constructor(public values: CollectionDataValues<D>, public valuesToAdd: D[] = []) {
    }
}

export type CollectionDataValues<D extends DocumentData> = { [key: string]: D };

export type DocumentDataConstructor<T extends DocumentData> = { new(...args: any[]): T };

export type DataTypeOfCollectionData<T> = T extends Map<string, infer D1> ? (D1 extends DocumentData ? D1 : never) : (T extends CollectionCreationData<infer D> ? D : never);
