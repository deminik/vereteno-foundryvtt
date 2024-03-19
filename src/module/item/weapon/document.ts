import { SkillType } from "$common";
import { VeretenoActor } from "$module/actor";
import { PhysicalVeretenoItem } from "../index";
import { AttackType, RangeType, VeretenoWeaponSystemData } from "./data";

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
        return this.system.attackType || AttackType.None;
    }

    get attackWith(): SkillType {
        return this.system.attackWith || SkillType.None;
    }

    get range(): RangeType {
        return this.system.range || RangeType.None;
    }
}

interface VeretenoWeapon<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {
    system: VeretenoWeaponSystemData;
}

export { VeretenoWeapon }