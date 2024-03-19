import { BaseCreatureSource, CreatureSystemSource } from "../creature/data";

type CharacterSource = BaseCreatureSource<"character", CharacterSystemSource> & {
};

interface CharacterSystemSource extends CreatureSystemSource {

}

export type { CharacterSource, CharacterSystemSource }