export class VeretenoItemSheet extends ItemSheet {
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
        const context = super.getData();

        const itemData = context.data;

        context.system = itemData.system;
        context.flags = itemData.flags;
        context.config = CONFIG.vereteno;
        context.cssClass = `vereteno ${this.item.type}-sheet`

        return context;
    }
}