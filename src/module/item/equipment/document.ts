import { VeretenoActor } from "$module/actor";
import { PhysicalVeretenoItem } from "../index";
import { VeretenoEquipmentSystemData } from "./data";

class VeretenoEquipment<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {
}

interface VeretenoEquipment<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {
    system: VeretenoEquipmentSystemData;
}

export { VeretenoEquipment }