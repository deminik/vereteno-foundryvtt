import { BasePhysicalItemSource, PhysicalSystemSource, PhysicalVeretenoItemSystemData } from "../physical-item/data";

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

export { VeretenoArmorSystemData, ArmorSource }