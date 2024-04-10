import { BasePhysicalItemSource, PhysicalSystemSource, PhysicalVeretenoItemSystemData } from "../physical-item/data";

interface VeretenoEquipmentSystemData extends PhysicalVeretenoItemSystemData {
}

type EquipmentSource = BasePhysicalItemSource<"equipment", EquipmentSystemSource>;

interface EquipmentSystemSource extends PhysicalSystemSource {
}

export { VeretenoEquipmentSystemData, EquipmentSource }