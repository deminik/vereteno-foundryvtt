interface VeretenoWeaponSystemData extends PhysicalVeretenoItemSystemData {
    modifier: number;
    damage: number;
    initiative: number;
    crit: number;
    attackType: AttackType,
    attackWith: SkillType,
    range: RangeType
}

type WeaponSource = BasePhysicalItemSource<"weapon", WeaponSystemSource>;

// type WeaponItemSource<
//     TType extends PhysicalItemType,
//     TSystemSource extends WeaponSystemSource = WeaponSystemSource,
// > = BaseItemSourcePF2e<TType, TSystemSource>;

interface WeaponSystemSource extends PhysicalSystemSource {
    modifier: number;
    damage: number;
    initiative: number;
    crit: number;
    attackType: AttackType,
    attackWith: SkillType,
    range: RangeType
}

enum AttackType {
    None = "none",
    Brawling = "brawling",
    Melee = "melee",
    Ranged = "ranged"
}

enum RangeType {
    None = "none",
    PointBlank = "pointBlank",
    Close = "close",
    Medium = "medium",
    Long = "long",
    Utmost = "utmost"
}

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
    Culture = "culture"
};


export { AttackType, RangeType, SkillType }
export { VeretenoWeaponSystemData, WeaponSource }