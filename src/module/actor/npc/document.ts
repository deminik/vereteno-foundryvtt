import { VeretenoCreature } from "../index";

class VeretenoNpc<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoCreature<TParent>{

}

interface VeretenoNpc<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoCreature<TParent> {

}

export { VeretenoNpc }