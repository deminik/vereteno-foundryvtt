import { PhysicalVeretnoItemSheet, PhysicalVeretnoItemSheetData } from "../physical-item/sheet";
import { VeretenoArmor } from "./document";

class VeretenoArmorSheet extends PhysicalVeretnoItemSheet<VeretenoArmor> {
    override async getData(options?: Partial<DocumentSheetOptions>): Promise<VeretenoArmorSheetData> {
        const sheetData = await super.getData(options);

        const { item } = this;

        const result: VeretenoArmorSheetData = {
            ...sheetData,
            armorClass: item.system.armorClass || 0,
            quality: item.system.quality || 0,
            durability: item.system.durability || 0
        };

        return result;
    }

    get template() {
        return `systems/vereteno/templates/sheets/items/armor-sheet.hbs`;
    }
}

interface VeretenoArmorSheetData extends PhysicalVeretnoItemSheetData<VeretenoArmor> {
    armorClass: number;
    quality: number;
    durability: number | null;
}

export { VeretenoArmorSheet };
export type { VeretenoArmorSheetData };