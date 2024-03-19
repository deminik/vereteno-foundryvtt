interface VeretenoItemSystemData {
    description: string;
}

type ItemSystemSource = {
    description: string;
}

type BaseItemSourcePF2e<
    TType extends ItemType,
    TSystemSource extends ItemSystemSource = ItemSystemSource,
> = foundry.documents.ItemSource<TType, TSystemSource> & {
};

type NonPhysicalItemType = | "feature";

type PhysicalItemType = | "armor" | "weapon";

type ItemType = NonPhysicalItemType | PhysicalItemType;

type PhysicalItemSource = | ArmorSource | WeaponSource;




type VeretenoItemSource = | PhysicalItemSource;