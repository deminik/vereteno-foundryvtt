interface VeretenoArmorSystemData extends PhysicalVeretenoItemSystemData {
    armorClass: number;
    quality: number;
    durability: number;
}

type ArmorSource = BasePhysicalItemSource<"armor", ArmorSystemSource>;

interface ArmorSystemSource extends PhysicalSystemSource {
    armorClass: number;
    quality: number;
    durability: number;
}