export class VeretenoItemSheet extends ItemSheet {
    get template() {
        return `systems/vereteno/templates/sheets/${this.item.type}-sheet.hbs`;
    }

    getData(){
        const context = super.getData();
        
        const itemData = context.data;
        
        context.system = itemData.system;
        context.flags = itemData.flags;
        context.config = CONFIG.vereteno;
        context.cssClass = `vereteno-item-${this.item.type}-sheet`
    
        return context;
    }
}