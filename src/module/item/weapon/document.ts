import { PhysicalVeretenoItem } from "../index";

class VeretenoWeapon<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {
    get modifier(): number {
        return this.system.modifier;
    }

    get damage(): number {
        return this.system.damage;
    }

    get initiative(): number {
        return this.system.initiative;
    }

    get crit(): number {
        return this.system.crit;
    }

    get attackType(): AttackType {
        return this.system.attackType;
    }

    get attackWith(): UsedSkill {
        return this.system.attackWith;
    }

    get range(): RangeType {
        return this.system.range;
    }
}

interface VeretenoWeapon<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {
    system: VeretenoWeaponSystemData;
}

export { VeretenoWeapon }