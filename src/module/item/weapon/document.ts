import { PhysicalVeretenoItem } from "../index";

class VeretenoWeapon<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {

}

interface VeretenoWeapon<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {
    system: VeretenoWeaponSystemData;
}

export { VeretenoWeapon }