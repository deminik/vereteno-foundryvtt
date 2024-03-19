import { VeretenoItem } from "$module/item";
import { VERETENOCONFIG } from "$veretenoConfig";

interface VeretenoGame
    extends Game<
        VeretenoActor<null>,
        Actors<VeretenoActor<null>>,
        ChatMessage,
        Combat,
        VeretenoItem<null>,
        Macro,
        Scene,
        User
    > {
}

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
    var game: VeretenoGame;

    interface VeretenoConfig extends ConfiguredConfig {
        VERETENO: typeof VERETENOCONFIG
    }

    const CONFIG: VeretenoConfig;
}
