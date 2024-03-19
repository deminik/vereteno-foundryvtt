import { VeretenoCharacter } from "..";
import { VeretenoCreatureSheet, VeretenoCreatureSheetData } from "../creature/sheet";

class VeretenoCharacterSheet<TActor extends VeretenoCharacter> extends VeretenoCreatureSheet<TActor>{
    static override get defaultOptions(): ActorSheetOptions {
        const superOptions = super.defaultOptions;
        const mergedObject = mergeObject(superOptions, {
            width: 560,
            classes: [...superOptions.classes, 'character-sheet'],
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "main",
                },
            ]
        });

        return mergedObject;
    }

    override async getData(options: Partial<DocumentSheetOptions> = {}): Promise<VeretenoCharacterSheetData<TActor>> {
        const sheetData = await super.getData(options);

        const { actor } = this;

        return {
            ...sheetData,
            money: actor.Money,
            reputation: actor.Reputation,
            exp: actor.Exp
        };
    }

    get template() {
        return `systems/vereteno/templates/sheets/actors/character-sheet.hbs`;
    }
}

interface VeretenoCharacterSheetData<TActor extends VeretenoCharacter> extends VeretenoCreatureSheetData<TActor> {
    money: number;
    reputation: number;
    exp: number;
}

export { VeretenoCharacterSheet }