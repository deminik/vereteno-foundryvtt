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
    Attack = 'attack',
    Initiative = 'initiative',
    Desperation = 'desperation'
}

class VeretenoMessageData implements RollOptions {
    [index: string]: any;
    userId: string | undefined;
    speaker: any = {};
    flavor: string = '';
    sound: any | null = null;
}

class VeretenoRollData {
    dice: string = 'd20';
    pool: number = 1;
    bonus: number = 0;
    isSerial: boolean = false;
}

interface VeretenoRollData {
    dice: string;
    pool: number;
    bonus: number;
    isSerial: boolean;
}

class VeretenoChatOptions {
    isBlind: boolean = false;
    showDialog: boolean = false;
}

interface VeretenoChatOptions {
    isBlind: boolean;
    showDialog: boolean;
}

export type { IdLabelType }
export type { VeretenoRollOptions, VeretenoMessageData }
export { VeretenoRollType, VeretenoRollData, VeretenoChatOptions }