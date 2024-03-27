import { VeretenoRollData } from "./actor/base/data";

interface IdLabelType<T> {
    id: number;
    label: string;
    type: T;
}

class VeretenoRollOptions {
    type: VeretenoRollType = VeretenoRollType.Regular;
    messageData: VeretenoMessageData = new VeretenoMessageData();
    rollData: VeretenoRollData = new VeretenoRollData();
}
enum VeretenoRollType {
    None = 'none',
    Regular = 'regular',
    ArmorBlock = 'armor-block',
    Serial = 'serial',
    initiative = 'initiative',
}

class VeretenoMessageData implements RollOptions {
    [index: string]: any;
    userId: string | undefined;
    speaker: any = {};
    flavor: string = '';
    sound: any | null = null;
    blind: boolean = false
}

class VeretenoRollData {
    dice: string = 'd20';
    pool: number = 1;
    bonus: number | null = 0;
}

export type { IdLabelType }
export type { VeretenoRollOptions, VeretenoMessageData, VeretenoRollData }
export { VeretenoRollType }