import { VeretenoCreature } from "../index";
import { VeretenoCharacterSystemData } from "./data";

class VeretenoCharacter<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoCreature<TParent>{
    get Money(): number {
        return this.system.money || 0;
    }

    get Reputation(): number {
        return this.system.reputation || 0;
    }

    get Exp(): number {
        return this.system.exp || 0;
    }
}

interface VeretenoCharacter<TParent extends TokenDocument | null = TokenDocument | null> extends VeretenoCreature<TParent> {
    system: VeretenoCharacterSystemData;

    Money: number;
    Reputation: number;
    Exp: number;
}

export { VeretenoCharacter }