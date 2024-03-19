import { VeretenoActor } from "../index";

class VeretenoCreature<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoActor<TParent>{

}

interface VeretenoCreature<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoActor<TParent> {

}

export { VeretenoCreature }