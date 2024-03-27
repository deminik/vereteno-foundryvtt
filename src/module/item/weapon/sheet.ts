import { SkillType } from "$common";
import { IdLabelType } from "$module/data";
import { PhysicalVeretnoItemSheet, PhysicalVeretnoItemSheetData } from "../physical-item/sheet";
import { WeaponType, RangeType } from "./data";
import { VeretenoWeapon } from "./document";

class VeretenoWeaponSheet extends PhysicalVeretnoItemSheet<VeretenoWeapon>{
    override async getData(options?: Partial<DocumentSheetOptions>): Promise<VeretenoWeaponSheetData> {
        const sheetData = await super.getData(options);

        const { item } = this;

        var weaponTypes = Object.values(WeaponType).map((e, i) => { return { id: i, label: game.i18n.localize(`vereteno.weaponType.${e}`), type: e } })
        var rangeTypes = Object.values(RangeType).map((e, i) => { return { id: i, label: game.i18n.localize(`vereteno.range.${e}`), type: e } })
        var skillTypes = Object.values(SkillType).map((e, i) => { return { id: i, label: game.i18n.localize(`vereteno.skill.${e}`), type: e } })

        const result: VeretenoWeaponSheetData = {
            ...sheetData,
            modifier: item.modifier,
            weaponType: item.weaponType,
            attackWith: item.attackWith,
            crit: item.crit,
            damage: item.damage,
            initiative: item.initiative,
            range: item.range,
            weaponTypes: weaponTypes,
            ranges: rangeTypes,
            skills: skillTypes
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
    weaponType: WeaponType,
    weaponTypes: IdLabelType<WeaponType>[],
    attackWith: SkillType,
    skills: IdLabelType<SkillType>[];
    range: RangeType
    ranges: IdLabelType<RangeType>[];
}

export { VeretenoWeaponSheet };
export type { VeretenoWeaponSheetData }