import { VeretenoItem } from "$module/item";
import { VeretenoActor } from "..";

abstract class VeretenoActorSheet<TActor extends VeretenoActor> extends ActorSheet<TActor, VeretenoItem> {
    static override get defaultOptions(): ActorSheetOptions {
        return mergeObject(super.defaultOptions, {
            width: 560,
            classes: ['vereteno', 'actor', 'sheet']
        })
    }

    override async getData(options: Partial<DocumentSheetOptions> = {}): Promise<VeretenoActorSheetData<TActor>> {
        options.id = this.id;
        options.editable = this.isEditable;

        const { actor } = this;

        return {
            actor: actor,
            cssClass: this.actor.isOwner ? "editable" : "locked",
            data: actor.system,
            document: this.actor,
            editable: this.isEditable,
            effects: [],
            limited: this.actor.limited,
            options,
            owner: this.actor.isOwner,
            title: this.title,
            items: actor.items,
            actorType: actor.type,

            description: actor.Description
        }
    }

    override activateListeners($html: JQuery): void {
        super.activateListeners($html);
    }
}

interface VeretenoActorSheetData<TActor extends VeretenoActor> extends ActorSheetData<TActor> {
    actorType: string | null;
    actor: TActor;
    data: TActor["system"];
    description: string;
}

export { VeretenoActorSheet }
export type { VeretenoActorSheetData }
