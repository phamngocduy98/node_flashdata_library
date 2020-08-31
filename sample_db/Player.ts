import {DocumentData, NestedDocument} from "../internal";

export class Player extends DocumentData {
    constructor(
        public playerId: string = "",
        public name: string = "",
        public avatar: string = "",
        public alive: boolean = true
    ) {
        super();
    }
}
