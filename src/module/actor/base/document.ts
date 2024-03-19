import { VeretenoActorSource, VeretenoActorSystemData } from "./data";

class VeretenoActor<TParent extends TokenDocument | null = TokenDocument | null> extends Actor<TParent>{

}

interface VeretenoActor<TParent extends TokenDocument | null = TokenDocument | null> extends Actor<TParent> {
    constructor: typeof VeretenoActor;
    system: VeretenoActorSystemData;
}

const VeretenoActorProxy = new Proxy(VeretenoActor, {
    construct(
        _target,
        args: [source: PreCreate<VeretenoActorSource>, context?: DocumentConstructionContext<VeretenoActor["parent"]>],
    ) {
        const source = args[0];
        const type = source?.type;
        return new CONFIG.VERETENO.Actor.documentClasses[type](...args);
    },
});

export { VeretenoActor, VeretenoActorProxy };