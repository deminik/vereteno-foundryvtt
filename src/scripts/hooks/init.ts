import { VeretenoArmorSheet } from '$module/item/armor/sheet';
import { VeretenoItemSheet } from '$module/item/base/sheet';
import { VERETENOCONFIG } from '../../veretenoConfig';
import { VERETENO_PARTIALS } from '../../partials';
import { VeretenoWeaponSheet } from '$module/item/weapon/sheet';

function preloadHandlebarsTemplates() {
    return loadTemplates(VERETENO_PARTIALS);
}

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
            Items.registerSheet('vereteno', VeretenoWeaponSheet, {
                types: ['weapon'],
                makeDefault: true
            });

            preloadHandlebarsTemplates();

            // registerSystemSettings();

            console.log("Vereteno | System init done.");
        });
    }
}

