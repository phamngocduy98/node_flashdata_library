/**
 * SortedArray class for FlashData - Realtime Database Library
 * https://github.com/phamngocduy98/node_flashdata_library
 */
export class SortedArray<D> extends Array<D> {
    constructor() {
        super();
    }

    insert(position: number, item: D) {
        // shift-right 1 step from position
        for (let j = this.length - 1; j >= position; j--) {
            this[j + 1] = this[j];
        }
        this[position] = item;
    }

    findInsertIndex(item: D, range: [number, number]): number | null {
        const [start, end] = range;
        const center = start + Math.floor((end - start) / 2);
        if (end < start) {
            return start;
        }
        if (this[center] === item) {
            return null;
        } else if (this[center] < item) {
            return this.findInsertIndex(item, [center + 1, end]);
        } else {
            return this.findInsertIndex(item, [start, center - 1]);
        }
    }

    // TODO: use binary search for better performance
    push(...items: D[]): number {
        if (this.length === 0) {
            super.push(items[0]);
            items.splice(0, 1);
        }
        for (let item of items) {
            const index = this.findInsertIndex(item, [0, this.length - 1]);
            if (index != null) this.insert(index, item);
        }
        return this.length;
    }
}
