import { vereteno } from './config.mjs';
import { VeretenoItemSheet } from './sheets/VeretenoItemSheet.mjs';

Hooks.once('init', function () {
    console.log("Vereteno | System init begin.");

    CONFIG.vereteno = vereteno;

    Actors.unregisterSheet('core', ActorSheet);

    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('vereteno', VeretenoItemSheet, { makeDefault: true });

    console.log("Vereteno | System init done.");
});