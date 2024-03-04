export class VeretenoChatMessage extends ChatMessage {
    constructor(messageData = {}) {
        return super(messageData);
    }

    async getHTML(){
        return await super.getHTML();
    }

    async _renderRollContent(messageData){
        return await super._renderRollContent(messageData);
    }

    async _renderRollHTML(isPrivate){
        return await super._renderRollHTML(isPrivate);
    }



    /**
 * Recreate a Roll instance using a provided data object
 * @param {object} data   Unpacked data representing the Roll
 * @returns {Roll}         A reconstructed Roll instance
 */
    static fromData(data) {

        // Redirect to the proper Roll class definition
        if (data.class && (data.class !== this.name)) {
            const cls = CONFIG.Dice.rolls.find(cls => cls.name === data.class);
            if (!cls) throw new Error(`Unable to recreate ${data.class} instance from provided data`);
            return cls.fromData(data);
        }

        // Create the Roll instance
        const roll = new this(data.formula, data.data, data.options);

        // Expand terms
        roll.terms = data.terms.map(t => {
            if (t.class) {
                if (t.class === "DicePool") t.class = "PoolTerm"; // Backwards compatibility
                return RollTerm.fromData(t);
            }
            return t;
        });

        // Repopulate evaluated state
        if (data.evaluated ?? true) {
            roll._total = data.total;
            roll._dice = (data.dice || []).map(t => DiceTerm.fromData(t));
            roll._evaluated = true;
        }
        return roll;
    }
}