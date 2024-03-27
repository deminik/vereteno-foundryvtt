import { VeretenoActorProxy } from "$module/actor/base/document";
import { VeretenoActors } from "$module/collection";
import { VeretenoItemProxy } from "$module/item/base/document";
import { VeretenoRoll } from "$module/system/roll";

export const Load = {
    listen(): void {
        CONFIG.Actor.collection = VeretenoActors;
        CONFIG.Actor.documentClass = VeretenoActorProxy;
        CONFIG.Item.documentClass = VeretenoItemProxy;

        CONFIG.Dice.rolls.push(VeretenoRoll);
    }
}