import { Init } from './init';

export const HooksVereteno = {
    listen(): void {
        const listeners: { listen(): void }[] = [
            Init
        ];
        for (const Listener of listeners) {
            Listener.listen();
        }
    },
};
