import { vereteno } from './config.mjs';
import { VeretenoItemSheet } from './sheets/VeretenoItemSheet.mjs';
import { VeretenoCharacterSheet } from './sheets/VeretenoCharacterSheet.mjs';

async function preloadHandlebarsTemplates() {
    const templatesPaths = [
        "systems/vereteno/templates/sheets/partials/actor/stats-tab.hbs",
        "systems/vereteno/templates/sheets/partials/actor/stats-block.hbs",
        "systems/vereteno/templates/sheets/partials/actor/skills-block.hbs",

        "systems/vereteno/templates/sheets/partials/actor/equipment-tab.hbs",
        "systems/vereteno/templates/sheets/partials/actor/item/weapon-plate.hbs",
        "systems/vereteno/templates/sheets/partials/actor/item/armor-plate.hbs",

        "systems/vereteno/templates/sheets/partials/actor/fight-tab.hbs",
        "systems/vereteno/templates/sheets/partials/actor/fight/brawling-weapon-plate.hbs",
        "systems/vereteno/templates/sheets/partials/actor/fight/melee-weapon-plate.hbs",
        "systems/vereteno/templates/sheets/partials/actor/fight/ranged-weapon-plate.hbs",
        "systems/vereteno/templates/sheets/partials/actor/fight/armor-plate.hbs",

        "systems/vereteno/templates/sheets/partials/actor/bio-tab.hbs"
    ];

    return loadTemplates(templatesPaths);
}

function registerSystemSettings() {
    game.settings.register("vereteno", "showTaskCheckOptions", {
        config: true,
        scope: "client",
        name: "SETTINGS.showTaskCheckOptions.name",
        hint: "SETTING.showTaskCheckOptions.label",
        type: Boolean,
        default: true
    });
}

Hooks.once('init', function () {
    console.log("Vereteno | System init begin.");

    CONFIG.vereteno = vereteno;

    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('vereteno', VeretenoCharacterSheet, { makeDefault: true });

    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('vereteno', VeretenoItemSheet, { makeDefault: true });

    preloadHandlebarsTemplates();

    registerSystemSettings();

    console.log("Vereteno | System init done.");
}); 