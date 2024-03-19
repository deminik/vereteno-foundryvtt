import { VeretenoCharacter, VeretenoMonster, VeretenoNpc } from "$module/actor";
import { VeretenoArmor } from "$module/item";
import { VeretenoWeapon } from "$module/item/weapon/document";

export const VERETENOCONFIG = {
    common: {
        price: "vereteno.common.price",
    },
    tabs: {
        stat: "vereteno.tab.stat",
        equipment: "vereteno.tab.equipment",
        fight: "vereteno.tab.fight",
        bio: "vereteno.tab.bio"
    },
    attackTypes: {
        none: "vereteno.attack.none",
        brawling: "vereteno.attack.brawling",
        melee: "vereteno.attack.melee",
        ranged: "vereteno.attack.ranged",
    },
    rangeTypes: {
        pointBlank: "vereteno.range.pointBlank",
        close: "vereteno.range.close",
        medium: "vereteno.range.medium",
        long: "vereteno.range.long",
        utmost: "vereteno.range.utmost"
    },
    stats: {
        hitPoints: "vereteno.stat.hitPoint",
        willPoints: "vereteno.stat.willPoint",
        reputation: "vereteno.stat.reputation"
    },
    attributes: {
        constitution: "vereteno.attribute.constitution",
        intelligence: "vereteno.attribute.intelligence",
        dexterity: "vereteno.attribute.dexterity",
        empathy: "vereteno.attribute.empathy"
    },
    skills: {
        melee: "vereteno.skill.melee",
        strength: "vereteno.skill.strength",
        agility: "vereteno.skill.agility",
        piloting: "vereteno.skill.piloting",
        stealth: "vereteno.skill.stealth",
        ranged: "vereteno.skill.ranged",
        cybershamanism: "vereteno.skill.cybershamanism",
        survival: "vereteno.skill.survival",
        medicine: "vereteno.skill.medicine",
        observation: "vereteno.skill.observation",
        science: "vereteno.skill.science",
        mechanics: "vereteno.skill.mechanics",
        manipulation: "vereteno.skill.manipulation",
        leadership: "vereteno.skill.leadership",
        witchcraft: "vereteno.skill.witchcraft",
        culture: "vereteno.skill.culture"
    },

    Item: {
        documentClasses: {
            armor: VeretenoArmor,
            weapon: VeretenoWeapon
        },
    },

    Actor: {
        documentClasses: {
            character: VeretenoCharacter,
            npc: VeretenoNpc,
            monster: VeretenoMonster
        }
    }
}