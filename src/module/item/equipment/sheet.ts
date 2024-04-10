import { PhysicalVeretnoItemSheet, PhysicalVeretnoItemSheetData } from "../physical-item/sheet";
import { VeretenoEquipment } from "./document";

class VeretenoEquipmentSheet extends PhysicalVeretnoItemSheet<VeretenoEquipment> {
    override async getData(options?: Partial<DocumentSheetOptions>): Promise<VeretenoEquipmentSheetData> {
        const sheetData = await super.getData(options);

        const { item } = this;

        const result: VeretenoEquipmentSheetData = {
            ...sheetData,
        };

        return result;
    }

    get template() {
        return `systems/vereteno/templates/sheets/items/equipment-sheet.hbs`;
    }
}

interface VeretenoEquipmentSheetData extends PhysicalVeretnoItemSheetData<VeretenoEquipment> {
}

export { VeretenoEquipmentSheet };
export type { VeretenoEquipmentSheetData };