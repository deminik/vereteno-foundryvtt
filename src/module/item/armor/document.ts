import { PhysicalVeretenoItem } from "../index";

class VeretenoArmor<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {
    get armorClass(): number {
        return this.system.armorClass || 0;
    }

    get quality(): number {
        return this.system.quality || 0;
    }

    get maxDuarability(): number {
        return this.armorClass + this.quality;
    }

    get durability(): number {
        return this.system.durability || this.maxDuarability;
    }
}

interface VeretenoArmor<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {
    system: VeretenoArmorSystemData;
}

export { VeretenoArmor }