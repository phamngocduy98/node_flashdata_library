import {DocumentData} from "./internal";

export function isDocumentData(data: DocumentData | any): data is DocumentData {
    return data.hasOwnProperty("toPureObject") && typeof data["toPureObject"] === "function";
}

export type NaF<T> = T extends ((...args: any[]) => any) ? never : T;
