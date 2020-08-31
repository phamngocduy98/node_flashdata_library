// *
// * Decorator functions for Realtime FlashBase Library
// * https://github.com/phamngocduy98/node_flashbase_library
// *

import "reflect-metadata";
import {DocumentData, DocumentDataConstructor, IsCollectionParent} from "./internal";

const CollectionRegistrationMetadataKey = Symbol("CollectionRegistrationMetadataKey");

export type MapArrayTypes = "string" | "number" | "boolean";

export interface ICollectionRegistrationMetadata {
    collectionName: string;
    dataConstructor?: { new(...args: any): DocumentData };
    type?: MapArrayTypes;
}

export function getRegisteredCollections(target: DocumentData | IsCollectionParent): ICollectionRegistrationMetadata[] {
    return Reflect.getMetadata(CollectionRegistrationMetadataKey, target) || [];
}

// @Collection
export function Collection(constructor: DocumentDataConstructor<any>) {
    return function (target: DocumentData | IsCollectionParent, propertyKey: string): any {
        let registeredCollections = getRegisteredCollections(target);
        let metaData: ICollectionRegistrationMetadata = {
            collectionName: propertyKey,
            dataConstructor: constructor
        };
        registeredCollections.push(metaData);
        Reflect.defineMetadata(CollectionRegistrationMetadataKey, registeredCollections, target);
    };
}

// @MapArray
export function MapArray(type: MapArrayTypes) {
    return function (target: DocumentData, propertyKey: string): any {
        let registeredCollections = getRegisteredCollections(target);
        let metaData: ICollectionRegistrationMetadata = {
            collectionName: propertyKey,
            dataConstructor: undefined,
            type: type
        };
        registeredCollections.push(metaData);
        Reflect.defineMetadata(CollectionRegistrationMetadataKey, registeredCollections, target);
    };
}

/*************************
 * PROPERTY REGISTRATION
 *************************/

const PropertyMetadataKey = Symbol("PropertyMetadataKey");

export function getRegisteredProperty(target: DocumentData): string[] {
    return Reflect.getMetadata(PropertyMetadataKey, target) || [];
}

// @Property
export function Property() {
    return function (target: DocumentData, propertyKey: string): any {
        let registeredProperty = getRegisteredProperty(target);
        registeredProperty.push(propertyKey);
        Reflect.defineMetadata(CollectionRegistrationMetadataKey, registeredProperty, target);
    };
}

/*******************
 * LINKING FEATURE:
 *******************/

const LinkingMetadataKey = Symbol("LinkingMetadataKey");

export interface ILinkingMetadata {
    propertyKey: string;
    targetRefPath?: string;
    constructor?: DocumentDataConstructor<any>;
    type: "nested" | "viaId";
}

export function getRegisteredNestedAndLinkingMetadata(target: DocumentData): ILinkingMetadata[] {
    return Reflect.getMetadata(LinkingMetadataKey, target) || [];
}

// @NestedDocument
export function NestedDocument(constructor: DocumentDataConstructor<any>) {
    return function (target: DocumentData, propertyKey: string): any {
        let prevLinkedMetadata = getRegisteredNestedAndLinkingMetadata(target);
        let metaData: ILinkingMetadata = {
            propertyKey: propertyKey,
            constructor: constructor,
            type: "nested"
        };
        prevLinkedMetadata.push(metaData);
        Reflect.defineMetadata(LinkingMetadataKey, prevLinkedMetadata, target);
    };
}

// // @LinkDocumentReferenceArray
// export function LinkDocumentReferenceArray(refArrayPropertyName: string) {
//     return function (target: DatabaseDocument<any>, propertyKey: string): any {
//         let prevLinkedMetadata = getRegisteredLinkingMetadata(target);
//         let metaData: ILinkingMetadata = {
//             propertyKey: propertyKey,
//             targetRefPath: refArrayPropertyName,
//             linkVia: "docRef[]"
//         };
//         prevLinkedMetadata.push(metaData);
//         Reflect.defineMetadata(LinkingMetadataKey, prevLinkedMetadata, target);
//     };
// }

// @LinkDocument
export function LinkDocument(refPath: string) {
    return function (target: DocumentData, propertyKey: string): any {
        let prevLinkedMetadata = getRegisteredNestedAndLinkingMetadata(target);
        let metaData: ILinkingMetadata = {
            propertyKey: propertyKey,
            targetRefPath: refPath,
            constructor: undefined,
            type: "viaId"
        };
        prevLinkedMetadata.push(metaData);
        Reflect.defineMetadata(LinkingMetadataKey, prevLinkedMetadata, target);
    };
}
