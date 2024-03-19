import { Init } from './init';
import { Load } from './load';

export const HooksVereteno = {
    listen(): void {
        const listeners: { listen(): void }[] = [
            Init,
            Load,
        ];
        for (const Listener of listeners) {
            Listener.listen();
        }
    },
};
