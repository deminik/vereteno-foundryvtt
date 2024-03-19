import { VeretenoCreature } from "../index";

class VeretenoMonster<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoCreature<TParent>{

}

interface VeretenoMonster<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoCreature<TParent> {

}

export { VeretenoMonster }