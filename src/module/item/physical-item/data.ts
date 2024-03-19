import { BaseVeretenoItemSource, ItemSystemSource, PhysicalItemType, VeretenoItemSystemData } from "../base/data";

interface PhysicalVeretenoItemSystemData extends VeretenoItemSystemData {
    weight: number;
    price: number;
}

type BasePhysicalItemSource<
    TType extends PhysicalItemType,
    TSystemSource extends PhysicalSystemSource = PhysicalSystemSource,
> = BaseVeretenoItemSource<TType, TSystemSource>;

interface PhysicalSystemSource extends ItemSystemSource {
    Price: number;
    Weight: number;
}

export type { BasePhysicalItemSource, PhysicalVeretenoItemSystemData, PhysicalSystemSource }