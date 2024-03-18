import { PhysicalVeretenoItem } from "../index";
import { VeretenoItemSheet, VeretenoItemSheetData } from "../base/item-sheet";

class PhysicalVeretnoItemSheet<TItem extends PhysicalVeretenoItem> extends VeretenoItemSheet<TItem> {
    override async getData(options?: Partial<DocumentSheetOptions>): Promise<PhysicalVeretnoItemSheetData<TItem>> {
        const sheetData = await super.getData(options);
        const { item } = this;

        return {
            ...sheetData,
            isPhysical: true,
            weight: 1,
            price: 0
        }
    }
}

interface PhysicalVeretnoItemSheetData<TItem extends PhysicalVeretenoItem> extends VeretenoItemSheetData<TItem> {
    isPhysical: true;
    weight: number;
    price: number;
}

export { PhysicalVeretnoItemSheet };
export type { PhysicalVeretnoItemSheetData };