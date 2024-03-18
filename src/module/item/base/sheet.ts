import { PhysicalVeretenoItem, VeretenoItem } from "../index";

class VeretenoItemSheet<TItem extends VeretenoItem> extends ItemSheet<TItem> {
    get itemData() {
        return this.item.data;
    }

    get itemProperties() {
        return this.item.system;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            width: 560,
            classes: ['vereteno', 'item', 'sheet']
        })
    }

    get template() {
        return `systems/vereteno/templates/sheets/items/${this.item.type}-sheet.hbs`;
    }

    override async getData(options: Partial<DocumentSheetOptions> = {}): Promise<VeretenoItemSheetData<TItem>> {
        options.id = this.id;
        options.editable = this.isEditable;

        const { item } = this;

        // Enrich content
        const enrichedContent: Record<string, string> = {};
        const rollData = { ...this.item.getRollData(), ...this.actor?.getRollData() };

        return {
            itemType: null,
            item: item,
            data: item.system,
            isPhysical: false,
            description: item.description,
            cssClass: this.isEditable ? "editable" : "locked",
            editable: this.isEditable,
            document: item,
            limited: this.item.limited,
            options: this.options,
            owner: this.item.isOwner,
            title: this.title,
        };
    }

    protected override async _updateObject(event: Event, formData: Record<string, unknown>): Promise<void> {
        return super._updateObject(event, formData);
    }
}

interface VeretenoItemSheetData<TItem extends VeretenoItem> extends ItemSheetData<TItem> {
    itemType: string | null;
    item: TItem;
    data: TItem["system"];
    isPhysical: boolean;
    description: string;
    // system: VeretenoItemSystemData;
}

interface ItemSheetOptions extends DocumentSheetOptions {
    hasSidebar: boolean;
}

export { VeretenoItemSheet };
export type { VeretenoItemSheetData, ItemSheetOptions };