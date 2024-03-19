import { WeaponSource } from "../weapon/data";

interface VeretenoItemSystemData {
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

export type { VeretenoItemSource, VeretenoItemSystemData, ItemSystemSource, BaseVeretenoItemSource, PhysicalItemType }