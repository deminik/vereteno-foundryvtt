export class VeretenoRollDialog {
    template: string = 'systems/vereteno/templates/chat/dialog/roll-dialog.hbs';

    async getTaskCheckOptions(): Promise<VeretenoRollDialogArgument> {
        const html = await renderTemplate(this.template, {});

        return new Promise(resolve => {
            const data = {
                title: "Модификаторы броска",
                content: html,
                buttons: {
                    normal: {
                        label: "Далее",
                        callback: html => resolve(this._processTaskCheckOptions((html[0] as unknown as HTMLAnchorElement).querySelector("form")))
                    },
                    cancel: {
                        label: "Отмена"
                    }
                },
                default: "normal",
                close: () => resolve({ modifier: 0, blindRoll: false, cancelled: true })
            };

            new Dialog(data).render(true);
        });
    }

    _processTaskCheckOptions(form: JQuery): VeretenoRollDialogArgument {
        return {
            modifier: parseInt(form.modifier.value),
            blindRoll: form.blindRoll.checked,
            cancelled: false
        };
    }
}

export class VeretenoRollDialogArgument {
    modifier: number = 0;
    blindRoll: boolean = false;
    cancelled: boolean = true;
}