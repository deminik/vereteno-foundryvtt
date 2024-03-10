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
        messageData: {
            userId: null,
            speaker: {},
            flavor: '',
            sound: CONFIG.sounds.dice,
            blind: false
        }, rollData: {
            pool: 0,
            dice: 'd20'
        }
    }) {
        let roll = new Roll(rollOptions.rollData.pool + rollOptions.rollData.dice);
        this.roll = roll;

        await this.reevaluateTotal();
        this.toMessage(rollOptions.messageData);
    }

    async reevaluateTotal() {
        if (!this.roll._evaluated) {
            await this.roll.evaluate();
        }

        let rollDicesResults = this.roll.terms[0].results;
        let veretenoTotal = this.calculateDicesTotal(rollDicesResults);

        this.roll._veretenoTotal = veretenoTotal;
    }

    getRoll() {
        return this.roll;
    }

    calculateDicesTotal(dices = []) {
        let successes = 0;

        this.rolls = [];
        dices.forEach(r => {
            let rollResult = {
                result: r.result,
                classes: 'd20'
            };

            if (r.result === 20) {
                successes += 2;
                rollResult.classes += ' max';
            }

            if (r.result >= 17 && r.result <= 19) {
                successes += 1;
                rollResult.classes += ' good';
            }

            if (r.result === 1) {
                successes -= 1;
                rollResult.classes += ' min';
            }

            this.rolls.push(rollResult);
        });

        return successes;
    }

    getTemplate() {
        return "systems/vereteno/templates/chat/vereteno-roll-chat-message.hbs";
    }

    getVeretenoRollData() {
        let rollData = {
            formula: this.roll.formula,
            total: this.roll._total,
            veretenoTotal: this.roll._veretenoTotal,
            rolls: this.rolls
        }

        return rollData;
    }

    async toMessage(chatData) {
        let template = this.getTemplate();

        let veretenoRollData = this.getVeretenoRollData();

        chatData.content = await renderTemplate(template, veretenoRollData);

        chatData.roll = this.roll;

        return ChatMessage.create(chatData);
    }
}