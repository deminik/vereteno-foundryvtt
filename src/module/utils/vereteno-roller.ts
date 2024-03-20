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
            //return await this.rollDesperation(rollOptions);
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

    async reevaluateTotal(): Promise<void> {
        if (!this.rollObject || !this.options) {
            return;
        }

        if (!this.rollObject!._evaluated) {
            await this.rollObject!.evaluate({});
        }

        if (this.options.type === 'serial') {
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

    async toMessage(): Promise<ChatMessage | undefined> {
        if (!this.options) {
            return;
        }

        const chatData = this.options.messageData;
        const template = this.getTemplate(this.options.type);
        const veretenoRollData = this.getVeretenoRollData();

        chatData.content = await renderTemplate(template, veretenoRollData);
        chatData.roll = this.rollObject;

        return ChatMessage.create(chatData);
    }

    getTemplate(type: VeretenoRollType): string {
        switch (type) {
            case VeretenoRollType.Regular:
                return "systems/vereteno/templates/chat/rolls/vereteno-roll-chat-message.hbs";
            case VeretenoRollType.ArmorBlock:
                return "systems/vereteno/templates/chat/rolls/vereteno-armor-roll-chat-message.hbs";
            case VeretenoRollType.initiative:
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