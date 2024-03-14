import { VeretenoItemSheet } from '$module/item/item-sheet';
import { VeretenoConfig } from '../../veretenoConfig'

export const Init = {
    listen(): void {
        Hooks.once('init', async function () {
            console.log("Vereteno | System init begin.");

            // CONFIG.VERETENO = VeretenoConfig;

            Actors.unregisterSheet('core', ActorSheet);
            // Actors.registerSheet('vereteno', VeretenoCharacterSheet, { makeDefault: true });

            Items.unregisterSheet('core', ItemSheet);
            Items.registerSheet('vereteno', VeretenoItemSheet, { makeDefault: true });

            // preloadHandlebarsTemplates();

            // registerSystemSettings();

            console.log("Vereteno | System init done.");
        });
    }
}

