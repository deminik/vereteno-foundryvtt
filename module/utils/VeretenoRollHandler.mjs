export class VeretenoRollHandler {
    constructor() {
        this.rolls = [];
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
        if (rollOptions.rollData.pool <= 0 && rollOptions.type !== "armor-block") {
            return await this.rollDesperation(rollOptions);
        }

        let rollFormula = `${rollOptions.rollData.pool}${rollOptions.rollData.dice}`;

        let roll = new Roll(rollFormula);
        this.roll = roll;
        this.roll.veretenoRollType = rollOptions.rollData.rollType;

        await this.reevaluateTotal();
        this.toMessage(rollOptions);
    }

    async rollInitiative(rollOptions = {
        type: "initiative",
        messageData: {
            userId: null,
            speaker: {},
            flavor: '',
            sound: CONFIG.sounds.dice,
            blind: false
        }, rollData: {
            pool: 0,
            dice: 'd20',
            bonus: 0,
            rollType: 'initiative'
        }
    }) {
        let rollFormula = `${rollOptions.rollData.pool}${rollOptions.rollData.dice}`;

        const bonus = rollOptions.rollData.bonus;
        if (bonus !== undefined && bonus !== 0) {
            if (bonus > 0) {
                rollFormula = rollFormula + `+${bonus}`
            } else {
                rollFormula = rollFormula + `${bonus}`
            }
        }

        let roll = new Roll(rollFormula);
        this.roll = roll;
        this.roll.veretenoRollType = rollOptions.rollData.rollType;

        if (!this.roll._evaluated) {
            await this.roll.evaluate();
        }

        const initiativeRollResult = this.roll.terms[0].results[0];
        this.rolls.push({
            result: initiativeRollResult.result,
            classes: 'd20'
        })

        this.toMessage(rollOptions);
    }

    async rollDesperation(rollOptions = {
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
        let rollFormula = '0d20';
        if (rollOptions.rollData.pool == 0) {
            rollFormula = '1d20';
        } else {
            rollFormula = '2d20'
        }

        let roll = new Roll(rollFormula);
        this.roll = roll;
        this.roll.veretenoRollType = "desperation";

        await this.reevaluateDesperationTotal();
        this.toMessage(rollOptions);
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

    async reevaluateDesperationTotal() {
        if (!this.roll._evaluated) {
            await this.roll.evaluate();
        }

        let rollDicesResults = this.roll.terms[0].results;
        let rollResult = this.calculateDesperationDicesTotal(rollDicesResults);

        this.roll.veretenoTotal = rollResult.result;
        this.roll.veretenoSuccesses = rollResult.successes;
        this.roll.veretenoCritFails = rollResult.fails;
    }

    calculateDesperationDicesTotal(dices = []) {
        const result = {
            result: 0,
            successes: 0,
            fails: 0
        }

        dices.forEach(r => {
            let rollResult = {
                result: r.result,
                classes: 'd20'
            };

            if (r.result === 20) {
                result.result++;
                rollResult.classes += ' max';
            }

            if (r.result === 1) {
                result.result--;
                rollResult.classes += ' min';
                result.fails++;
            }

            this.rolls.push(rollResult);
        });

        const dicesCount = dices.length;
        if (result.result == dicesCount) {
            result.result = 1;
            result.successes = 1;
        } else {
            result.result = 0;
            result.fails = 1;
        }

        return result;
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
                return "systems/vereteno/templates/chat/roll/vereteno-roll-chat-message.hbs";
            case 'armor-block':
                return "systems/vereteno/templates/chat/roll/vereteno-armor-roll-chat-message.hbs";
            case 'initiative':
                return "systems/vereteno/templates/chat/roll/vereteno-initiative-roll-chat-message.hbs";
            default:
                return "systems/vereteno/templates/chat/roll/vereteno-roll-chat-message.hbs";
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

    async toMessage(rollOptions = {
        type: "regular",
        messageData: {
            userId: null,
            speaker: {},
            flavor: '',
            sound: CONFIG.sounds.dice,
            blind: false
        }, rollData: {
            pool: 0,
            dice: 'd20',
            bonus: 0,
            rollType: 'initiative'
        }
    }) {
        const chatData = rollOptions.messageData;

        let template = this.getTemplate(rollOptions.type);

        let veretenoRollData = this.getVeretenoRollData();

        chatData.content = await renderTemplate(template, veretenoRollData);

        chatData.roll = this.roll;

        return ChatMessage.create(chatData);
    }
}