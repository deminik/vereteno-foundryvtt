import { VeretenoChatMessage } from './vereteno-message.mjs';

export class VeretenoRoll extends Roll {
    constructor(formula, data = {}, options = {}) {
        return super(formula, data, options);
    }

    async getTooltip() {
        return await super.getTooltip();
    }

    async toMessage(messageData = {}, { rollMode, create = true } = {}) {

        // Perform the roll, if it has not yet been rolled
        if (!this._evaluated) await this.evaluate({ async: true });

        // Prepare chat data
        messageData = foundry.utils.mergeObject({
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            content: 'huy',
            sound: CONFIG.sounds.dice
        }, messageData);
        messageData.rolls = [this];

        // Either create the message or just return the chat data
        const cls = getDocumentClass("ChatMessage");
        const msg = new cls(messageData);

        // Either create or return the data
        if (create) return cls.create(msg.toObject(), { rollMode });
        else {
            if (rollMode) msg.applyRollMode(rollMode);
            return msg.toObject();
        }
    }

    async getHTML() {

        // Determine some metadata
        const data = this.toObject(false);
        data.content = await TextEditor.enrichHTML(this.content, { async: true, rollData: this.getRollData() });
        const isWhisper = this.whisper.length;

        // Construct message data
        const messageData = {
            message: data,
            user: game.user,
            author: this.user,
            alias: this.alias,
            cssClass: [
                this.type === CONST.CHAT_MESSAGE_TYPES.IC ? "ic" : null,
                this.type === CONST.CHAT_MESSAGE_TYPES.EMOTE ? "emote" : null,
                isWhisper ? "whisper" : null,
                this.blind ? "blind" : null
            ].filterJoin(" "),
            isWhisper: this.whisper.length,
            canDelete: game.user.isGM,  // Only GM users are allowed to have the trash-bin icon in the chat log itself
            whisperTo: this.whisper.map(u => {
                let user = game.users.get(u);
                return user ? user.name : null;
            }).filterJoin(", ")
        };

        // Render message data specifically for ROLL type messages
        if (this.isRoll) {
            await this._renderRollContent(messageData);
        }

        // Define a border color
        if (this.type === CONST.CHAT_MESSAGE_TYPES.OOC) {
            messageData.borderColor = this.user?.color;
        }

        // Render the chat message
        let html = await renderTemplate(CONFIG.ChatMessage.template, messageData);
        html = $(html);

        // Flag expanded state of dice rolls
        if (this._rollExpanded) html.find(".dice-tooltip").addClass("expanded");
        Hooks.call("renderChatMessage", this, html, messageData);
        return html;
    }

    /**
 * Render the inner HTML content for ROLL type messages.
 * @param {object} messageData      The chat message data used to render the message HTML
 * @returns {Promise}
 * @private
 */
    async _renderRollContent(messageData) {
        const data = messageData.message;
        const renderRolls = async isPrivate => {
            let html = "";
            for (const r of this.rolls) {
                html += await r.render({ isPrivate });
            }
            return html;
        };

        // Suppress the "to:" whisper flavor for private rolls
        if (this.blind || this.whisper.length) messageData.isWhisper = false;

        // Display standard Roll HTML content
        if (this.isContentVisible) {
            const el = document.createElement("div");
            el.innerHTML = data.content;  // Ensure the content does not already contain custom HTML
            if (!el.childElementCount && this.rolls.length) data.content = await this._renderRollHTML(false);
        }

        // Otherwise, show "rolled privately" messages for Roll content
        else {
            const name = this.user?.name ?? game.i18n.localize("CHAT.UnknownUser");
            data.flavor = game.i18n.format("CHAT.PrivateRollContent", { user: name });
            data.content = await renderRolls(true);
            messageData.alias = name;
        }
    }

    async _renderRollHTML(isPrivate) {
        let html = "";
        for ( const roll of this.rolls ) {
          html += await roll.render({isPrivate});
        }
        return html;
      }

    // async render(options = [{ flavor: '', template: '', isPrivate: false }]) {
    //     return await renderTemplate("systems/vereteno/templates/sidebar/vereteno-roll.html", this);
    // }

    // async toMessage(messageData = {}, { rollMode, create = true } = {}) {
    //     //return await super.toMessage(messageData, options);

    //     // Perform the roll, if it has not yet been rolled
    //     if (!this._evaluated) await this.evaluate({ async: true });

    //     // Prepare chat data
    //     messageData = foundry.utils.mergeObject({
    //         user: game.user.id,
    //         type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    //         content: 'content',
    //         sound: CONFIG.sounds.dice
    //     }, messageData);
    //     messageData.rolls = [this];

    //     // Either create the message or just return the chat data
    //     const cls = ChatMessage;
    //     const msg = new cls(messageData);

    //     // Either create or return the data
    //     if (create) return cls.create(msg.toObject(), { rollMode });
    //     else {
    //         if (rollMode) msg.applyRollMode(rollMode);
    //         return msg.toObject();
    //     }
    // }

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