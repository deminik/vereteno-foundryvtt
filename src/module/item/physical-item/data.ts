interface PhysicalVeretenoItemSystemData extends VeretenoItemSystemData {
    weight: number;
    price: number;
}

type BasePhysicalItemSource<
    TType extends PhysicalItemType,
    TSystemSource extends PhysicalSystemSource = PhysicalSystemSource,
> = BaseItemSourcePF2e<TType, TSystemSource>;

interface PhysicalSystemSource extends ItemSystemSource {
    price: number;
    weight: number;
}