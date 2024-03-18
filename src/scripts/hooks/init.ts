import { VeretenoArmorSheet } from '$module/item/armor/sheet';
import { VeretenoItemSheet } from '$module/item/base/item-sheet';
import { VERETENOCONFIG } from '../../veretenoConfig'

export const Init = {
    listen(): void {
        Hooks.once('init', async function () {
            console.log("Vereteno | System init begin.");

            CONFIG.VERETENO = VERETENOCONFIG;

            Actors.unregisterSheet('core', ActorSheet);
            // Actors.registerSheet('vereteno', VeretenoCharacterSheet, { makeDefault: true });

            Items.unregisterSheet('core', ItemSheet);
            Items.registerSheet('vereteno', VeretenoItemSheet, { makeDefault: true });
            Items.registerSheet('vereteno', VeretenoArmorSheet, {
                types: ['armor'],
                makeDefault: true
            });

            // preloadHandlebarsTemplates();

            // registerSystemSettings();

            console.log("Vereteno | System init done.");
        });
    }
}
