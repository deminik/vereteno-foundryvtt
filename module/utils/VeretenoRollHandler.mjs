export class VeretenoRollHandler {
    constructor() {
    }

    /**
    * 
    * @param {object} rollOptions 
    * @param {string} rollOptions.type Тип броска: Умение, оружие
    * @param {object} rollOptions.messageData Данные сообщения
    * @param {object} rollOptions.rollData Данные броска
    * @param {number} rollOptions.rollData.pool Количество кубов
    * @param {string} rollOptions.rollData.dice Тип куба: d2, d6, d20 и т.д.
    * 
    */
    async roll(rollOptions = {
        type: "none",
        attackType: null,
        messageData: {
            userId: null,
            speaker: {},
            flavor: '',
            sound: CONFIG.sounds.dice,
            blind: false
        }, rollData: {
            pool: 0,
            dice: 'd20',
            rollType: 'regular'
        }
    }) {
        let roll = new Roll(rollOptions.rollData.pool + rollOptions.rollData.dice);
        this.roll = roll;
        this.roll.veretenoRollType = rollOptions.rollData.rollType

        await this.reevaluateTotal();
        this.toMessage(rollOptions.messageData);
    }

    async reevaluateTotal() {
        if (!this.roll._evaluated) {
            await this.roll.evaluate();
        }

        if (this.roll.veretenoRollType === 'serial') {
            this.roll._formula += '+'
            let isInterrupted = false;
            while (!isInterrupted) {
                let additionalRoll = new Roll('1d20');
                await additionalRoll.evaluate();
                const additionalRollResult = additionalRoll.terms[0].results[0];
                this.roll.terms[0].results.push(additionalRollResult);
                if (additionalRollResult.result <= 4) {
                    isInterrupted = true;
                }
            }
        }

        let rollDicesResults = this.roll.terms[0].results;
        let rollResult = this.calculateDicesTotal(rollDicesResults);

        this.roll.veretenoTotal = rollResult.result;
        this.roll.veretenoSuccesses = rollResult.successes;
        this.roll.veretenoCritFails = rollResult.fails;
    }

    getRoll() {
        return this.roll;
    }

    calculateDicesTotal(dices = []) {
        const result = {
            result: 0,
            successes: 0,
            fails: 0
        }

        this.rolls = [];
        dices.forEach(r => {
            let rollResult = {
                result: r.result,
                classes: 'd20'
            };

            if (r.result === 20) {
                result.result += 2;
                rollResult.classes += ' max';
                result.successes += 2;
            }

            if (r.result >= 17 && r.result <= 19) {
                result.result++;
                rollResult.classes += ' good';
                result.successes++;
            }

            if (r.result === 1) {
                result.result--;
                rollResult.classes += ' min';
                result.fails++;
            }

            this.rolls.push(rollResult);
        });

        return result;
    }

    getTemplate(type = 'regular') {
        switch (type) {
            case 'regular':
                return "systems/vereteno/templates/chat/vereteno-roll-chat-message.hbs";
            case 'armor-block':
                return "systems/vereteno/templates/chat/vereteno-armor-roll-chat-message.hbs";
            default:
                return "systems/vereteno/templates/chat/vereteno-roll-chat-message.hbs";
        }
    }

    getVeretenoRollData() {
        let rollData = {
            formula: this.roll._formula,
            total: this.roll._total,
            veretenoTotal: this.roll.veretenoTotal,
            veretenoSuccesses: this.roll.veretenoSuccesses,
            veretenoCritFails: this.roll.veretenoCritFails,
            rolls: this.rolls
        }

        return rollData;
    }

    async toMessage(chatData) {
        let template = this.getTemplate(chatData.messageType);

        let veretenoRollData = this.getVeretenoRollData();

        chatData.content = await renderTemplate(template, veretenoRollData);

        chatData.roll = this.roll;

        return ChatMessage.create(chatData);
    }
}