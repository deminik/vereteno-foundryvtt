import { SkillType } from "$common";
import { BasePhysicalItemSource, PhysicalSystemSource, PhysicalVeretenoItemSystemData } from "../physical-item/data";

interface VeretenoWeaponSystemData extends PhysicalVeretenoItemSystemData {
    modifier: number;
    damage: number;
    initiative: number;
    crit: number;
    weaponType: WeaponType,
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
    weaponType: WeaponType,
    attackWith: SkillType,
    range: RangeType
}

enum WeaponType {
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

enum AttackType {
    None = "none",
    Regular = "regular",
    Power = "power",
    Light = "light",
    Aimed = "aimed",
    Hip = "hip",
    Burst = "burst"
}

export { WeaponType, RangeType, AttackType }
export { VeretenoWeaponSystemData, WeaponSource }