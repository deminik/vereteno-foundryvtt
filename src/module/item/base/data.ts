import { ArmorSource } from "../armor/data";
import { WeaponSource } from "../weapon/data";

interface VeretenoItemSystemData {
    [index: string]: any;
    description: string;
}

type ItemSystemSource = {
    description: string;
}

type BaseVeretenoItemSource<
    TType extends ItemType,
    TSystemSource extends ItemSystemSource = ItemSystemSource,
> = foundry.documents.ItemSource<TType, TSystemSource> & {
};

type NonPhysicalItemType = | "feature";

type PhysicalItemType = | "armor" | "weapon";

type ItemType = NonPhysicalItemType | PhysicalItemType;

type PhysicalItemSource = | ArmorSource | WeaponSource;

type VeretenoItemSource = | PhysicalItemSource;

enum VeretenoItemType {
    None = "none",
    Armor = "armor",
    Weapon = "weapon",
    Equipment = "equipment",
    Feature = "feature"
}

export type { VeretenoItemSource, VeretenoItemSystemData, ItemSystemSource, BaseVeretenoItemSource, PhysicalItemType }
export { VeretenoItemType }