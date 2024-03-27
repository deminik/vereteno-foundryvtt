class VeretenoClientSettings {
    get ShowTaskCheckOptions(): boolean {
        return game.settings.get("vereteno", "visibility.showTaskCheckOptions") as boolean;
    }
}

interface VeretenoClientSettings {
    ShowTaskCheckOptions: boolean;
}

export { VeretenoClientSettings };