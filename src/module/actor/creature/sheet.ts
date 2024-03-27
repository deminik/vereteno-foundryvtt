import { VeretenoCreature } from "../index";
import { VeretenoActorSheet, VeretenoActorSheetData } from "../base/sheet";
import { AttributeWithSkills, AttributesBlock, ItemActionInfo, Skill, SkillsBlock, Stat, StatsBlock, WeaponAttackInfo } from "./data";
import { VeretenoChatOptions, VeretenoMessageData, VeretenoRollData, VeretenoRollOptions, VeretenoRollType } from "$module/data";
import { VeretenoRoller } from "$module/utils/vereteno-roller";
import { VeretenoWeapon } from "$module/item/weapon/document";
import { PhysicalVeretenoItem, VeretenoArmor, VeretenoItem } from "$module/item";
import { VeretenoItemType } from "$module/item/base/data";
import { AttackType, WeaponType } from "$module/item/weapon/data";
import { VeretenoRollDialog, VeretenoRollDialogArgument } from "$module/dialog";

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
            switch (x.weaponType) {
                case WeaponType.Brawling:
                    x.system["isBrawling"] = true;
                    break;

                case WeaponType.Melee:
                    x.system["isMelee"] = true;
                    break;

                case WeaponType.Ranged:
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
        $html.on('click', '.weapon-action', this.#onWeaponAction.bind(this));

        // html.addEventListener('click', '.item-action', this.#onItemAction.bind(this));
        // html.on('click', '.weapon-action', this.#onWeaponAction.bind(this));
    }

    async #onSkillCheckRoll(event: MouseEvent) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = (element as HTMLAnchorElement)?.dataset;

        const { actor } = this;

        const showDialog = (CONFIG.SETTINGS.ShowTaskCheckOptions !== event.ctrlKey);
        let dialogResult = new VeretenoRollDialogArgument();
        if (showDialog) {
            dialogResult = await (new VeretenoRollDialog()).getTaskCheckOptions();

            if (dialogResult.cancelled) {
                return;
            }
        }

        let { label, rollKey, rollType } = dataset;

        if (rollKey == null || rollType == null) {
            return;
        }

        let rollData = new VeretenoRollData();
        if (rollType == "attribute") {
            rollData = await actor.getAttributeRollData(rollKey);
        } else {
            rollData = await actor.getSkillRollData(rollKey);
        }

        rollData.pool += dialogResult.modifier;


        let messageData = {
            userId: game.user._id || undefined,
            speaker: ChatMessage.getSpeaker(),
            flavor: label || '',
            sound: CONFIG.sounds.dice,
            blind: false || dialogResult.blindRoll || event.shiftKey
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
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = (element as HTMLAnchorElement)?.dataset;

        const { itemType, actionType, itemId, weaponType, attackType } = dataset;

        if (itemId == null || itemId == undefined) {
            return;
        }

        const chatOptions: VeretenoChatOptions = {
            isBlind: false || event.shiftKey,
            showDialog: (CONFIG.SETTINGS.ShowTaskCheckOptions !== event.ctrlKey)
        }

        if (actionType === 'initiative') {
            return await this.rollWeaponInitiative(itemId, chatOptions);
        }
        else if (actionType === 'attack') {
            let weaponData: WeaponAttackInfo = {
                id: itemId,
                weaponType: weaponType as WeaponType,
                attackType: attackType as AttackType
            };

            return await this.rollWeaponAttack(weaponData, chatOptions);
        }
    }

    async rollWeaponInitiative(weaponId: string, chatOptions: VeretenoChatOptions) {
        const { actor } = this;

        let dialogResult = new VeretenoRollDialogArgument();
        if (chatOptions.showDialog) {
            dialogResult = await (new VeretenoRollDialog()).getTaskCheckOptions();

            if (dialogResult.cancelled) {
                return;
            }
        }

        const messageData: VeretenoMessageData = {
            userId: game.user._id || undefined,
            speaker: ChatMessage.getSpeaker(),
            flavor: 'Инициатива',
            sound: CONFIG.sounds.dice,
            blind: chatOptions.isBlind || dialogResult.blindRoll
        };

        let initiativeRollData = await actor.getInitiativeRollData(weaponId);
        if (initiativeRollData == null) {
            return;
        }

        initiativeRollData.bonus += dialogResult.modifier;

        const rollOptions: VeretenoRollOptions = {
            type: VeretenoRollType.Initiative,
            messageData,
            rollData: initiativeRollData
        }

        const veretenoRollHandler = new VeretenoRoller();
        await veretenoRollHandler.rollInitiative(rollOptions);
    }

    async rollWeaponAttack(weaponData: WeaponAttackInfo, chatOptions: VeretenoChatOptions) {
        const { actor } = this;

        let dialogResult = new VeretenoRollDialogArgument();
        if (chatOptions.showDialog) {
            dialogResult = await (new VeretenoRollDialog()).getTaskCheckOptions();

            if (dialogResult.cancelled) {
                return;
            }
        }

        const messageData: VeretenoMessageData = {
            userId: game.user._id || undefined,
            speaker: ChatMessage.getSpeaker(),
            flavor: weaponData.weaponType,
            sound: CONFIG.sounds.dice,
            blind: chatOptions.isBlind || dialogResult.blindRoll
        };

        let weaponRollData = await actor.getWeaponRollData(weaponData);
        weaponRollData.pool += dialogResult.modifier;

        const rollOptions: VeretenoRollOptions = {
            type: VeretenoRollType.Attack,
            messageData,
            rollData: weaponRollData
        }

        const veretenoRollHandler = new VeretenoRoller();
        await veretenoRollHandler.roll(rollOptions);
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

        const chatOptions: VeretenoChatOptions = {
            isBlind: false || event.shiftKey,
            showDialog: (CONFIG.SETTINGS.ShowTaskCheckOptions !== event.ctrlKey)
        }

        if (itemId == null || itemId == undefined) {
            return;
        }

        const messageData = {
            userId: game.user._id || undefined,
            speaker: ChatMessage.getSpeaker(),
            flavor: '',
            sound: CONFIG.sounds.dice,
            blind: false
        };

        switch (actionType) {
            case 'block':
                return await this.rollArmorBlock(itemId, chatOptions);
                break;
            case 'ablate':
                return await this.ablateArmor(itemId);
                break;
            case 'repair':
                return await this.repairArmor(itemId);
                break;
            default:
                return;
        }
    }

    async rollArmorBlock(armorId: string, chatOptions: VeretenoChatOptions) {
        const { actor } = this;

        let dialogResult = new VeretenoRollDialogArgument();
        if (chatOptions.showDialog) {
            dialogResult = await (new VeretenoRollDialog()).getTaskCheckOptions();

            if (dialogResult.cancelled) {
                return;
            }
        }

        const messageData: VeretenoMessageData = {
            userId: game.user._id || undefined,
            speaker: ChatMessage.getSpeaker(),
            flavor: 'Защита',
            sound: CONFIG.sounds.dice,
            blind: chatOptions.isBlind || dialogResult.blindRoll
        };

        let armorRollData = await actor.getArmorRollData(armorId);
        if (armorRollData == null) {
            return;
        }

        armorRollData.pool += dialogResult.modifier;

        const rollOptions: VeretenoRollOptions = {
            type: VeretenoRollType.ArmorBlock,
            messageData,
            rollData: armorRollData
        }

        if (rollOptions.rollData.pool == 0) {
            // сообщение о разбитой броне.
            return;
        }

        const veretenoRollHandler = new VeretenoRoller();
        await veretenoRollHandler.roll(rollOptions);
    }

    async ablateArmor(armorId: string, value: number = 1) {
        const { actor } = this;

        if (value < 1) {
            return;
        }

        const armor = (this.actor.items.find(x => x._id === armorId) as unknown as VeretenoArmor);
        if (!armor) {
            // сообщение об остутствующем предмете.
            return;
        }

        if (armor.system.durability === 0) {
            // предупреждение о разбитой броне.
            return;
        }

        armor.system.durability -= value;

        if (armor.system.durability < 0) {
            armor.system.durability = 0;
        }

        if (armor.system.durability === 0) {
            // предупреждение о разбитой броне.
        }

        await this.actor.updateEmbeddedDocuments("Item", [
            { _id: armor._id!, "system.durability": armor.system.durability },
        ]);
    }

    async repairArmor(armorId: string) {
        const armor = (this.actor.items.find(x => x._id === armorId) as unknown as VeretenoArmor);
        if (!armor) {
            // сообщение об остутствующем предмете
        }

        const maxDurability = armor.system.armorClass + armor.system.quality
        if (armor.system.durability === maxDurability) {
            // предупреждение о целой броне.
        }

        await this.actor.updateEmbeddedDocuments("Item", [
            { _id: armor._id!, "system.durability": maxDurability },
        ]);
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