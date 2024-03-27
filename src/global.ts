import { VeretenoActor } from "$module/actor";
import { VeretenoActors } from "$module/collection";
import { VeretenoItem } from "$module/item";
import { VeretenoClientSettings } from "$module/system/settings/client-settings";
import { VERETENOCONFIG } from "$veretenoConfig";

interface VeretenoGame
    extends Game<
        VeretenoActor<null>,
        VeretenoActors<VeretenoActor<null>>,
        ChatMessage,
        Combat,
        VeretenoItem<null>,
        Macro,
        Scene,
        User<VeretenoActor<null>>
    > {
}

type ConfiguredConfig = Config<
    AmbientLightDocument<Scene | null>,
    ActiveEffect<VeretenoActor | VeretenoItem | null>,
    VeretenoActor,
    ActorDelta<TokenDocument>,
    ChatLog,
    ChatMessage,
    Combat,
    Combatant<Combat | null, TokenDocument>,
    CombatTracker<Combat | null>,
    CompendiumDirectory,
    Hotbar,
    VeretenoItem,
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
        VERETENO: typeof VERETENOCONFIG,
        SETTINGS: VeretenoClientSettings
    }

    const CONFIG: VeretenoConfig;
}
