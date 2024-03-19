import { PhysicalVeretnoItemSheet, PhysicalVeretnoItemSheetData } from "../physical-item/sheet";
import { VeretenoWeapon } from "./document";

class VeretenoWeaponSheet extends PhysicalVeretnoItemSheet<VeretenoWeapon>{
    override async getData(options?: Partial<DocumentSheetOptions>): Promise<VeretenoWeaponSheetData> {
        const sheetData = await super.getData(options);

        const { item } = this;

        const result: VeretenoWeaponSheetData = {
            ...sheetData,
            modifier: item.modifier,
            attackType: item.attackType,
            attackWith: item.attackWith,
            crit: item.crit,
            damage: item.damage,
            initiative: item.initiative,
            range: item.range,
        };

        return result;
    }

    get template() {
        return `systems/vereteno/templates/sheets/items/weapon-sheet.hbs`;
    }
}

interface VeretenoWeaponSheetData extends PhysicalVeretnoItemSheetData<VeretenoWeapon> {
    modifier: number;
    damage: number;
    initiative: number;
    crit: number;
    attackType: AttackType,
    attackWith: UsedSkill,
    range: RangeType
}

export { VeretenoWeaponSheet };
export type { VeretenoWeaponSheetData }