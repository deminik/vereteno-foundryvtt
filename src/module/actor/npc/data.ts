import { BaseCreatureSource, CreatureSystemSource } from "../creature/data";

type NpcSource = BaseCreatureSource<"npc", NpcSystemSource> & {
};

interface NpcSystemSource extends CreatureSystemSource {

}

export type { NpcSource, NpcSystemSource }