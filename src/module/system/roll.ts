import { VeretenoRollData, VeretenoRollOptions } from "$module/data";
import { ChatMessageSchema } from "../../../types/foundry/common/documents/chat-message";

class VeretenoRoll extends Roll {
    static override CHAT_TEMPLATE = "systems/vereteno/templates/chat/rolls/vereteno-roll-chat-message.hbs";

    constructor(formula: string, data?: Record<string, unknown>, options?: RollOptions) {
        super(formula, data, options);
    }

    protected override async _evaluate({ minimize, maximize, }: Omit<EvaluateRollParams, "async">): Promise<Rolled<this>> {
        const superEvaluate = await super._evaluate({ minimize, maximize });

        return superEvaluate;
    }
}

interface VeretenoRoll extends Roll { }

class VeretenoSkillRoll extends VeretenoRoll {
    constructor(options: VeretenoRollOptions) {
        const rollData = options.rollData;
        const formula = `${rollData.pool}${rollData.dice}`;

        super(formula, (rollData as Record<string, any>), options.messageData);
    }
}
interface VeretenoSkillRoll extends VeretenoRoll { }

export { VeretenoRoll, VeretenoSkillRoll }
