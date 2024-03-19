import { VeretenoActor } from "$module/actor";
import { VeretenoItemSheet } from "./sheet";

class VeretenoItem<TParent extends VeretenoActor | null = VeretenoActor | null> extends Item<TParent>{
    get data() {
        return this.prepareData();
    }

    get description() {
        return (this.system.description || '').trim();
    }

    /** Keep `TextEditor` and anything else up to no good from setting this item's description to `null` */
    protected override async _preUpdate(
        changed: DeepPartial<this["_source"]>,
        options: DocumentUpdateContext<TParent>,
        user: User,
    ): Promise<boolean | void> {
        return super._preUpdate(changed, options, user);
    }


    /** Refresh the Item Directory if this item isn't embedded */
    protected override _onUpdate(
        data: DeepPartial<this["_source"]>,
        options: DocumentModificationContext<TParent>,
        userId: string,
    ): void {
        super._onUpdate(data, options, userId);
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

const VeretenoItemProxy = new Proxy(VeretenoItem, {
    construct(
        _target,
        args: [source: PreCreate<VeretenoItemSource>, context?: DocumentConstructionContext<VeretenoActor | null>],
    ) {
        const source = args[0];
        const type = source?.type;
        const ItemClass: typeof VeretenoItem = CONFIG.VERETENO.Item.documentClasses[type] ?? VeretenoItem;
        return new ItemClass(...args);
    },
});

export { VeretenoItem, VeretenoItemProxy }