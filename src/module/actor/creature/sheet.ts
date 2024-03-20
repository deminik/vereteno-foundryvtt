import { VeretenoCreature } from "../index";
import { VeretenoActorSheet, VeretenoActorSheetData } from "../base/sheet";
import { AttributeWithSkills, AttributesBlock, Skill, SkillsBlock, Stat, StatsBlock } from "./data";
import { VeretenoRoll, VeretenoSkillRoll } from "$module/system/roll";
import { VeretenoRollData } from "../base/data";
import { VeretenoRollOptions, VeretenoRollType } from "$module/data";
import { VeretenoRoller } from "$module/utils/vereteno-roller";

abstract class VeretenoCreatureSheet<TActor extends VeretenoCreature> extends VeretenoActorSheet<TActor>{
    override async getData(options: Partial<DocumentSheetOptions> = {}): Promise<VeretenoCreatureSheetData<TActor>> {
        const sheetData = await super.getData(options);

        const { actor } = this;

        for (let [k, v] of Object.entries(actor.Stats)) {
            (v as Stat).label = game.i18n.localize(`vereteno.stat.${k}`);
        }

        for (let [k, v] of Object.entries(actor.Attributes)) {
            (v as AttributeWithSkills).label = game.i18n.localize(`vereteno.attribute.${k}`);
            (v as AttributeWithSkills).skills = {};

            for (let [k1, v1] of Object.entries(actor.Skills).filter(x => x[1].attribute === k)) {
                (v1 as Skill).label = game.i18n.localize(`vereteno.skill.${k1}`);
                (v as AttributeWithSkills).skills[k1] = v1;
            }
        }

        return {
            ...sheetData,
            stats: actor.Stats,
            attributes: actor.Attributes,
            skills: actor.Skills,
            maxHp: actor.MaxHp,
            maxWp: actor.MaxWp,
        }
    }

    override activateListeners($html: JQuery): void {
        super.activateListeners($html);
        const html = $html[0];

        $html.on('click', '.skill-check', this.#onSkillCheckRoll.bind(this));

        // html.addEventListener('click', '.item-action', this.#onItemAction.bind(this));
        // html.on('click', '.weapon-action', this.#onWeaponAction.bind(this));
        // html.on('click', '.armor-action', this.#onArmorAction.bind(this));
    }

    async #onSkillCheckRoll(event: MouseEvent) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = (element as HTMLAnchorElement)?.dataset;

        const { actor } = this;

        let { label, rollKey, rollType } = dataset;

        if (rollKey == null || rollType == null) {
            return;
        }

        let rollData: VeretenoRollData;
        if (rollType == "attribute") {
            rollData = await actor.getAttributeRollData(rollKey);
        } else {
            rollData = await actor.getSkillRollData(rollKey);
        }

        let messageData = {
            userId: game.user._id || undefined,
            speaker: ChatMessage.getSpeaker(),
            flavor: label || '',
            sound: CONFIG.sounds.dice,
            blind: false
        };

        const rollOptions: VeretenoRollOptions = {
            type: VeretenoRollType.Regular,
            messageData: messageData,
            rollData: rollData
        }

        const roller = new VeretenoRoller();
        await roller.roll(rollOptions);
    }

    async #onWeaponAction(event: MouseEvent) {

    }

    async #onItemAction(event: MouseEvent) {

    }

    async #onArmorAction(event: MouseEvent) {

    }
}

interface VeretenoCreatureSheetData<TActor extends VeretenoCreature> extends VeretenoActorSheetData<TActor> {
    stats: StatsBlock;
    attributes: AttributesBlock;
    skills: SkillsBlock;
    maxHp: number;
    maxWp: number;
}

export { VeretenoCreatureSheet }
export type { VeretenoCreatureSheetData }