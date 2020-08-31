import {DocumentData, NestedDocument} from "../index";
import {State} from "./State";

export class Room extends DocumentData {
    @NestedDocument(State)
    state!: State;

    constructor(state: State) {
        super();
        this.state = state;
    }
}
