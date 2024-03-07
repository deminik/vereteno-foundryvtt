export class VeretenoCharacterSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            height: 680,
            width: 550,
            classes: ['vereteno', 'character', 'sheet']
        })
    }

    get template() {
        return `systems/vereteno/templates/sheets/${this.actor.type}-sheet.hbs`;
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
}