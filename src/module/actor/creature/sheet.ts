import { VeretenoCreature } from "../index";
import { VeretenoActorSheet, VeretenoActorSheetData } from "../base/sheet";
import { AttributeWithSkills, AttributesBlock, ItemActionInfo, Skill, SkillsBlock, Stat, StatsBlock } from "./data";
import { VeretenoRollData } from "../base/data";
import { VeretenoRollOptions, VeretenoRollType } from "$module/data";
import { VeretenoRoller } from "$module/utils/vereteno-roller";
import { VeretenoWeapon } from "$module/item/weapon/document";
import { PhysicalVeretenoItem, VeretenoArmor, VeretenoItem } from "$module/item";
import { VeretenoItemType } from "$module/item/base/data";
import { AttackType } from "$module/item/weapon/data";

abstract class VeretenoCreatureSheet<TActor extends VeretenoCreature> extends VeretenoActorSheet<TActor>{
    override async getData(options: Partial<DocumentSheetOptions> = {}): Promise<VeretenoCreatureSheetData<TActor>> {
        const sheetData = await super.getData(options);

        const { actor } = this;

        for (let [k, v] of Object.entries(actor.Stats)) {
            (v as Stat).label = game.i18n.localize(`vereteno.stat.${k}`);
        }

        for (let [k, v] of Object.entries(actor.Attributes)) {
            (v as AttributeWithSkills).label = game.i18n.localize(`vereteno.attribute.${k}`);
            (v as AttributeWithSkills).skills = {};

            for (let [k1, v1] of Object.entries(actor.Skills).filter(x => x[1].attribute === k)) {
                (v1 as Skill).label = game.i18n.localize(`vereteno.skill.${k1}`);
                (v as AttributeWithSkills).skills[k1] = v1;
            }
        }

        const equippedWeapons = actor.EquippedWeapons.map(x => {
            switch (x.attackType) {
                case AttackType.Brawling:
                    x.system["isBrawling"] = true;
                    break;

                case AttackType.Melee:
                    x.system["isMelee"] = true;
                    break;

                case AttackType.Ranged:
                    x.system["isRanged"] = true;
                    break;

                default: break;
            }

            return x;
        })

        return {
            ...sheetData,
            stats: actor.Stats,
            attributes: actor.Attributes,
            skills: actor.Skills,
            maxHp: actor.MaxHp,
            maxWp: actor.MaxWp,
            weapons: actor.Weapons,
            equippedWeapons: equippedWeapons,
            armors: actor.Armors,
            equippedArmor: actor.EquippedArmor,
        }
    }

    override activateListeners($html: JQuery): void {
        super.activateListeners($html);
        const html = $html[0];

        $html.on('click', '.skill-check', this.#onSkillCheckRoll.bind(this));
        $html.on('click', '.item-action', this.#onItemAction.bind(this));

        $html.on('click', '.armor-action', this.#onArmorAction.bind(this));

        // html.addEventListener('click', '.item-action', this.#onItemAction.bind(this));
        // html.on('click', '.weapon-action', this.#onWeaponAction.bind(this));
    }

    async #onSkillCheckRoll(event: MouseEvent) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = (element as HTMLAnchorElement)?.dataset;

        const { actor } = this;

        let { label, rollKey, rollType } = dataset;

        if (rollKey == null || rollType == null) {
            return;
        }

        let rollData: VeretenoRollData;
        if (rollType == "attribute") {
            rollData = await actor.getAttributeRollData(rollKey);
        } else {
            rollData = await actor.getSkillRollData(rollKey);
        }

        let messageData = {
            userId: game.user._id || undefined,
            speaker: ChatMessage.getSpeaker(),
            flavor: label || '',
            sound: CONFIG.sounds.dice,
            blind: false
        };

        const rollOptions: VeretenoRollOptions = {
            type: VeretenoRollType.Regular,
            messageData: messageData,
            rollData: rollData
        }

        const roller = new VeretenoRoller();
        await roller.roll(rollOptions);
    }

    async #onWeaponAction(event: MouseEvent) {

    }

    async #onItemAction(event: MouseEvent) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = (element as HTMLAnchorElement)?.dataset;

        const { itemType, actionType, itemId } = dataset;
        const itemInfo: ItemActionInfo = { type: (itemType! as VeretenoItemType), id: itemId! };

        switch (actionType) {
            case 'remove':
                return await this.removeItem(itemInfo);
                break;

            case 'equip':
                return await this.equipItem(itemInfo);
                break;

            case 'unequip':
                return await this.unequipItem(itemInfo);
                break;

            default:
                return;
        }
    }

    async removeItem(itemInfo: ItemActionInfo): Promise<void> {
        const item = this.actor.items.get(itemInfo.id);
        if (!item) {
            return;
        }

        this.actor.deleteEmbeddedDocuments("Item", [item._id!]);
    }

    async equipItem(itemInfo: ItemActionInfo): Promise<void> {
        switch (itemInfo.type) {
            case 'weapon':
                return await this.equipWeapon(itemInfo.id);
                break;

            case 'armor':
                return await this.equipArmor(itemInfo.id);
                break;

            default:
                return;
        }
    }

    async equipWeapon(itemId: string): Promise<void> {
        const item = this.actor.items.find(x => x._id === itemId);
        if (!item) {
            return;
        }

        // предупреждение, если экипировано больше 2 элементов оружия.

        await this.actor.updateEmbeddedDocuments("Item", [
            { _id: item._id!, "system.isEquipped": true },
        ]);
    }

    async equipArmor(itemId: string): Promise<void> {
        const equippedArmor = this.actor.items.find(x => (x as unknown as VeretenoArmor).system.isEquipped && x.type === VeretenoItemType.Armor);
        if (equippedArmor) {
            // предупреждение, если броня уже экипирована.

            return;
        }

        const item = this.actor.items.find(x => x._id === itemId);
        if (!item) {
            return;
        }

        await this.actor.updateEmbeddedDocuments("Item", [
            { _id: item._id!, "system.isEquipped": true },
        ]);
    }

    async unequipItem(itemInfo: ItemActionInfo): Promise<void> {
        const item = this.actor.items.find(x => x._id === itemInfo.id
            && (x as unknown as PhysicalVeretenoItem).system
            && (x as unknown as PhysicalVeretenoItem).system.isEquipped
        );

        if (!item) {
            return;
        }

        await this.actor.updateEmbeddedDocuments("Item", [
            { _id: item._id!, "system.isEquipped": false },
        ]);
    }

    async #onArmorAction(event: MouseEvent) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = (element as HTMLAnchorElement)?.dataset;

        const { itemType, actionType, itemId } = dataset;


    }
}

interface VeretenoCreatureSheetData<TActor extends VeretenoCreature> extends VeretenoActorSheetData<TActor> {
    stats: StatsBlock;
    attributes: AttributesBlock;
    skills: SkillsBlock;
    maxHp: number;
    maxWp: number;
    weapons: VeretenoWeapon[];
    equippedWeapons: VeretenoWeapon[];
    armors: VeretenoArmor[];
    equippedArmor: VeretenoArmor;
}

export { VeretenoCreatureSheet }
export type { VeretenoCreatureSheetData }