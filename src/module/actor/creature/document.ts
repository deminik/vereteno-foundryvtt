import { VeretenoRollData } from "$module/data";
import { PhysicalVeretenoItem, VeretenoArmor, VeretenoItem } from "$module/item";
import { VeretenoItemType } from "$module/item/base/data";
import { VeretenoEquipment } from "$module/item/equipment/document";
import { AttackType, WeaponType } from "$module/item/weapon/data";
import { VeretenoWeapon } from "$module/item/weapon/document";
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

    get Items(): VeretenoEquipment[] {
        let items = this.items.map(x => x as unknown as PhysicalVeretenoItem);

        items = items
            .filter(x => !this.Armors.find(a => a.id == x.id))
            .filter(x => !this.Weapons.find(w => w.id == x.id));

        return items;
    }

    get EquippedItems(): VeretenoEquipment[] {
        return this.Items.filter(x => x.system.isEquipped);
    }

    async getAttributeRollData(key: string): Promise<VeretenoRollData> {
        const attribute = this.Attributes[key];
        const result = new VeretenoRollData();
        if (attribute == null) {
            return result;
        }

        const value = attribute.value;
        const bonuses = 0;
        result.pool = value + bonuses;

        return result;
    }

    async getSkillRollData(key: string): Promise<VeretenoRollData> {
        const result = new VeretenoRollData();

        const skill = this.Skills[key];
        if (skill == null) {
            return result;
        }

        const attributeRollData = await this.getAttributeRollData(skill.attribute);

        const value = skill.value;
        const bonuses = 0;
        result.pool = attributeRollData.pool + value + bonuses;

        return result;
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

    async getArmorRollData(itemId: string): Promise<VeretenoRollData | null> {
        const result = new VeretenoRollData();
        let item = (this.items.get(itemId) as unknown as VeretenoArmor);

        if (!item) {
            return null;
        }

        result.pool = item.system.durability

        return result;
    }

    async getInitiativeRollData(itemId: string): Promise<VeretenoRollData> {
        let item = (this.items.get(itemId) as unknown as VeretenoWeapon);

        let skill = this.Skills.agility;

        let bonuses = 0;

        const result = new VeretenoRollData();
        result.pool = 1;
        result.bonus = skill.value + item.system.modifier + bonuses;

        return result;
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
    Items: VeretenoEquipment[];
}

export { VeretenoCreature }