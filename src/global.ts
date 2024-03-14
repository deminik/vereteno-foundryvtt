import { VERETENOCONFIG } from "$veretenoConfig";

type ConfiguredConfig = Config<
    AmbientLightDocument<Scene | null>,
    ActiveEffect<Actor | Item | null>,
    Actor,
    ActorDelta<TokenDocument>,
    ChatLog,
    ChatMessage,
    Combat,
    Combatant<Combat | null, TokenDocument>,
    CombatTracker<Combat | null>,
    CompendiumDirectory,
    Hotbar,
    Item,
    Macro,
    MeasuredTemplateDocument<Scene>,
    TileDocument<Scene>,
    TokenDocument,
    WallDocument<Scene | null>,
    Scene,
    User,
    EffectsCanvasGroup
>;

declare global {
    interface VeretenoConfig extends ConfiguredConfig {
        VERETENO: typeof VERETENOCONFIG
    }

    const CONFIG: VeretenoConfig;
}
