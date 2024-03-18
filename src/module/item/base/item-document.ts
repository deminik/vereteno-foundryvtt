import { VeretenoItemSheet } from "./item-sheet";

class VeretenoItem<TParent extends VeretenoActor | null = VeretenoActor | null> extends Item<TParent>{
    get data() {
        return this.prepareData();
    }

    get itemProperties() {
        return this.system;
    }
}

interface VeretenoItem<TParent extends VeretenoActor | null = VeretenoActor | null> extends Item<TParent> {
    constructor: typeof VeretenoItem;
    system: VeretenoItemSystemData;

    _sheet: VeretenoItemSheet<this> | null;

    get sheet(): VeretenoItemSheet<this>;

    prepareSiblingData?(this: VeretenoItem<VeretenoActor>): void;
    prepareActorData?(this: VeretenoItem<VeretenoActor>): void;
    /** Optional data-preparation callback executed after rule-element synthetics are prepared */
    onPrepareSynthetics?(this: VeretenoItem<VeretenoActor>): void;

    /** Returns items that should also be added when this item is created */
    createGrantedItems?(options?: object): Promise<VeretenoItem[]>;

    /** Returns items that should also be deleted should this item be deleted */
    getLinkedItems?(): VeretenoItem<VeretenoActor>[];
}

export { VeretenoItem }