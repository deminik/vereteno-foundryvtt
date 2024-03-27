import { VeretenoArmor, VeretenoItem } from "$module/item";
import { VeretenoItemType } from "$module/item/base/data";
import { AttackType, WeaponType } from "$module/item/weapon/data";
import { VeretenoWeapon } from "$module/item/weapon/document";
import { VeretenoRollData } from "../base/data";
import { VeretenoActor } from "../index";
import { AttributesBlock, SkillsBlock, StatsBlock, VeretenoCreatureSystemData, WeaponAttackInfo } from "./data";

class VeretenoCreature<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoActor<TParent>{
    get Stats(): StatsBlock {
        const hp = this.system.stats.hitPoints.value;
        if (hp > this.MaxHp) {
            this.system.stats.hitPoints.value = this.MaxHp;
        }

        const wp = this.system.stats.willPoints.value;
        if (wp > this.MaxWp) {
            this.system.stats.willPoints.value = this.MaxWp;
        }

        return this.system.stats;
    }

    get Attributes(): AttributesBlock {
        return this.system.attributes;
    }

    get Skills(): SkillsBlock {
        return this.system.skills;
    }

    get MaxHp(): number {
        const constitutionValue = this.Attributes.constitution.value;
        const dexterityValue = this.Attributes.dexterity.value;
        const bonuses = 0;

        return constitutionValue + dexterityValue + bonuses;
    }

    get MaxWp(): number {
        const intelligenceValue = this.Attributes.intelligence.value;
        const empathyValue = this.Attributes.empathy.value;
        const bonuses = 0;

        return intelligenceValue + empathyValue + bonuses;
    }

    /**
     * Имеющееся оружие.
     */
    get Weapons(): VeretenoWeapon[] {
        return this.items.map(x => x as unknown as VeretenoItem).filter(x => x.type == VeretenoItemType.Weapon).map(x => x as VeretenoWeapon);
    }

    /**
     * Экипированное оружие.
     */
    get EquippedWeapons(): VeretenoWeapon[] {
        return this.Weapons.filter(x => x.system.isEquipped);
    }

    /**
     * Имеющаяся броня.
     */
    get Armors(): VeretenoArmor[] {
        return this.items.map(x => x as unknown as VeretenoItem).filter(x => x.type == VeretenoItemType.Armor).map(x => x as VeretenoArmor);
    }

    /**
     * Экипированная броня.
     */
    get EquippedArmor(): VeretenoArmor {
        return this.Armors.filter(x => x.system.isEquipped)[0] || null;
    }

    async getAttributeRollData(key: string): Promise<VeretenoRollData> {
        const attribute = this.Attributes[key];
        if (attribute == null) {
            return { dice: 'd20', pool: 0 };
        }

        const value = attribute.value;
        const bonuses = 0;
        const pool = value + bonuses;

        return { dice: 'd20', pool: pool };
    }

    async getSkillRollData(key: string): Promise<VeretenoRollData> {
        const skill = this.Skills[key];
        if (skill == null) {
            return { dice: 'd20', pool: 0 };
        }

        const attributeRollData = await this.getAttributeRollData(skill.attribute);

        const value = skill.value;
        const bonuses = 0;
        const pool = attributeRollData.pool + value + bonuses;

        return { dice: 'd20', pool: pool };
    }

    async getWeaponRollData(weaponData: WeaponAttackInfo): Promise<VeretenoRollData> {
        let item = this.items.get(weaponData.id) as unknown as VeretenoWeapon;

        let itemSkill = item.system.attackWith;
        let skillRollData = await this.getSkillRollData(itemSkill);

        let weaponAttackTypeModifier = this.getWeaponAttackTypeModifier(weaponData);

        let weaponAttackModifier = item.system.modifier;

        let weaponDamage = item.system.damage;

        const rollData: VeretenoRollData = mergeObject(skillRollData,
            {
                pool: skillRollData.pool + weaponAttackTypeModifier + weaponAttackModifier,
                weaponDamage,
                weaponAttackModifier
            });

        if (weaponData.attackType == AttackType.Burst) {
            rollData.isSerial = true;
        }

        return rollData;
    }

    getWeaponAttackTypeModifier(weaponData: WeaponAttackInfo): number {
        if (weaponData.weaponType == WeaponType.Melee || weaponData.weaponType == WeaponType.Brawling) {
            if (weaponData.attackType == AttackType.Power) {
                return 2;
            }

            if (weaponData.attackType == AttackType.Light) {
                return -2;
            }

            return 0;
        }

        if (weaponData.weaponType == WeaponType.Ranged) {
            if (weaponData.attackType == AttackType.Aimed) {
                return 2;
            }

            if (weaponData.attackType == AttackType.Hip) {
                return -2;
            }

            if (weaponData.attackType == AttackType.Burst) {
                return -2;
            }

            return 0;
        }

        return 0;
    }

    async getArmorRollData(itemId: string): Promise<VeretenoRollData> {
        let item = (this.items.get(itemId) as unknown as VeretenoArmor);

        if (!item) {
            return;
        }

        let rollData: VeretenoRollData = {
            dice: "d20",
            pool: item.system.durability
        };

        return rollData;
    }

    async getInitiativeRollData(itemId: string): Promise<VeretenoRollData> {
        let item = (this.items.get(itemId) as unknown as VeretenoWeapon);

        let skill = this.Skills.agility;

        let bonuses = 0;

        let rollData: VeretenoRollData = {
            dice: "d20",
            pool: 1,
            bonus: skill.value + item.system.modifier + bonuses
        };

        return rollData;
    }

    async equipWeapon() { }

    async equipArmor() { }

    async unequipItem() { }
}

interface VeretenoCreature<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoActor<TParent> {
    system: VeretenoCreatureSystemData,
    Stats: StatsBlock;
    Attributes: AttributesBlock;
    Skills: SkillsBlock;
    MaxHp: number;
    MaxWp: number;
    Weapons: VeretenoWeapon[];
    Armors: VeretenoArmor[];
}

export { VeretenoCreature }