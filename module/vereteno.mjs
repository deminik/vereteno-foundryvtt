import { vereteno } from './config.mjs';
import { VeretenoItemSheet } from './sheets/VeretenoItemSheet.mjs';
import { VeretenoCharacterSheet } from './sheets/VeretenoCharacterSheet.mjs';

async function preloadHandlebarsTemplates() {
    const templatesPaths = [
        "systems/vereteno/templates/sheets/partials/actor/stats-tab.hbs",
        "systems/vereteno/templates/sheets/partials/actor/stats-block.hbs",
        "systems/vereteno/templates/sheets/partials/actor/skills-block.hbs",

        "systems/vereteno/templates/sheets/partials/actor/equipment-tab.hbs",
        "systems/vereteno/templates/sheets/partials/actor/item/weapon-plate.hbs"
    ];

    return loadTemplates(templatesPaths);
}

Hooks.once('init', function () {
    console.log("Vereteno | System init begin.");

    CONFIG.vereteno = vereteno;

    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('vereteno', VeretenoCharacterSheet, { makeDefault: true });

    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('vereteno', VeretenoItemSheet, { makeDefault: true });

    preloadHandlebarsTemplates();

    console.log("Vereteno | System init done.");
}); 