import { PhysicalVeretnoItemSheet, PhysicalVeretnoItemSheetData } from "../physical-item/sheet";
import { VeretenoWeapon } from "./document";

class VeretenoWeaponSheet extends PhysicalVeretnoItemSheet<VeretenoWeapon>{
    override async getData(options?: Partial<DocumentSheetOptions>): Promise<VeretenoWeaponSheetData> {
        const sheetData = await super.getData(options);

        const { item } = this;

        const result: VeretenoWeaponSheetData = {
            ...sheetData,
            modifier: item.system.modifier,
            attackType: item.system.attackType,
            attackWith: item.system.attackWith,
            crit: item.system.crit,
            damage: item.system.damage,
            initiative: item.system.initiative,
            range: item.system.range,
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