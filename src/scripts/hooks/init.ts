import { VeretenoArmorSheet } from '$module/item/armor/sheet';
import { VeretenoItemSheet } from '$module/item/base/sheet';
import { VERETENOCONFIG } from '../../veretenoConfig';
import { VERETENO_PARTIALS } from '../../partials';
import { VeretenoWeaponSheet } from '$module/item/weapon/sheet';
import { VeretenoCharacterSheet } from '$module/actor/character/sheet';
import { VeretenoMonsterSheet } from '$module/actor/monster/sheet';
import { VeretenoNpcSheet } from '$module/actor/npc/sheet';
import { registerSettings } from '$module/system/settings';
import { VeretenoClientSettings } from '$module/system/settings/client-settings';
import { VeretenoEquipmentSheet } from '$module/item/equipment/sheet';

function preloadHandlebarsTemplates() {
    return loadTemplates(VERETENO_PARTIALS);
}

export const Init = {
    listen(): void {
        Hooks.once('init', async function () {
            console.log("Vereteno | System init begin.");

            CONFIG.VERETENO = VERETENOCONFIG;
            CONFIG.SETTINGS = new VeretenoClientSettings();

            Actors.unregisterSheet('core', ActorSheet);
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
            Items.registerSheet('vereteno', VeretenoItemSheet, {
                makeDefault: true
            });
            Items.registerSheet('vereteno', VeretenoArmorSheet, {
                types: ['armor'],
                makeDefault: true
            });
            Items.registerSheet('vereteno', VeretenoWeaponSheet, {
                types: ['weapon'],
                makeDefault: true
            });
            Items.registerSheet('vereteno', VeretenoEquipmentSheet, {
                types: ['equipment'],
                makeDefault: true
            });

            preloadHandlebarsTemplates();

            registerSettings();

            console.log("Vereteno | System init done.");
        });
    }
}

