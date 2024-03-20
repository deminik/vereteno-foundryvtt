import { VeretenoRollData } from "../base/data";
import { VeretenoActor } from "../index";
import { AttributeType, AttributesBlock, Skill, SkillsBlock, StatsBlock, VeretenoCreatureSystemData } from "./data";

class VeretenoCreature<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoActor<TParent>{
    get Stats(): StatsBlock {
        const hp = this.system.stats.hitPoints.value;
        if (hp > this.MaxHp) {
            this.system.stats.hitPoints.value = this.MaxHp;
        }

        const wp = this.system.stats.willPoints.value;
        if (wp > this.MaxWp) {
            this.system.stats.willPoints.value = this.MaxWp;
        }

        return this.system.stats;
    }

    get Attributes(): AttributesBlock {
        return this.system.attributes;
    }

    get Skills(): SkillsBlock {
        return this.system.skills;
    }

    get MaxHp(): number {
        const constitutionValue = this.Attributes.constitution.value;
        const dexterityValue = this.Attributes.dexterity.value;
        const bonuses = 0;

        return constitutionValue + dexterityValue + bonuses;
    }

    get MaxWp(): number {
        const intelligenceValue = this.Attributes.intelligence.value;
        const empathyValue = this.Attributes.empathy.value;
        const bonuses = 0;

        return intelligenceValue + empathyValue + bonuses;
    }

    async getAttributeRollData(key: string): Promise<VeretenoRollData> {
        const attribute = this.Attributes[key];
        if (attribute == null) {
            return { dice: 'd20', pool: 0 };
        }

        const value = attribute.value;
        const bonuses = 0;
        const pool = value + bonuses;

        return { dice: 'd20', pool: pool };
    }

    async getSkillRollData(key: string): Promise<VeretenoRollData> {
        const skill = this.Skills[key];
        if (skill == null) {
            return { dice: 'd20', pool: 0 };
        }

        const attributeRollData = await this.getAttributeRollData(skill.attribute);

        const value = skill.value;
        const bonuses = 0;
        const pool = attributeRollData.pool + value + bonuses;

        return { dice: 'd20', pool: pool };
    }

    async getWeaponRollData() { }

    async getArmorRollData() { }

    async getInitiativeRollData() { }
}

interface VeretenoCreature<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoActor<TParent> {
    system: VeretenoCreatureSystemData,
    Stats: StatsBlock;
    Attributes: AttributesBlock;
    Skills: SkillsBlock;
    MaxHp: number;
    MaxWp: number;
}

export { VeretenoCreature }