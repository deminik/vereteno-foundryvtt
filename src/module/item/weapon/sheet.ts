import { SkillType } from "$common";
import { IdLabelType } from "$module/data";
import { PhysicalVeretnoItemSheet, PhysicalVeretnoItemSheetData } from "../physical-item/sheet";
import { AttackType, RangeType } from "./data";
import { VeretenoWeapon } from "./document";

class VeretenoWeaponSheet extends PhysicalVeretnoItemSheet<VeretenoWeapon>{
    override async getData(options?: Partial<DocumentSheetOptions>): Promise<VeretenoWeaponSheetData> {
        const sheetData = await super.getData(options);

        const { item } = this;

        var attackTypes = Object.values(AttackType).map((e, i) => { return { id: i, label: game.i18n.localize(`vereteno.attack.${e}`), type: e } })
        var rangeTypes = Object.values(RangeType).map((e, i) => { return { id: i, label: game.i18n.localize(`vereteno.range.${e}`), type: e } })
        var skillTypes = Object.values(SkillType).map((e, i) => { return { id: i, label: game.i18n.localize(`vereteno.skill.${e}`), type: e } })

        const result: VeretenoWeaponSheetData = {
            ...sheetData,
            modifier: item.modifier,
            attackType: item.attackType,
            attackWith: item.attackWith,
            crit: item.crit,
            damage: item.damage,
            initiative: item.initiative,
            range: item.range,
            attackTypes: attackTypes,
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
    attackType: AttackType,
    attackTypes: IdLabelType<AttackType>[],
    attackWith: SkillType,
    skills: IdLabelType<SkillType>[];
    range: RangeType
    ranges: IdLabelType<RangeType>[];
}

export { VeretenoWeaponSheet };
export type { VeretenoWeaponSheetData }