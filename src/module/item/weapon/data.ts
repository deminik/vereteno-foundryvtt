interface VeretenoWeaponSystemData extends PhysicalVeretenoItemSystemData {
    modifier: number;
    damage: number;
    initiative: number;
    crit: number;
    attackType: AttackType,
    attackWith: UsedSkill,
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
    attackWith: UsedSkill,
    range: RangeType
}

type AttackType = "brawling" | "melee" | "ranged";

type UsedSkill =
    "melee" |
    "strength" |
    "agility" |
    "piloting" |
    "stealth" |
    "ranged" |
    "cybershamanism" |
    "survival" |
    "medicine" |
    "observation" |
    "science" |
    "mechanics" |
    "manipulation" |
    "leadership" |
    "witchcraft" |
    "culture";

type RangeType =
    "pointBlank" |
    "close" |
    "medium" |
    "long" |
    "utmost";