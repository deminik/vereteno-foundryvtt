import { VeretenoItem } from "./index";

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

    getData() {
        return super.getData();
        // const context = super.getData();

        // const itemData = context.data;

        // context.system = itemData.system;
        // context.flags = itemData.flags;
        // // context.config = CONFIG.vereteno;
        // context.cssClass = `vereteno ${this.item.type}-sheet`

        // return context;
    }
}

interface VeretenoItemSheetData<TItem extends VeretenoItem> extends ItemSheetData<TItem> {

}

interface ItemSheetOptions extends DocumentSheetOptions {
    hasSidebar: boolean;
}

export { VeretenoItemSheet };
export type { VeretenoItemSheetData, ItemSheetOptions };