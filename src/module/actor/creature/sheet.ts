import { VeretenoCreature } from "../index";
import { VeretenoActorSheet, VeretenoActorSheetData } from "../base/sheet";
import { AttributeWithSkills, AttributesBlock, Skill, SkillsBlock, Stat, StatsBlock } from "./data";

abstract class VeretenoCreatureSheet<TActor extends VeretenoCreature> extends VeretenoActorSheet<TActor>{
    override async getData(options: Partial<DocumentSheetOptions> = {}): Promise<VeretenoCreatureSheetData<TActor>> {
        const sheetData = await super.getData(options);

        const { actor } = this;

        for (let [k, v] of Object.entries(actor.Stats)) {
            (v as Stat).label = game.i18n.localize(`vereteno.stat.${k}`);
        }

        for (let [k, v] of Object.entries(actor.Attributes)) {
            (v as AttributeWithSkills).label = game.i18n.localize(`vereteno.attribute.${k}`);
            (v as AttributeWithSkills).skills = {};

            for (let [k1, v1] of Object.entries(actor.Skills).filter(x => x[1].attribute === k)) {
                (v1 as Skill).label = game.i18n.localize(`vereteno.skill.${k1}`);
                (v as AttributeWithSkills).skills[k1] = v1;
            }
        }

        return {
            ...sheetData,
            stats: actor.Stats,
            attributes: actor.Attributes,
            skills: actor.Skills,
            maxHp: actor.MaxHp,
            maxWp: actor.MaxWp,
        }
    }
}

interface VeretenoCreatureSheetData<TActor extends VeretenoCreature> extends VeretenoActorSheetData<TActor> {
    stats: StatsBlock;
    attributes: AttributesBlock;
    skills: SkillsBlock;
    maxHp: number;
    maxWp: number;
}

export { VeretenoCreatureSheet }
export type { VeretenoCreatureSheetData }