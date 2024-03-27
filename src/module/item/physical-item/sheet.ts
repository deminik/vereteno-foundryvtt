import { PhysicalVeretenoItem } from "../index";
import { VeretenoItemSheet, VeretenoItemSheetData } from "../base/sheet";

class PhysicalVeretnoItemSheet<TItem extends PhysicalVeretenoItem> extends VeretenoItemSheet<TItem> {
    override async getData(options?: Partial<DocumentSheetOptions>): Promise<PhysicalVeretnoItemSheetData<TItem>> {
        const sheetData = await super.getData(options);
        const { item } = this;

        return {
            ...sheetData,
            isPhysical: true,
            weight: item.weight,
            price: item.price
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