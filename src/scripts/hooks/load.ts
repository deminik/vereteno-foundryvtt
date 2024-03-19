import { VeretenoActorProxy } from "$module/actor/base/document";
import { VeretenoActors } from "$module/collection";
import { VeretenoItemProxy } from "$module/item/base/document";

export const Load = {
    listen(): void {
        CONFIG.Actor.collection = VeretenoActors;
        CONFIG.Actor.documentClass = VeretenoActorProxy;
        CONFIG.Item.documentClass = VeretenoItemProxy;
    }
}