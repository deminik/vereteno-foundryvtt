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

        html.on('click', '.rollable', this._onRoll.bind(this));
    }

    getData() {
        const context = super.getData();

        const characterData = context.data;

        context.system = this._prepareCharacterData(characterData.system);

        context.flags = characterData.flags;
        context.config = CONFIG.vereteno;
        context.cssClass = `vereteno ${this.actor.type}-sheet`;

        return context;
    }

    _prepareCharacterData(system) {
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

    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        let { label, rollKey, rollType } = dataset;

        let messageData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            flavor: label
        };

        let actorRollData = await this._prepareActorRollData(rollType, rollKey);

        let roll = new Roll(actorRollData.pool + actorRollData.dice);
        let veretenoRollHandler = new VeretenoRollHandler(roll);
        await veretenoRollHandler.reevaluateTotal();
        veretenoRollHandler.toMessage(messageData);
    }

    async _prepareActorRollData(type, key) {
        switch (type) {
            case "attribute":
                return await this._prepareAttributeRollData(key);
            case "skill":
                return await this._prepareSkillRollData(key);
                break;
        }
    }

    async _getContext() {
        return this.object.system;
    }

    async _prepareAttributeRollData(key) {
        let context = await this._getContext();

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
        let context = await this._getContext();

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
}