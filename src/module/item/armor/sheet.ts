import { PhysicalVeretnoItemSheet, PhysicalVeretnoItemSheetData } from "../physical-item/sheet";
import { VeretenoArmor } from "./document";

class VeretenoArmorSheet extends PhysicalVeretnoItemSheet<VeretenoArmor> {
    override async getData(options?: Partial<DocumentSheetOptions>): Promise<VeretenoArmorSheetData> {
        const sheetData = await super.getData(options);

        const { item } = this;

        const result = {
            ...sheetData,
            armorClass: 0,
            quality: 0,
            durability: 0
        };

        return result;
    }
}

interface VeretenoArmorSheetData extends PhysicalVeretnoItemSheetData<VeretenoArmor> {
    armorClass: number;
    quality: number;
    durability: number | null;
}

export { VeretenoArmorSheet };
export type { VeretenoArmorSheetData };