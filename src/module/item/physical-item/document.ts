import { VeretenoItem } from "..";

class PhysicalVeretenoItem<TParent extends VeretenoActor | null = VeretenoActor | null> extends VeretenoItem<TParent> {
    get weight() {
        return this.system.weight || 0;
    }

    get price() {
        return this.system.price || 0;
    }
}

interface PhysicalVeretenoItem<TParent extends VeretenoActor | null = VeretenoActor | null> extends VeretenoItem<TParent> {
    system: PhysicalVeretenoItemSystemData;
}

export { PhysicalVeretenoItem };