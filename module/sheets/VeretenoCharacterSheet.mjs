import { VeretenoRollHandler } from '../utils/VeretenoRollHandler.mjs';

export class VeretenoCharacterSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            height: 680,
            width: 550,
            classes: ['vereteno', 'character', 'sheet'],
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "main",
                },
            ],
        })
    }

    get template() {
        return `systems/vereteno/templates/sheets/${this.actor.type}-sheet.hbs`;
    }

    activateListeners(html) {
        super.activateListeners(html);

        if (!this.isEditable) return;

        html.on('click', '.skill-check', this._onSkillCheckRoll.bind(this));
        html.on('click', '.weapon-attack', this._onWeaponRoll.bind(this));
        html.on('click', '.item-remove', this._onItemRemove.bind(this));
        html.on('click', '.weapon-equip', this._onWeaponEquip.bind(this));
        html.on('click', '.armor-equip', this.onArmorEquip.bind(this));
    }

    getData() {
        const context = super.getData();

        const characterData = context.data;

        context.system = this._prepareCharacterData(characterData);

        context.flags = characterData.flags;
        context.config = CONFIG.vereteno;
        context.cssClass = `vereteno ${this.actor.type}-sheet`;

        return context;
    }

    _prepareCharacterData(characterData) {
        let system = this._prepareStatsAndSkills(characterData.system);

        system = this._prepareItems(characterData, system);

        return system;
    }

    _prepareItems(characterData, system) {

        system.weapons = characterData.items.filter(x => x.type === 'weapon') || [];
        for (let [k, v] of Object.entries(system.weapons)) {
            v.system.isBrawling = v.system.attackType === 'brawling';
            v.system.isMelee = v.system.attackType === 'melee';
            v.system.isRanged = v.system.attackType === 'ranged';
            v.system.range.label = game.i18n.localize(CONFIG.vereteno.rangeTypes[v.system.range.value]) ?? v.system.range.value;
            v.system.attackWith.label = game.i18n.localize(CONFIG.vereteno.skills[v.system.attackWith.value]) ?? v.system.attackWith.value;
        };
        system.equippedWeapons = system.weapons.filter(x => x.system.equipped);

        system.armors = characterData.items.filter(x => x.type === 'armor') || [];
        for (let [k, v] of Object.entries(system.armors)) {
            v.system.maxDurability = v.system.armorClass + v.system.quality;
            if (v.system.durability === undefined || v.system.durability === null) {
                v.system.durability = v.system.maxDurability;
            }
        };
        system.equippedArmors = system.armors.filter(x => x.system.equipped);

        return system;
    }

    _prepareStatsAndSkills(system) {
        // Handle ability scores.
        for (let [k, v] of Object.entries(system.attributes)) {
            if (v.value == null) {
                v.value = v.min;
            }
            v.label = game.i18n.localize(CONFIG.vereteno.attributes[k]) ?? k;
            v.skills = {};

            const attributeSkills = Object.entries(system.skills).filter(x => x[1].attribute === k);
            for (let [k1, v1] of attributeSkills) {
                if (system.skills[k1].value == null) {
                    system.skills[k1].value = system.skills[k1].min;
                }

                system.skills[k1].label = game.i18n.localize(CONFIG.vereteno.skills[k1]) ?? k1;
                v.skills[k1] = system.skills[k1];
            }
        }

        let hpMax = system.attributes.constitution.value + system.attributes.dexterity.value;

        system.stats.hitPoints.max = hpMax;
        if (system.stats.hitPoints.value > hpMax) {
            system.stats.hitPoints.value = hpMax;
        }

        system.stats.hitPoints.label = game.i18n.localize(CONFIG.vereteno.stats.hitPoints);

        let wpMax = system.attributes.intelligence.value + system.attributes.empathy.value;

        system.stats.willPoints.max = wpMax;
        if (system.stats.willPoints.value > wpMax) {
            system.stats.willPoints.value = wpMax;
        }

        system.stats.willPoints.label = game.i18n.localize(CONFIG.vereteno.stats.willPoints);

        system.stats.reputation.label = game.i18n.localize(CONFIG.vereteno.stats.reputation);

        return system;
    }

    async getTaskCheckOptions(taskType) {
        const template = 'systems/vereteno/templates/chat/dialog/skill-check-dialog.hbs';
        const html = await renderTemplate(template, {});

        return new Promise(resolve => {
            const data = {
                title: "Модификаторы броска",
                content: html,
                buttons: {
                    normal: {
                        label: "Далее",
                        callback: html => resolve(this._processTaskCheckOptions(html[0].querySelector("form")))
                    },
                    cancel: {
                        label: "Отмена",
                        callback: html => resolve({ cancelled: true })
                    }
                },
                default: "normal",
                close: () => resolve({ cancelled: true })
            };

            new Dialog(data, null).render(true);
        });
    }

    _processTaskCheckOptions(form) {
        return {
            modifier: parseInt(form.modifier.value),
            blindRoll: form.blindRoll.checked
        };
    }

    async _onSkillCheckRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        let { label, rollKey, rollType } = dataset;

        let optionSettings = game.settings.get("vereteno", "showTaskCheckOptions");

        let checkOptions = { modifier: 0, blindRoll: false };
        if (event.shiftKey || optionSettings) {
            checkOptions = await this.getTaskCheckOptions(rollType);

            if (checkOptions.cancelled) {
                return;
            }
        }

        let { modifier, blindRoll } = checkOptions;

        let messageData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            flavor: label,
            sound: CONFIG.sounds.dice,
            blind: blindRoll || event.ctrlKey
        };

        let actorRollData = await this._prepareActorRollData(rollType, rollKey);

        let rollData = {
            pool: actorRollData.pool + modifier,
            dice: actorRollData.dice
        };

        let rollOptions = {
            type: "skill",
            messageData,
            rollData
        };

        let veretenoRollHandler = new VeretenoRollHandler();
        await veretenoRollHandler.roll(rollOptions);
    }

    async _onWeaponRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        let { rollType, itemId, weaponType, attackType } = dataset;

        let messageData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            flavor: weaponType,
            sound: CONFIG.sounds.dice,
            blind: false || event.ctrlKey
        };

        let weaponData = {
            itemId,
            weaponType,
            attackType
        };

        let rollData = await this._prepareActorRollData(rollType, "", weaponData);

        let rollOptions = {
            type: "attack",
            messageData,
            rollData
        }

        let veretenoRollHandler = new VeretenoRollHandler();
        await veretenoRollHandler.roll(rollOptions);
    }

    async _prepareActorRollData(type, key, data) {
        switch (type) {
            case "attribute":
                return await this._prepareAttributeRollData(key, data);
            case "skill":
                return await this._prepareSkillRollData(key, data);
            case "weapon":
                return await this._prepareWeaponRollData(data);
            default:
                break;
        }
    }

    async _getContext() {
        return this.object;
    }

    async _getSystem() {
        return (await this._getContext()).system;
    }

    async _prepareAttributeRollData(key) {
        let context = await this._getSystem();

        let attribute = context.attributes[key];

        if (!attribute) {
            return null;
        }

        let attributeValue = attribute.value;

        let attributeBonuses = 0;

        let attributePoolResult = attributeValue + attributeBonuses;

        let rollData = {
            "dice": "d20",
            "pool": attributePoolResult
        };

        return rollData;
    }

    async _prepareSkillRollData(key) {
        let context = await this._getSystem();

        let skill = context.skills[key];

        if (!skill) {
            return null;
        }

        let skillAttributeKey = skill.attribute;
        let skillAttributeRollData = await this._prepareAttributeRollData(skillAttributeKey);

        let skillValue = skill.value;

        let skillBonuses = 0;

        let skillPoolResult = skillValue + skillBonuses;

        let rollData = skillAttributeRollData;
        rollData.dice = "d20";
        rollData.pool = rollData.pool + skillPoolResult;

        return rollData;
    }

    async _prepareWeaponRollData(data) {
        let item = this.actor.items.get(data.itemId);

        let itemSkill = item.system.attackWith;
        let skillRollData = await this._prepareSkillRollData(itemSkill);

        let weaponAttackTypeModifier = this.getWeaponAttackTypeModifier(data.weaponType, data.attackType);

        let weaponAttackModifier = item.system.modifier;

        let weaponDamage = item.system.damage;

        let rollData = mergeObject(skillRollData,
            {
                pool: skillRollData.pool + weaponAttackTypeModifier + weaponAttackModifier,
                weaponDamage,
                weaponAttackModifier
            });

        return rollData;
    }

    getWeaponAttackTypeModifier(weaponType, attackType) {
        if (weaponType === 'melee') {
            if (attackType === 'power') {
                return 2;
            }

            if (attackType === 'light') {
                return -2;
            }

            return 0;
        }

        if (weaponType === 'ranged') {
            if (attackType === 'aimed') {
                return 2;
            }

            if (attackType === 'hip') {
                return -2;
            }

            return 0;
        }
    }

    async _onItemRemove(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        let { itemId } = dataset;

        let item = this.actor.items.get(itemId);

        if (item.type === 'weapon') {
            if (this.actor.equipedWeapon && this.actor.equipedWeapon._id === item._id) {
                this.actor.equipedWeapon = null;
            }
        }

        this.actor.deleteEmbeddedDocuments("Item", [item._id]);
    }

    async _onWeaponEquip(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        let { itemId } = dataset;

        const item = this.actor.items.find(x => x._id === itemId);

        await this.actor.updateEmbeddedDocuments("Item", [
            { _id: item._id, "system.equipped": true },
        ]);
    }

    async onArmorEquip(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        let { itemId } = dataset;

        const equippedArmor = this.actor.items.find(x => x.system.equipped);
        if (equippedArmor) {
            return;
        }

        const item = this.actor.items.find(x => x._id === itemId);

        await this.actor.updateEmbeddedDocuments("Item", [
            { _id: item._id, "system.equipped": true },
        ]);
    }
}