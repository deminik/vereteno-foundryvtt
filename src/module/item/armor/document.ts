import { PhysicalVeretenoItem } from "../index";

class VeretenoArmor<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {

}

interface VeretenoArmor<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {
    system: VeretenoArmorSystemData;
}

export { VeretenoArmor }