export class VeretenoRollHandler {
    constructor(roll) {
        this.roll = roll;
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