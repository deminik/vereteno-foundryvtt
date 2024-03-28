import { SkillType } from "$common";
import { VeretenoActor } from "$module/actor";
import { PhysicalVeretenoItem } from "../index";
import { WeaponType, RangeType, VeretenoWeaponSystemData } from "./data";

class VeretenoWeapon<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {
    get Modifier(): number {
        return this.system.modifier;
    }

    get Damage(): number {
        return this.system.damage;
    }

    get Initiative(): number {
        return this.system.initiative;
    }

    get Crit(): number {
        return this.system.crit;
    }

    get WeaponType(): WeaponType {
        return this.system.weaponType || WeaponType.None;
    }

    get AttackWith(): SkillType {
        return this.system.attackWith || SkillType.None;
    }

    get Range(): RangeType {
        return this.system.range || RangeType.None;
    }

    get HasBurst(): boolean {
        return this.system.hasBurst || false;
    }
}

interface VeretenoWeapon<TParent extends VeretenoActor | null = VeretenoActor | null> extends PhysicalVeretenoItem<TParent> {
    system: VeretenoWeaponSystemData;
}

export { VeretenoWeapon }