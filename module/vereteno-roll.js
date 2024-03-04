export async function veretenoModifierDialog(
    modifierCallback
) {
    const callback = function (modifier) {
        return function (html) {
            modifierCallback(modifier, {});
        }
    }
}

/**
 * takes in rendering options, rollData and:
 * 1. does the roll
 * 2. evaluates the roll
 * 3. takes the results and shows them in a chat message.
 * @param  {} chatOptions the options used to display the roll result in chat.
 * @param  {} rollData contains all data necessary to make a roll in Coriolis.
 */
export async function veretenoRoll(chatOptions, rollData) {
    chatOptions.rollMode = rollData.additionalData?.rollMode || chatOptions.rollMode;

    let totalDice = rollData.points;
    // getTotalDice(rollData);
    if (totalDice <= 0) {
        totalDice = 2; // desparation roll where both will have to be successes to be considered a success.
    }

    //const automaticFire = rollData.additionalData?.automaticFire;
    const formula = `${totalDice}d20`
    let roll = new Roll(formula);
    await roll.evaluate({ async: false });
    //await showDiceSoNice(roll, chatOptions.rollMode);
    const rollResult = evaluateVeretenoRoll(rollData, roll);
    // await showChatMessage(chatOptions, result, roll);

    showVeretenoMessage(roll, rollResult);

    return roll;
}

/**
* takes the result of the role and associated roll data and returns a result object.
* @param  {rollType, skill, attribute, modifier} rollData
* @param  {} roll
* @returns {limitedSuccess,criticalSuccess,failure, roll, rollData} returns the results plus the initial rollData and roll object in case you wish to push.
*/
export function evaluateVeretenoRoll(rollData, roll) {
    let successes = 0;

    roll.dice.forEach((part) => {
        part.results.forEach((r) => {
            if (r.result === 20) {
                successes += 2;
            }
            if (r.result >= 17 && r.result <= 19) {
                successes++;
            }
            if (r.result === 1) {
                successes -= 2;
            }
        });
    });

    roll._total = successes;

    let result = {
        successes: successes,
        success: successes == 2,
        limitedSuccess: successes == 1,
        criticalSuccess: successes >= 3,
        failure: successes === 0,
        criticalFailure: successes < 0,
        rollData: rollData,
    };

    return result;
}

/**
 * Transform a Roll instance into a ChatMessage, displaying the roll result.
 * This function can either create the ChatMessage directly, or return the data object that will be used to create.
 *
 * @param {object} messageData          The data object to use when creating the message
 * @param {options} [options]           Additional options which modify the created message.
 * @param {string} [options.rollMode]   The template roll mode to use for the message from CONFIG.Dice.rollModes
 * @param {boolean} [options.create=true]   Whether to automatically create the chat message, or only return the
 *                                          prepared chatData object.
 * @returns {Promise<ChatMessage|object>} A promise which resolves to the created ChatMessage document if create is
 *                                        true, or the Object of prepared chatData otherwise.
 */
export async function showVeretenoMessage(roll, rollResult, messageData = {}, { rollMode, create = true } = {}) {
    let rolls = [];
    roll.terms.forEach(t => {
        t.results.forEach(r => {
            rolls.push({
                result: r.result,
                faces: t.faces
            });
        });
    });

    let rollData = {
        rolls: rolls,
        total: rollResult.successes,
        formula: roll.formula
    }

    // Prepare chat data
    messageData = foundry.utils.mergeObject({
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        content: String(rollResult.successes),
        sound: CONFIG.sounds.dice
    }, messageData);

    const msg = new VeretenoChatMessage(messageData, rollData);

    if (create) return VeretenoChatMessage.create(msg.toObject(), { rollMode });
    else {
        if (rollMode) msg.applyRollMode(rollMode);
        return msg.toObject();
    }

    // let rollMessage = await renderTemplate(
    //     "systems/vereteno/templates/sidebar/vereteno-roll.html",
    //     rollData
    // );

    // // Perform the roll, if it has not yet been rolled
    // if (!roll._evaluated) await roll.evaluate({ async: true });

    // // Prepare chat data
    // messageData = foundry.utils.mergeObject({
    //     user: game.user.id,
    //     type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    //     content: String(rollResult.successes),
    //     sound: CONFIG.sounds.dice
    // }, messageData);
    // messageData.rolls = [roll];

    // // Either create the message or just return the chat data
    // const cls = getDocumentClass("ChatMessage");
    // const msg = new cls(messageData);



    // let msgHtml = await msg.getHTML();

    // // Either create or return the data
    // if (create) return cls.create(msg.toObject(), { rollMode });
    // else {
    //     if (rollMode) msg.applyRollMode(rollMode);
    //     return msg.toObject();
    // }
}

export class VeretenoChatMessage extends ChatMessage {
    constructor(messageData, rollData) {
        super(messageData);

        this.rollData = rollData;
    }

    async _renderRollHTML(messageData) {
        const m = foundry.utils.mergeObject(messageData, this.rollData);
        return await renderTemplate(
            "systems/vereteno/templates/sidebar/vereteno-roll.html",
            m
        );
    }
}