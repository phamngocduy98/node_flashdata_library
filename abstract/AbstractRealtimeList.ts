import {Database} from "../internal";
import {IDatabaseEntity} from "./IDatabaseEntity";
import * as admin from "firebase-admin";
import {SortedArray} from "../SortedArray";

/**
 * AbstractRealtimeList class for FlashData - Realtime Database Library
 * https://github.com/phamngocduy98/node_flashdata_library
 */
export abstract class AbstractRealtimeList<D> extends IDatabaseEntity {
    protected _list: Map<string, D>;
    protected _arrayIndex: SortedArray<string>;
    addedListeners: Array<ListOnAddedCallback<D>>;
    changedListeners: Array<ListOnChangedCallback<D>>;
    removedListeners: Array<ListOnRemovedCallback<D>>;

    protected constructor(public root: Database, ref: admin.database.Reference) {
        super(ref);
        this._list = new Map();
        this._arrayIndex = new SortedArray<string>();
        this.addedListeners = [];
        this.changedListeners = [];
        this.removedListeners = [];
    }

    getRoot(): Database {
        return this.root;
    }

    protected _listSet(key: string, value: D) {
        this._list.set(key, value);
        this._arrayIndex.push(key);
    }

    protected _listClear() {
        this._list.clear();
        this._arrayIndex.length = 0;
    }

    getAt(index: number) {
        return this._list.get(this._arrayIndex[index]);
    }

    onAdded(callback: ListOnAddedCallback<D>) {
        if (this.addedListeners.includes(callback)) return;
        this.addedListeners.push(callback);
    }

    onChanged(callback: ListOnChangedCallback<D>) {
        if (this.changedListeners.includes(callback)) return;
        this.changedListeners.push(callback);
    }

    onRemoved(callback: ListOnRemovedCallback<D>) {
        if (this.removedListeners.includes(callback)) return;
        this.removedListeners.push(callback);
    }

    offAdded(callback: ListOnAddedCallback<D>) {
        const index = this.addedListeners.indexOf(callback);
        if (index !== -1) this.addedListeners.splice(index, 1);
    }

    offChanged(callback: ListOnChangedCallback<D>) {
        const index = this.changedListeners.indexOf(callback);
        if (index !== -1) this.changedListeners.splice(index, 1);
    }

    offRemoved(callback: ListOnRemovedCallback<D>) {
        const index = this.removedListeners.indexOf(callback);
        if (index !== -1) this.removedListeners.splice(index, 1);
    }
}

type ListOnAddedCallback<T> = (key: string, item: T) => any;
type ListOnChangedCallback<T> = (key: string, item: T) => any;
type ListOnRemovedCallback<T> = (key: string, item: T) => any;
