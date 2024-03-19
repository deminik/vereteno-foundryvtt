import { BaseVeretenoActorSource, VeretenoActorSource, VeretenoActorSystemData, VeretenoActorSystemSource } from "../base/data";
import { CharacterSource } from "../character/data";
import { MonsterSource } from "../monster/data";
import { NpcSource } from "../npc/data";

type BaseCreatureSource<
    TType extends CreatureActorType,
    TSystemSource extends VeretenoCreatureSystemSource,
> = BaseVeretenoActorSource<TType, TSystemSource>;

interface VeretenoCreatureSystemSource extends VeretenoActorSystemSource {
    stats: {
        hitPoints: Stat,
        willPoints: Stat,
    };

    attributes: {
        constitution: Attribute,
        intelligence: Attribute,
        dexterity: Attribute,
        empathy: Attribute,
    };

    skills: {
        melee: Skill,
        strength: Skill,
        agility: Skill,
        piloting: Skill,
        stealth: Skill,
        ranged: Skill,
        cybershamanism: Skill,
        survival: Skill,
        medicine: Skill,
        observation: Skill,
        science: Skill,
        mechanics: Skill,
        manipulation: Skill,
        leadership: Skill,
        witchcraft: Skill,
        culture: Skill,
    };
}

interface VeretenoCreatureSystemData extends VeretenoActorSystemData {

}

type CreatureSource = CharacterSource | MonsterSource | NpcSource;

type CreatureActorType = | "character" | "monster" | "npc";

interface Stat {
    value: number;
    min: number;
    max: number;
}

enum StatType {
    None = "none",
    HitPoints = "hitPoints",
    WillPoints = "willPoints",
    Reputation = "reputation",
}

interface Attribute {
    value: number;
    min: number;
    max: number;
}

enum AttributeType {
    None = "none",
    Constitution = "constitution",
    Intelligence = "intelligence",
    Dexterity = "dexterity",
    Empathy = "empathy",
}

enum SkillCategoryType {
    None = "none",
    General = "general",
    Professional = "professional",
}

interface Skill {
    value: number;
    min: number;
    max: number;
    category: SkillCategoryType,
    attribute: AttributeType,
}

export type { CreatureSource, BaseCreatureSource, VeretenoCreatureSystemSource, VeretenoCreatureSystemData }
export type { Stat, Attribute, Skill }
export { CreatureActorType, StatType, AttributeType, SkillCategoryType, }