export function registerSettings(): void {
    game.settings.register("vereteno", "visibility.showTaskCheckOptions", {
        name: "vereteno.settings.showTaskCheckOptions.name",
        hint: "vereteno.settings.showTaskCheckOptions.hint",
        scope: "client",
        config: true,
        default: true,
        type: Boolean
    });
}