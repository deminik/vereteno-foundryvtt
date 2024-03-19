import { VeretenoItemProxy } from "$module/item/base/document";

export const Load = {
    listen(): void {
        CONFIG.Item.documentClass = VeretenoItemProxy;
    }
}