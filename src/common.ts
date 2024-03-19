enum SkillType {
    None = "none",
    Melee = "melee",
    Strength = "strength",
    Agility = "agility",
    Piloting = "piloting",
    Stealth = "stealth",
    Ranged = "ranged",
    Cybershamanism = "cybershamanism",
    Survival = "survival",
    Medicine = "medicine",
    Observation = "observation",
    Science = "science",
    Mechanics = "mechanics",
    Manipulation = "manipulation",
    Leadership = "leadership",
    Witchcraft = "witchcraft",
    Culture = "culture",
};

interface IDicionary<T> {
    [index: string]: T
}

export { SkillType }
export type { IDicionary }