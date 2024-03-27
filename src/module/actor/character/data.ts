import { BaseCreatureSource, Stat, VeretenoCreatureSystemData, VeretenoCreatureSystemSource } from "../creature/data";

type CharacterSource = BaseCreatureSource<"character", VeretenoCharacterSystemSource> & {
};

interface VeretenoCharacterSystemSource extends VeretenoCreatureSystemSource {
    reputation: Stat;
    money: number;
    exp: number;
}

interface VeretenoCharacterSystemData extends VeretenoCreatureSystemData {
    reputation: number;
    money: number;
    exp: number;
}

export type { CharacterSource, VeretenoCharacterSystemSource, VeretenoCharacterSystemData }