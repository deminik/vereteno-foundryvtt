import { ActorSystemSource, BaseVeretenoActorSource, VeretenoActorSource } from "../base/data";
import { CharacterSource } from "../character/data";
import { MonsterSource } from "../monster/data";
import { NpcSource } from "../npc/data";

type BaseCreatureSource<
    TType extends CreatureActorType,
    TSystemSource extends CreatureSystemSource,
> = BaseVeretenoActorSource<TType, TSystemSource>;

interface CreatureSystemSource extends ActorSystemSource {

}

type CreatureSource = CharacterSource | MonsterSource | NpcSource;

type CreatureActorType = | "character" | "monster" | "npc";

export type { CreatureSource, CreatureActorType, BaseCreatureSource, CreatureSystemSource }