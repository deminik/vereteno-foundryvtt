import { VeretenoItemSource } from "$module/item/base/data";
import { CreatureActorType, CreatureSource } from "../creature/data";

/** Base interface for all actor data */
type BaseVeretenoActorSource<
    TType extends ActorType,
    TSystemSource extends VeretenoActorSystemSource = VeretenoActorSystemSource,
> = foundry.documents.ActorSource<TType, TSystemSource, VeretenoItemSource> & {
};

type VeretenoActorSystemSource = {
    biography: string;
};

interface VeretenoActorSystemData {
    description: string;
}

type ActorType = CreatureActorType | MechanismActorType;

type VeretenoActorSource = | CreatureSource;

export type { VeretenoActorSource, VeretenoActorSystemSource, BaseVeretenoActorSource, VeretenoActorSystemData }