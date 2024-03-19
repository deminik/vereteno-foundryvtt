import { VeretenoArmorSheet } from '$module/item/armor/sheet';
import { VeretenoItemSheet } from '$module/item/base/sheet';
import { VERETENOCONFIG } from '../../veretenoConfig';
import { VERETENO_PARTIALS } from '../../partials';
import { VeretenoWeaponSheet } from '$module/item/weapon/sheet';
import { VeretenoCharacter } from '$module/actor';
import { VeretenoCharacterSheet } from '$module/actor/character/sheet';
import { VeretenoMonsterSheet } from '$module/actor/monster/sheet';
import { VeretenoNpcSheet } from '$module/actor/npc/sheet';

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
            Actors.registerSheet('vereteno', VeretenoCharacterSheet, {
                types: ['character'],
                makeDefault: true
            });
            Actors.registerSheet('vereteno', VeretenoMonsterSheet, {
                types: ['monster'],
                makeDefault: true
            });
            Actors.registerSheet('vereteno', VeretenoNpcSheet, {
                types: ['npc'],
                makeDefault: true
            });

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

