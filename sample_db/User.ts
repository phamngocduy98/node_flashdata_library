import {DocumentData} from "../";

export class User extends DocumentData {
    name: string;
    avatarUrl: string;

    constructor(name: string, avatarUrl: string) {
        super();
        this.name = name;
        this.avatarUrl = avatarUrl;
    }
}
