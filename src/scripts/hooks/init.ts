export const Init = {
    listen(): void {
        Hooks.once('init', async function () {
            console.log("Vereteno | System init begin.");

            // CONFIG.vereteno = vereteno;

            Actors.unregisterSheet('core', ActorSheet);
            // Actors.registerSheet('vereteno', VeretenoCharacterSheet, { makeDefault: true });

            Items.unregisterSheet('core', ItemSheet);
            // Items.registerSheet('vereteno', VeretenoItemSheet, { makeDefault: true });

            // preloadHandlebarsTemplates();

            // registerSystemSettings();

            console.log("Vereteno | System init done.");
        });
    }
}

