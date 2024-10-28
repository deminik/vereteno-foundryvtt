import { VeretenoRollOptions, VeretenoRollType } from "$module/data";
import { VeretenoRoll } from "$module/system/roll";

class VeretenoRoller {
    rollObject: VeretenoRoll | null = null;
    options: VeretenoRollOptions | null = null;
    veretenoResult: VeretenoResult = new VeretenoResult();
    veretenoRolls: VeretenoDieResult[] = [];

    async roll(rollOptions: VeretenoRollOptions): Promise<void> {
        this.options = rollOptions;
        if (rollOptions.rollData.pool <= 0 && rollOptions.type != VeretenoRollType.ArmorBlock) {
            return await this.rollDesperation(rollOptions);
        }

        let rollFormula = `${rollOptions.rollData.pool}${rollOptions.rollData.dice}`;

        let roll = new VeretenoRoll(rollFormula);
        this.rollObject = roll;

        if (!this.rollObject._evaluated) {
            await this.rollObject.evaluate({});
        }

        await this.reevaluateTotal();
        this.toMessage();
    }

    async rollDesperation(rollOptions: VeretenoRollOptions): Promise<void> {
        let rollFormula = '0d20';
        if (rollOptions.rollData.pool == 0) {
            rollFormula = '1d20';
        } else {
            rollFormula = '2d20'
        }

        let roll = new VeretenoRoll(rollFormula);
        this.rollObject = roll;
        this.options!.type = VeretenoRollType.Desperation;

        await this.reevaluateDesperationTotal();
        this.toMessage();
    }

    async rollInitiative(rollOptions: VeretenoRollOptions): Promise<void> {
        this.options = rollOptions;

        let rollFormula = `${rollOptions.rollData.pool}${rollOptions.rollData.dice}`;

        const bonus = rollOptions.rollData.bonus;
        if (bonus !== null && bonus !== 0) {
            if (bonus > 0) {
                rollFormula = rollFormula + `+${bonus}`
            } else {
                rollFormula = rollFormula + `${bonus}`
            }
        }

        let roll = new VeretenoRoll(rollFormula);
        this.rollObject = roll;

        if (!this.rollObject._evaluated) {
            await this.rollObject.evaluate({});
        }

        await this.reevaluateTotal();
        this.toMessage();
    }

    async reevaluateTotal(): Promise<void> {
        if (!this.rollObject || !this.options) {
            return;
        }

        if (!this.rollObject!._evaluated) {
            await this.rollObject!.evaluate({});
        }

        if (this.options.rollData.isSerial) {
            this.rollObject._formula += '+'
            let isInterrupted = false;
            while (!isInterrupted) {
                let additionalRoll = new Roll('1d20');
                await additionalRoll.evaluate({});
                const additionalRollResult: DieResult = (additionalRoll.terms[0] as any).results[0];
                (this.rollObject.terms[0] as any).results.push(additionalRollResult);
                if (additionalRollResult.result <= 4) {
                    isInterrupted = true;
                }
            }
        }

        let rollDicesResults = (this.rollObject.terms[0] as any).results as DieResult[];
        let rollResult = this.calculateDicesTotal(rollDicesResults);

        this.veretenoResult = rollResult;
    }

    async reevaluateDesperationTotal() {
        if (!this.rollObject) {
            return;
        }

        if (!this.rollObject._evaluated) {
            await this.rollObject.evaluate({});
        }

        let rollDicesResults = (this.rollObject.terms[0] as any).results;
        let rollResult = this.calculateDesperationDicesTotal(rollDicesResults);

        this.veretenoResult = rollResult;
    }

    calculateDicesTotal(dices: DieResult[]): VeretenoResult {
        const result: VeretenoResult = {
            total: 0,
            successes: 0,
            critFails: 0
        }

        dices.forEach(r => {
            let rollResult: VeretenoDieResult = {
                result: r.result,
                classes: 'd20'
            };

            if (r.result === 20) {
                result.total += 2;
                rollResult.classes += ' max';
                result.successes += 2;
            }

            if (r.result >= 17 && r.result <= 19) {
                result.total++;
                rollResult.classes += ' good';
                result.successes++;
            }

            if (r.result === 1) {
                result.total--;
                rollResult.classes += ' min';
                result.critFails++;
            }

            this.veretenoRolls.push(rollResult);
        });

        return result;
    }

    calculateDesperationDicesTotal(dices: DieResult[]): VeretenoResult {
        const result: VeretenoResult = {
            total: 0,
            successes: 0,
            critFails: 0
        }

        dices.forEach(r => {
            let rollResult = {
                result: r.result,
                classes: 'd20'
            };

            if (r.result === 20) {
                result.total++;
                rollResult.classes += ' max';
            }

            if (r.result === 1) {
                result.total--;
                rollResult.classes += ' min';
                result.critFails++;
            }

            this.veretenoRolls.push(rollResult);
        });

        const dicesCount = dices.length;
        if (result.total == dicesCount) {
            result.total = 1;
            result.successes = 1;
        } else {
            if (result.total > 0) {
                result.total = 0;
            }
        }

        return result;
    }

    async toMessage(): Promise<ChatMessage | undefined> {
        if (!this.options) {
            return;
        }

        const chatData = this.options.messageData;
        const template = this.getTemplate(this.options.type);
        const veretenoRollData = this.getVeretenoRollData();

        chatData.content = await renderTemplate(template, veretenoRollData);
        chatData.roll = this.rollObject;

        let rollMode = game.settings.get("core", "rollMode");
        if (rollMode == 'blindroll' || chatData.blind) {
            var gmRecipient = ChatMessage.getWhisperRecipients("GM");
            chatData.whisper = gmRecipient;
            rollMode = 'blindroll'
            chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
        }

        if (rollMode == 'gmroll') {
            var gmRecipient = ChatMessage.getWhisperRecipients("GM");
            chatData.whisper = gmRecipient;
            chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
        }

        chatData.rollMode = rollMode;

        return this.rollObject?.toMessage(chatData, { create: false, rollMode: rollMode })
        .then(e => ChatMessage.create(e));
    }

    getTemplate(type: VeretenoRollType): string {
        switch (type) {
            case VeretenoRollType.Regular:
                return "systems/vereteno/templates/chat/rolls/vereteno-roll-chat-message.hbs";
            case VeretenoRollType.ArmorBlock:
                return "systems/vereteno/templates/chat/rolls/vereteno-armor-roll-chat-message.hbs";
            case VeretenoRollType.Initiative:
                return "systems/vereteno/templates/chat/rolls/vereteno-initiative-roll-chat-message.hbs";
            default:
                return "systems/vereteno/templates/chat/rolls/vereteno-roll-chat-message.hbs";
        }
    }

    getVeretenoRollData(): VeretenoRollResult {
        let rollData = {
            formula: this.rollObject!._formula,
            total: this.rollObject!.total!,
            veretenoTotal: this.veretenoResult.total,
            veretenoSuccesses: this.veretenoResult.successes,
            veretenoCritFails: this.veretenoResult.critFails,
            rolls: this.veretenoRolls
        }

        return rollData;
    }
}

interface DieResult {
    active: boolean;
    result: number;
}

interface VeretenoDieResult {
    result: number;
    classes: string;
}

class VeretenoResult {
    total: number = 0;
    successes: number = 0;
    critFails: number = 0;
}

interface VeretenoRollResult {
    formula: string;
    total: number;
    veretenoTotal: number;
    veretenoSuccesses: number;
    veretenoCritFails: number;
    rolls: VeretenoDieResult[];
}

export { VeretenoRoller }