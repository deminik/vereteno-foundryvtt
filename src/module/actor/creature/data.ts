import { IDictionary } from "$common";
import { BaseVeretenoActorSource, VeretenoActorSystemData, VeretenoActorSystemSource } from "../base/data";
import { CharacterSource } from "../character/data";
import { MonsterSource } from "../monster/data";
import { NpcSource } from "../npc/data";

type BaseCreatureSource<
    TType extends CreatureActorType,
    TSystemSource extends VeretenoCreatureSystemSource,
> = BaseVeretenoActorSource<TType, TSystemSource>;

interface VeretenoCreatureSystemSource extends VeretenoActorSystemSource {
    stats: StatsBlock;
    attributes: AttributesBlock;
    skills: SkillsBlock;
}

interface VeretenoCreatureSystemData extends VeretenoActorSystemData {
    stats: StatsBlock;
    attributes: AttributesBlock;
    skills: SkillsBlock;
}

interface StatsBlock {
    hitPoints: Stat;
    willPoints: Stat;
}

interface AttributesBlock extends IDictionary<Attribute> {
    constitution: Attribute;
    intelligence: Attribute;
    dexterity: Attribute;
    empathy: Attribute;
}

interface AttributesWithSkillsBlock {
    constitution: AttributeWithSkills;
    intelligence: AttributeWithSkills;
    dexterity: AttributeWithSkills;
    empathy: AttributeWithSkills;
}

interface SkillsBlock extends IDictionary<Skill> {
    melee: Skill;
    strength: Skill;
    agility: Skill;
    piloting: Skill;
    stealth: Skill;
    ranged: Skill;
    cybershamanism: Skill;
    survival: Skill;
    medicine: Skill;
    observation: Skill;
    science: Skill;
    mechanics: Skill;
    manipulation: Skill;
    leadership: Skill;
    witchcraft: Skill;
    culture: Skill;
}

type CreatureSource = CharacterSource | MonsterSource | NpcSource;

type CreatureActorType = | "character" | "monster" | "npc";

interface Stat {
    value: number;
    min: number;
    max: number;
    label: string;
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
    label: string;
}

interface AttributeWithSkills extends Attribute {
    skills: IDictionary<Skill>;
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
    category: SkillCategoryType;
    attribute: AttributeType;
    label: string;
}

export type { CreatureSource, BaseCreatureSource, VeretenoCreatureSystemSource, VeretenoCreatureSystemData }
export type { Stat, Attribute, Skill, StatsBlock, AttributesBlock, SkillsBlock, AttributeWithSkills }
export { CreatureActorType, StatType, AttributeType, SkillCategoryType }