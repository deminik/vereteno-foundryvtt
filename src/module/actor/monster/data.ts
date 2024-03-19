import { BaseCreatureSource, CreatureSystemSource } from "../creature/data";

type MonsterSource = BaseCreatureSource<"monster", MonsterSystemSource> & {
};

interface MonsterSystemSource extends CreatureSystemSource {

}

export type { MonsterSource, MonsterSystemSource }