/**
 * SortedArray class for Realtime Flashbase Library
 * https://github.com/phamngocduy98/node_flashbase_library
 */
export class SortedArray<D> extends Array<D> {
    constructor() {
        super();
    }

    push(value: D) {
        if (this.length === 0) return super.push(value);
        for (let i = this.length - 1; i >= 0; i--) {
            if (this[i] <= value) {
                if (this[i] === value) return this.length;
                for (let j = this.length - 1; j > i; j--) {
                    this[j + 1] = this[j];
                }
                this[i + 1] = value;
                return this.length;
            }
        }
        return this.length;
    }
}
