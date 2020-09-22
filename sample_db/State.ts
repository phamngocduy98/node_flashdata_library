import {Collection, DocumentData, MapArray} from "../index";
import {Player} from "./Player";

export class State extends DocumentData {
    @MapArray("number")
    setup!: Map<string, number>;
    @Collection(Player)
    players!: Map<string, Player>;

    constructor(public roomId: string, setup: Map<string, number>, players: Map<string, Player>) {
        super();
        this.setup = setup;
        this.players = players;
    }
}
