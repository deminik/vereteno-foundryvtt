export class VeretenoItemSheet extends ItemSheet {
    get template() {
        return `systems/vereteno/templates/sheets/${this.item.data.type}-sheet.hbs`;
    }
}