import { CreatureActorType, CreatureSource } from "../creature/data";

/** Base interface for all actor data */
type BaseVeretenoActorSource<
    TType extends ActorType,
    TSystemSource extends ActorSystemSource = ActorSystemSource,
> = foundry.documents.ActorSource<TType, TSystemSource, VeretenoItemSource> & {
};


type ActorSystemSource = {
    stats: any[];
    attributes: any[];
    skills: any[];
    biography: string;
    money: number;
};

type ActorType = CreatureActorType | MechanismActorType;

type VeretenoActorSource = |CreatureSource;

export type { VeretenoActorSource, BaseVeretenoActorSource, ActorSystemSource }