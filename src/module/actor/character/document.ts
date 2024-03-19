import { VeretenoCreature } from "../index";

class VeretenoCharacter<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoCreature<TParent>{

}

interface VeretenoCharacter<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoCreature<TParent> {

}

export { VeretenoCharacter }