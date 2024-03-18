import { VeretenoItem } from "..";

class PhysicalVeretenoItem<TParent extends VeretenoActor | null = VeretenoActor | null> extends VeretenoItem<TParent> {

}

interface PhysicalVeretenoItem<TParent extends VeretenoActor | null = VeretenoActor | null> extends VeretenoItem<TParent> {
    system: PhysicalVeretenoItemSystemData;
}

export { PhysicalVeretenoItem };