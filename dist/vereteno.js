"use strict";
(() => {
  // src/module/item/base/sheet.ts
  var VeretenoItemSheet = class extends ItemSheet {
    get itemData() {
      return this.item.data;
    }
    get itemProperties() {
      return this.item.system;
    }
    static get defaultOptions() {
      const isRussianLanguage = game.settings.get("core", "language") == "ru";
      const options = mergeObject(super.defaultOptions, {
        width: 560,
        classes: ["vereteno", "item", "sheet"]
      });
      if (isRussianLanguage) {
        options.classes.push("lang-ru");
      }
      return options;
    }
    get template() {
      return `systems/vereteno/templates/sheets/items/${this.item.type}-sheet.hbs`;
    }
    async getData(options = {}) {
      options.id = this.id;
      options.editable = this.isEditable;
      const { item } = this;
      const enrichedContent = {};
      const rollData = { ...this.item.getRollData(), ...this.actor?.getRollData() };
      return {
        itemType: null,
        item,
        data: item.system,
        isPhysical: false,
        description: item.Description,
        cssClass: this.isEditable ? "editable" : "locked",
        editable: this.isEditable,
        document: item,
        limited: this.item.limited,
        options: this.options,
        owner: this.item.isOwner,
        title: this.title
      };
    }
    async _updateObject(event, formData) {
      return super._updateObject(event, formData);
    }
  };

  // src/module/item/physical-item/sheet.ts
  var PhysicalVeretnoItemSheet = class extends VeretenoItemSheet {
    async getData(options) {
      const sheetData = await super.getData(options);
      const { item } = this;
      return {
        ...sheetData,
        isPhysical: true,
        weight: item.weight,
        price: item.price
      };
    }
  };

  // src/module/item/armor/sheet.ts
  var VeretenoArmorSheet = class extends PhysicalVeretnoItemSheet {
    async getData(options) {
      const sheetData = await super.getData(options);
      const { item } = this;
      const result = {
        ...sheetData,
        armorClass: item.armorClass,
        quality: item.quality,
        durability: item.durability,
        maxDurability: item.maxDuarability
      };
      return result;
    }
    get template() {
      return `systems/vereteno/templates/sheets/items/armor-sheet.hbs`;
    }
  };

  // src/module/actor/base/document.ts
  var VeretenoActor = class extends Actor {
    get Description() {
      return (this.system.description || "").trim();
    }
  };
  var VeretenoActorProxy = new Proxy(VeretenoActor, {
    construct(_target, args) {
      const source = args[0];
      const type = source?.type;
      return new CONFIG.VERETENO.Actor.documentClasses[type](...args);
    }
  });

  // src/module/data.ts
  var VeretenoRollData = class {
    dice = "d20";
    pool = 1;
    bonus = 0;
    isSerial = false;
  };

  // src/module/item/weapon/data.ts
  var WeaponType = /* @__PURE__ */ ((WeaponType2) => {
    WeaponType2["None"] = "none";
    WeaponType2["Brawling"] = "brawling";
    WeaponType2["Melee"] = "melee";
    WeaponType2["Ranged"] = "ranged";
    return WeaponType2;
  })(WeaponType || {});
  var RangeType = /* @__PURE__ */ ((RangeType2) => {
    RangeType2["None"] = "none";
    RangeType2["PointBlank"] = "pointBlank";
    RangeType2["Close"] = "close";
    RangeType2["Medium"] = "medium";
    RangeType2["Long"] = "long";
    RangeType2["Utmost"] = "utmost";
    return RangeType2;
  })(RangeType || {});

  // src/module/actor/creature/document.ts
  var VeretenoCreature = class extends VeretenoActor {
    get Stats() {
      const hp = this.system.stats.hitPoints.value;
      if (hp > this.MaxHp) {
        this.system.stats.hitPoints.value = this.MaxHp;
      }
      const wp = this.system.stats.willPoints.value;
      if (wp > this.MaxWp) {
        this.system.stats.willPoints.value = this.MaxWp;
      }
      return this.system.stats;
    }
    get Attributes() {
      return this.system.attributes;
    }
    get Skills() {
      return this.system.skills;
    }
    get MaxHp() {
      const constitutionValue = this.Attributes.constitution.value;
      const dexterityValue = this.Attributes.dexterity.value;
      const bonuses = 0;
      return constitutionValue + dexterityValue + bonuses;
    }
    get MaxWp() {
      const intelligenceValue = this.Attributes.intelligence.value;
      const empathyValue = this.Attributes.empathy.value;
      const bonuses = 0;
      return intelligenceValue + empathyValue + bonuses;
    }
    /**
     * Имеющееся оружие.
     */
    get Weapons() {
      return this.items.map((x) => x).filter((x) => x.type == "weapon" /* Weapon */).map((x) => x);
    }
    /**
     * Экипированное оружие.
     */
    get EquippedWeapons() {
      return this.Weapons.filter((x) => x.system.isEquipped);
    }
    /**
     * Имеющаяся броня.
     */
    get Armors() {
      return this.items.map((x) => x).filter((x) => x.type == "armor" /* Armor */).map((x) => x);
    }
    /**
     * Экипированная броня.
     */
    get EquippedArmor() {
      return this.Armors.filter((x) => x.system.isEquipped)[0] || null;
    }
    get Items() {
      let items = this.items.map((x) => x);
      items = items.filter((x) => !this.Armors.find((a) => a.id == x.id)).filter((x) => !this.Weapons.find((w) => w.id == x.id));
      return items;
    }
    get EquippedItems() {
      return this.Items.filter((x) => x.system.isEquipped);
    }
    async getAttributeRollData(key) {
      const attribute = this.Attributes[key];
      const result = new VeretenoRollData();
      if (attribute == null) {
        return result;
      }
      const value = attribute.value;
      const bonuses = 0;
      result.pool = value + bonuses;
      return result;
    }
    async getSkillRollData(key) {
      const result = new VeretenoRollData();
      const skill = this.Skills[key];
      if (skill == null) {
        return result;
      }
      const attributeRollData = await this.getAttributeRollData(skill.attribute);
      const value = skill.value;
      const bonuses = 0;
      result.pool = attributeRollData.pool + value + bonuses;
      return result;
    }
    async getWeaponRollData(weaponData) {
      let item = this.items.get(weaponData.id);
      let itemSkill = item.system.attackWith;
      let skillRollData = await this.getSkillRollData(itemSkill);
      let weaponAttackTypeModifier = this.getWeaponAttackTypeModifier(weaponData);
      let weaponAttackModifier = item.system.modifier;
      let weaponDamage = item.system.damage;
      const rollData = mergeObject(
        skillRollData,
        {
          pool: skillRollData.pool + weaponAttackTypeModifier + weaponAttackModifier,
          weaponDamage,
          weaponAttackModifier
        }
      );
      if (weaponData.attackType == "burst" /* Burst */) {
        rollData.isSerial = true;
      }
      return rollData;
    }
    getWeaponAttackTypeModifier(weaponData) {
      if (weaponData.weaponType == "melee" /* Melee */ || weaponData.weaponType == "brawling" /* Brawling */) {
        if (weaponData.attackType == "power" /* Power */) {
          return 2;
        }
        if (weaponData.attackType == "light" /* Light */) {
          return -2;
        }
        return 0;
      }
      if (weaponData.weaponType == "ranged" /* Ranged */) {
        if (weaponData.attackType == "aimed" /* Aimed */) {
          return 2;
        }
        if (weaponData.attackType == "hip" /* Hip */) {
          return -2;
        }
        if (weaponData.attackType == "burst" /* Burst */) {
          return -2;
        }
        return 0;
      }
      return 0;
    }
    async getArmorRollData(itemId) {
      const result = new VeretenoRollData();
      let item = this.items.get(itemId);
      if (!item) {
        return null;
      }
      result.pool = item.system.durability;
      return result;
    }
    async getInitiativeRollData(itemId) {
      let item = this.items.get(itemId);
      let skill = this.Skills.agility;
      let bonuses = 0;
      const result = new VeretenoRollData();
      result.pool = 1;
      result.bonus = skill.value + item.system.modifier + bonuses;
      return result;
    }
    async equipWeapon() {
    }
    async equipArmor() {
    }
    async unequipItem() {
    }
  };

  // src/module/actor/character/document.ts
  var VeretenoCharacter = class extends VeretenoCreature {
    get Money() {
      return this.system.money || 0;
    }
    get Reputation() {
      return this.system.reputation || 0;
    }
    get Exp() {
      return this.system.exp || 0;
    }
  };

  // src/module/actor/monster/document.ts
  var VeretenoMonster = class extends VeretenoCreature {
  };

  // src/module/actor/npc/document.ts
  var VeretenoNpc = class extends VeretenoCreature {
  };

  // src/module/item/base/document.ts
  var VeretenoItem = class extends Item {
    get data() {
      return this.prepareData();
    }
    get Description() {
      return (this.system.description || "").trim();
    }
    /** Keep `TextEditor` and anything else up to no good from setting this item's description to `null` */
    async _preUpdate(changed, options, user) {
      return super._preUpdate(changed, options, user);
    }
    /** Refresh the Item Directory if this item isn't embedded */
    _onUpdate(data, options, userId) {
      super._onUpdate(data, options, userId);
    }
  };
  var VeretenoItemProxy = new Proxy(VeretenoItem, {
    construct(_target, args) {
      const source = args[0];
      const type = source?.type;
      const ItemClass = CONFIG.VERETENO.Item.documentClasses[type] ?? VeretenoItem;
      return new ItemClass(...args);
    }
  });

  // src/module/item/physical-item/document.ts
  var PhysicalVeretenoItem = class extends VeretenoItem {
    get weight() {
      return this.system.weight || 0;
    }
    get price() {
      return this.system.price || 0;
    }
  };

  // src/module/item/armor/document.ts
  var VeretenoArmor = class extends PhysicalVeretenoItem {
    get armorClass() {
      return this.system.armorClass || 0;
    }
    get quality() {
      return this.system.quality || 0;
    }
    get maxDuarability() {
      return this.armorClass + this.quality;
    }
    get durability() {
      return this.system.durability || this.maxDuarability;
    }
  };

  // src/common.ts
  var SkillType = /* @__PURE__ */ ((SkillType2) => {
    SkillType2["None"] = "none";
    SkillType2["Melee"] = "melee";
    SkillType2["Strength"] = "strength";
    SkillType2["Agility"] = "agility";
    SkillType2["Piloting"] = "piloting";
    SkillType2["Stealth"] = "stealth";
    SkillType2["Ranged"] = "ranged";
    SkillType2["Cybershamanism"] = "cybershamanism";
    SkillType2["Survival"] = "survival";
    SkillType2["Medicine"] = "medicine";
    SkillType2["Observation"] = "observation";
    SkillType2["Science"] = "science";
    SkillType2["Mechanics"] = "mechanics";
    SkillType2["Manipulation"] = "manipulation";
    SkillType2["Leadership"] = "leadership";
    SkillType2["Witchcraft"] = "witchcraft";
    SkillType2["Culture"] = "culture";
    return SkillType2;
  })(SkillType || {});

  // src/module/item/weapon/document.ts
  var VeretenoWeapon = class extends PhysicalVeretenoItem {
    get Modifier() {
      return this.system.modifier;
    }
    get Damage() {
      return this.system.damage;
    }
    get Initiative() {
      return this.system.initiative;
    }
    get Crit() {
      return this.system.crit;
    }
    get WeaponType() {
      return this.system.weaponType || "none" /* None */;
    }
    get AttackWith() {
      return this.system.attackWith || "none" /* None */;
    }
    get Range() {
      return this.system.range || "none" /* None */;
    }
    get HasBurst() {
      return this.system.hasBurst || false;
    }
  };

  // src/veretenoConfig.ts
  var VERETENOCONFIG = {
    common: {
      price: "vereteno.common.price"
    },
    tabs: {
      stat: "vereteno.tab.stat",
      equipment: "vereteno.tab.equipment",
      fight: "vereteno.tab.fight",
      bio: "vereteno.tab.bio"
    },
    weaponTypes: {
      none: "vereteno.weaponType.none",
      brawling: "vereteno.weaponType.brawling",
      melee: "vereteno.weaponType.melee",
      ranged: "vereteno.weaponType.ranged"
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
      }
    },
    Actor: {
      documentClasses: {
        character: VeretenoCharacter,
        npc: VeretenoNpc,
        monster: VeretenoMonster
      }
    }
  };

  // src/partials.ts
  var VERETENO_PARTIALS = [
    "systems/vereteno/templates/sheets/partials/actor/stats-tab.hbs",
    "systems/vereteno/templates/sheets/partials/actor/stats-block.hbs",
    "systems/vereteno/templates/sheets/partials/actor/skills-block.hbs",
    "systems/vereteno/templates/sheets/partials/actor/equipment-tab.hbs",
    "systems/vereteno/templates/sheets/partials/actor/item/weapon-plate.hbs",
    "systems/vereteno/templates/sheets/partials/actor/item/armor-plate.hbs",
    "systems/vereteno/templates/sheets/partials/actor/item/equipment-plate.hbs",
    "systems/vereteno/templates/sheets/partials/actor/fight-tab.hbs",
    "systems/vereteno/templates/sheets/partials/actor/fight/brawling-weapon-plate.hbs",
    "systems/vereteno/templates/sheets/partials/actor/fight/melee-weapon-plate.hbs",
    "systems/vereteno/templates/sheets/partials/actor/fight/ranged-weapon-plate.hbs",
    "systems/vereteno/templates/sheets/partials/actor/fight/armor-plate.hbs",
    "systems/vereteno/templates/sheets/partials/actor/bio-tab.hbs",
    "systems/vereteno/templates/sheets/partials/item/base-item-block.hbs",
    "systems/vereteno/templates/sheets/partials/item/physical-item-block.hbs"
  ];

  // src/module/item/weapon/sheet.ts
  var VeretenoWeaponSheet = class extends PhysicalVeretnoItemSheet {
    async getData(options) {
      const sheetData = await super.getData(options);
      const { item } = this;
      var weaponTypes = Object.values(WeaponType).map((e, i) => {
        return { id: i, label: game.i18n.localize(`vereteno.weaponType.${e}`), type: e };
      });
      var rangeTypes = Object.values(RangeType).map((e, i) => {
        return { id: i, label: game.i18n.localize(`vereteno.range.${e}`), type: e };
      });
      var skillTypes = Object.values(SkillType).map((e, i) => {
        return { id: i, label: game.i18n.localize(`vereteno.skill.${e}`), type: e };
      });
      const result = {
        ...sheetData,
        modifier: item.Modifier,
        weaponType: item.WeaponType,
        attackWith: item.AttackWith,
        crit: item.Crit,
        damage: item.Damage,
        initiative: item.Initiative,
        range: item.Range,
        weaponTypes,
        ranges: rangeTypes,
        skills: skillTypes,
        isRanged: item.Range > "medium" /* Medium */,
        hasBurst: item.HasBurst
      };
      return result;
    }
    get template() {
      return `systems/vereteno/templates/sheets/items/weapon-sheet.hbs`;
    }
  };

  // src/module/actor/base/sheet.ts
  var VeretenoActorSheet = class extends ActorSheet {
    static get defaultOptions() {
      const isRussianLanguage = game.settings.get("core", "language") == "ru";
      const options = mergeObject(super.defaultOptions, {
        width: 560,
        classes: ["vereteno", "actor", "sheet"]
      });
      if (isRussianLanguage) {
        options.classes.push("lang-ru");
      }
      return options;
    }
    async getData(options = {}) {
      options.id = this.id;
      options.editable = this.isEditable;
      const { actor } = this;
      return {
        actor,
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
      };
    }
    activateListeners($html) {
      super.activateListeners($html);
    }
  };

  // src/module/system/roll.ts
  var VeretenoRoll = class extends Roll {
    static CHAT_TEMPLATE = "systems/vereteno/templates/chat/rolls/vereteno-roll-chat-message.hbs";
    constructor(formula, data, options) {
      super(formula, data, options);
    }
    async _evaluate({ minimize, maximize }) {
      const superEvaluate = await super._evaluate({ minimize, maximize });
      return superEvaluate;
    }
  };

  // src/module/utils/vereteno-roller.ts
  var VeretenoRoller = class {
    rollObject = null;
    options = null;
    veretenoResult = new VeretenoResult();
    veretenoRolls = [];
    async roll(rollOptions) {
      this.options = rollOptions;
      if (rollOptions.rollData.pool <= 0 && rollOptions.type != "armor-block" /* ArmorBlock */) {
        return await this.rollDesperation(rollOptions);
      }
      let rollFormula = `${rollOptions.rollData.pool}${rollOptions.rollData.dice}`;
      let roll = new VeretenoRoll(rollFormula);
      this.rollObject = roll;
      if (!this.rollObject._evaluated) {
        await this.rollObject.evaluate({});
      }
      await this.reevaluateTotal();
      this.toMessage();
    }
    async rollDesperation(rollOptions) {
      let rollFormula = "0d20";
      if (rollOptions.rollData.pool == 0) {
        rollFormula = "1d20";
      } else {
        rollFormula = "2d20";
      }
      let roll = new VeretenoRoll(rollFormula);
      this.rollObject = roll;
      this.options.type = "desperation" /* Desperation */;
      await this.reevaluateDesperationTotal();
      this.toMessage();
    }
    async rollInitiative(rollOptions) {
      this.options = rollOptions;
      let rollFormula = `${rollOptions.rollData.pool}${rollOptions.rollData.dice}`;
      const bonus = rollOptions.rollData.bonus;
      if (bonus !== null && bonus !== 0) {
        if (bonus > 0) {
          rollFormula = rollFormula + `+${bonus}`;
        } else {
          rollFormula = rollFormula + `${bonus}`;
        }
      }
      let roll = new VeretenoRoll(rollFormula);
      this.rollObject = roll;
      if (!this.rollObject._evaluated) {
        await this.rollObject.evaluate({});
      }
      await this.reevaluateTotal();
      this.toMessage();
    }
    async reevaluateTotal() {
      if (!this.rollObject || !this.options) {
        return;
      }
      if (!this.rollObject._evaluated) {
        await this.rollObject.evaluate({});
      }
      if (this.options.rollData.isSerial) {
        this.rollObject._formula += "+";
        let isInterrupted = false;
        while (!isInterrupted) {
          let additionalRoll = new Roll("1d20");
          await additionalRoll.evaluate({});
          const additionalRollResult = additionalRoll.terms[0].results[0];
          this.rollObject.terms[0].results.push(additionalRollResult);
          if (additionalRollResult.result <= 4) {
            isInterrupted = true;
          }
        }
      }
      let rollDicesResults = this.rollObject.terms[0].results;
      let rollResult = this.calculateDicesTotal(rollDicesResults);
      this.veretenoResult = rollResult;
    }
    async reevaluateDesperationTotal() {
      if (!this.rollObject) {
        return;
      }
      if (!this.rollObject._evaluated) {
        await this.rollObject.evaluate({});
      }
      let rollDicesResults = this.rollObject.terms[0].results;
      let rollResult = this.calculateDesperationDicesTotal(rollDicesResults);
      this.veretenoResult = rollResult;
    }
    calculateDicesTotal(dices) {
      const result = {
        total: 0,
        successes: 0,
        critFails: 0
      };
      dices.forEach((r) => {
        let rollResult = {
          result: r.result,
          classes: "d20"
        };
        if (r.result === 20) {
          result.total += 2;
          rollResult.classes += " max";
          result.successes += 2;
        }
        if (r.result >= 17 && r.result <= 19) {
          result.total++;
          rollResult.classes += " good";
          result.successes++;
        }
        if (r.result === 1) {
          result.total--;
          rollResult.classes += " min";
          result.critFails++;
        }
        this.veretenoRolls.push(rollResult);
      });
      return result;
    }
    calculateDesperationDicesTotal(dices) {
      const result = {
        total: 0,
        successes: 0,
        critFails: 0
      };
      dices.forEach((r) => {
        let rollResult = {
          result: r.result,
          classes: "d20"
        };
        if (r.result === 20) {
          result.total++;
          rollResult.classes += " max";
        }
        if (r.result === 1) {
          result.total--;
          rollResult.classes += " min";
          result.critFails++;
        }
        this.veretenoRolls.push(rollResult);
      });
      const dicesCount = dices.length;
      if (result.total == dicesCount) {
        result.total = 1;
        result.successes = 1;
      } else {
        if (result.total > 0) {
          result.total = 0;
        }
      }
      return result;
    }
    async toMessage() {
      if (!this.options) {
        return;
      }
      const chatData = this.options.messageData;
      const template = this.getTemplate(this.options.type);
      const veretenoRollData = this.getVeretenoRollData();
      chatData.content = await renderTemplate(template, veretenoRollData);
      chatData.roll = this.rollObject;
      let rollMode = game.settings.get("core", "rollMode");
      if (rollMode == "blindroll" || chatData.blind) {
        var gmRecipient = ChatMessage.getWhisperRecipients("GM");
        chatData.whisper = gmRecipient;
        rollMode = "blindroll";
        chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
      }
      if (rollMode == "gmroll") {
        var gmRecipient = ChatMessage.getWhisperRecipients("GM");
        chatData.whisper = gmRecipient;
        chatData.type = CONST.CHAT_MESSAGE_TYPES.WHISPER;
      }
      chatData.rollMode = rollMode;
      return this.rollObject?.toMessage(chatData, { create: false, rollMode }).then((e) => ChatMessage.create(e));
    }
    getTemplate(type) {
      switch (type) {
        case "regular" /* Regular */:
          return "systems/vereteno/templates/chat/rolls/vereteno-roll-chat-message.hbs";
        case "armor-block" /* ArmorBlock */:
          return "systems/vereteno/templates/chat/rolls/vereteno-armor-roll-chat-message.hbs";
        case "initiative" /* Initiative */:
          return "systems/vereteno/templates/chat/rolls/vereteno-initiative-roll-chat-message.hbs";
        default:
          return "systems/vereteno/templates/chat/rolls/vereteno-roll-chat-message.hbs";
      }
    }
    getVeretenoRollData() {
      let rollData = {
        formula: this.rollObject._formula,
        total: this.rollObject.total,
        veretenoTotal: this.veretenoResult.total,
        veretenoSuccesses: this.veretenoResult.successes,
        veretenoCritFails: this.veretenoResult.critFails,
        rolls: this.veretenoRolls
      };
      return rollData;
    }
  };
  var VeretenoResult = class {
    total = 0;
    successes = 0;
    critFails = 0;
  };

  // src/module/dialog/roll-dialog.ts
  var VeretenoRollDialog = class {
    template = "systems/vereteno/templates/chat/dialog/roll-dialog.hbs";
    async getTaskCheckOptions() {
      const html = await renderTemplate(this.template, {});
      return new Promise((resolve) => {
        const data = {
          title: "\u041C\u043E\u0434\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440\u044B \u0431\u0440\u043E\u0441\u043A\u0430",
          content: html,
          buttons: {
            normal: {
              label: "\u0414\u0430\u043B\u0435\u0435",
              callback: (html2) => resolve(this._processTaskCheckOptions(html2[0].querySelector("form")))
            },
            cancel: {
              label: "\u041E\u0442\u043C\u0435\u043D\u0430"
            }
          },
          default: "normal",
          close: () => resolve({ modifier: 0, blindRoll: false, cancelled: true })
        };
        new Dialog(data).render(true);
      });
    }
    _processTaskCheckOptions(form) {
      return {
        modifier: parseInt(form.modifier.value),
        blindRoll: form.blindRoll.checked,
        cancelled: false
      };
    }
  };
  var VeretenoRollDialogArgument = class {
    modifier = 0;
    blindRoll = false;
    cancelled = true;
  };

  // src/module/actor/creature/sheet.ts
  var VeretenoCreatureSheet = class extends VeretenoActorSheet {
    async getData(options = {}) {
      const sheetData = await super.getData(options);
      const { actor } = this;
      for (let [k, v] of Object.entries(actor.Stats)) {
        v.label = game.i18n.localize(`vereteno.stat.${k}`);
      }
      for (let [k, v] of Object.entries(actor.Attributes)) {
        v.label = game.i18n.localize(`vereteno.attribute.${k}`);
        v.skills = {};
        for (let [k1, v1] of Object.entries(actor.Skills).filter((x) => x[1].attribute === k)) {
          v1.label = game.i18n.localize(`vereteno.skill.${k1}`);
          v.skills[k1] = v1;
        }
      }
      const equippedWeapons = actor.EquippedWeapons.map((x) => {
        switch (x.WeaponType) {
          case "brawling" /* Brawling */:
            x.system["isBrawling"] = true;
            break;
          case "melee" /* Melee */:
            x.system["isMelee"] = true;
            break;
          case "ranged" /* Ranged */:
            x.system["isRanged"] = true;
            break;
          default:
            break;
        }
        return x;
      });
      return {
        ...sheetData,
        stats: actor.Stats,
        attributes: actor.Attributes,
        skills: actor.Skills,
        maxHp: actor.MaxHp,
        maxWp: actor.MaxWp,
        weapons: actor.Weapons,
        equippedWeapons,
        armors: actor.Armors,
        equippedArmor: actor.EquippedArmor,
        equipment: actor.Items,
        equippedEquipment: actor.EquippedItems
      };
    }
    activateListeners($html) {
      super.activateListeners($html);
      const html = $html[0];
      $html.on("click", ".skill-check", this.#onSkillCheckRoll.bind(this));
      $html.on("click", ".item-action", this.#onItemAction.bind(this));
      $html.on("click", ".armor-action", this.#onArmorAction.bind(this));
      $html.on("click", ".weapon-action", this.#onWeaponAction.bind(this));
    }
    async #onSkillCheckRoll(event) {
      event.preventDefault();
      const element = event.currentTarget;
      const dataset = element?.dataset;
      const { actor } = this;
      const showDialog = CONFIG.SETTINGS.ShowTaskCheckOptions !== event.ctrlKey;
      let dialogResult = new VeretenoRollDialogArgument();
      if (showDialog) {
        dialogResult = await new VeretenoRollDialog().getTaskCheckOptions();
        if (dialogResult.cancelled) {
          return;
        }
      }
      let { label, rollKey, rollType } = dataset;
      if (rollKey == null || rollType == null) {
        return;
      }
      let rollData = new VeretenoRollData();
      if (rollType == "attribute") {
        rollData = await actor.getAttributeRollData(rollKey);
      } else {
        rollData = await actor.getSkillRollData(rollKey);
      }
      rollData.pool += dialogResult.modifier;
      let messageData = {
        userId: game.user._id || void 0,
        speaker: ChatMessage.getSpeaker(),
        flavor: label || "",
        sound: CONFIG.sounds.dice,
        blind: dialogResult.blindRoll || event.shiftKey
      };
      const rollOptions = {
        type: "regular" /* Regular */,
        messageData,
        rollData
      };
      const roller = new VeretenoRoller();
      await roller.roll(rollOptions);
    }
    async #onWeaponAction(event) {
      event.preventDefault();
      const element = event.currentTarget;
      const dataset = element?.dataset;
      const { itemType, actionType, itemId, weaponType, attackType } = dataset;
      if (itemId == null || itemId == void 0) {
        return;
      }
      const chatOptions = {
        isBlind: event.shiftKey,
        showDialog: CONFIG.SETTINGS.ShowTaskCheckOptions !== event.ctrlKey
      };
      if (actionType === "initiative") {
        return await this.rollWeaponInitiative(itemId, chatOptions);
      } else if (actionType === "attack") {
        let weaponData = {
          id: itemId,
          weaponType,
          attackType
        };
        return await this.rollWeaponAttack(weaponData, chatOptions);
      }
    }
    async rollWeaponInitiative(weaponId, chatOptions) {
      const { actor } = this;
      let dialogResult = new VeretenoRollDialogArgument();
      if (chatOptions.showDialog) {
        dialogResult = await new VeretenoRollDialog().getTaskCheckOptions();
        if (dialogResult.cancelled) {
          return;
        }
      }
      const messageData = {
        userId: game.user._id || void 0,
        speaker: ChatMessage.getSpeaker(),
        flavor: "\u0418\u043D\u0438\u0446\u0438\u0430\u0442\u0438\u0432\u0430",
        sound: CONFIG.sounds.dice,
        blind: chatOptions.isBlind || dialogResult.blindRoll
      };
      let initiativeRollData = await actor.getInitiativeRollData(weaponId);
      if (initiativeRollData == null) {
        return;
      }
      initiativeRollData.bonus += dialogResult.modifier;
      const rollOptions = {
        type: "initiative" /* Initiative */,
        messageData,
        rollData: initiativeRollData
      };
      const veretenoRollHandler = new VeretenoRoller();
      await veretenoRollHandler.rollInitiative(rollOptions);
    }
    async rollWeaponAttack(weaponData, chatOptions) {
      const { actor } = this;
      let dialogResult = new VeretenoRollDialogArgument();
      if (chatOptions.showDialog) {
        dialogResult = await new VeretenoRollDialog().getTaskCheckOptions();
        if (dialogResult.cancelled) {
          return;
        }
      }
      const messageData = {
        userId: game.user._id || void 0,
        speaker: ChatMessage.getSpeaker(),
        flavor: weaponData.weaponType,
        sound: CONFIG.sounds.dice,
        blind: chatOptions.isBlind || dialogResult.blindRoll
      };
      let weaponRollData = await actor.getWeaponRollData(weaponData);
      weaponRollData.pool += dialogResult.modifier;
      const rollOptions = {
        type: "attack" /* Attack */,
        messageData,
        rollData: weaponRollData
      };
      const veretenoRollHandler = new VeretenoRoller();
      await veretenoRollHandler.roll(rollOptions);
    }
    async #onItemAction(event) {
      event.preventDefault();
      const element = event.currentTarget;
      const dataset = element?.dataset;
      const { itemType, actionType, itemId } = dataset;
      const itemInfo = { type: itemType, id: itemId };
      switch (actionType) {
        case "remove":
          return await this.removeItem(itemInfo);
          break;
        case "equip":
          return await this.equipItem(itemInfo);
          break;
        case "unequip":
          return await this.unequipItem(itemInfo);
          break;
        case "sheet":
          return this.displaySheet(itemInfo);
          break;
        default:
          return;
      }
    }
    async removeItem(itemInfo) {
      const item = this.actor.items.get(itemInfo.id);
      if (!item) {
        return;
      }
      this.actor.deleteEmbeddedDocuments("Item", [item._id]);
    }
    async equipItem(itemInfo) {
      switch (itemInfo.type) {
        case "weapon":
          return await this.equipWeapon(itemInfo.id);
          break;
        case "armor":
          return await this.equipArmor(itemInfo.id);
          break;
        default:
          return;
      }
    }
    async equipWeapon(itemId) {
      const item = this.actor.items.find((x) => x._id === itemId);
      if (!item) {
        return;
      }
      await this.actor.updateEmbeddedDocuments("Item", [
        { _id: item._id, "system.isEquipped": true }
      ]);
    }
    async equipArmor(itemId) {
      const equippedArmor = this.actor.items.find((x) => x.system.isEquipped && x.type === "armor" /* Armor */);
      if (equippedArmor) {
        return;
      }
      const item = this.actor.items.find((x) => x._id === itemId);
      if (!item) {
        return;
      }
      await this.actor.updateEmbeddedDocuments("Item", [
        { _id: item._id, "system.isEquipped": true }
      ]);
    }
    async unequipItem(itemInfo) {
      const item = this.actor.items.find(
        (x) => x._id === itemInfo.id && x.system && x.system.isEquipped
      );
      if (!item) {
        return;
      }
      await this.actor.updateEmbeddedDocuments("Item", [
        { _id: item._id, "system.isEquipped": false }
      ]);
    }
    displaySheet(itemInfo) {
      const item = this.actor.items.get(itemInfo.id);
      if (!item) {
        return;
      }
      item.sheet.render(true, { editable: true });
    }
    async #onArmorAction(event) {
      event.preventDefault();
      const element = event.currentTarget;
      const dataset = element?.dataset;
      const { itemType, actionType, itemId } = dataset;
      const chatOptions = {
        isBlind: event.shiftKey,
        showDialog: CONFIG.SETTINGS.ShowTaskCheckOptions !== event.ctrlKey
      };
      if (itemId == null || itemId == void 0) {
        return;
      }
      const messageData = {
        userId: game.user._id || void 0,
        speaker: ChatMessage.getSpeaker(),
        flavor: "",
        sound: CONFIG.sounds.dice,
        blind: false
      };
      switch (actionType) {
        case "block":
          return await this.rollArmorBlock(itemId, chatOptions);
          break;
        case "ablate":
          return await this.ablateArmor(itemId);
          break;
        case "repair":
          return await this.repairArmor(itemId);
          break;
        default:
          return;
      }
    }
    async rollArmorBlock(armorId, chatOptions) {
      const { actor } = this;
      let dialogResult = new VeretenoRollDialogArgument();
      if (chatOptions.showDialog) {
        dialogResult = await new VeretenoRollDialog().getTaskCheckOptions();
        if (dialogResult.cancelled) {
          return;
        }
      }
      const messageData = {
        userId: game.user._id || void 0,
        speaker: ChatMessage.getSpeaker(),
        flavor: "\u0417\u0430\u0449\u0438\u0442\u0430",
        sound: CONFIG.sounds.dice,
        blind: chatOptions.isBlind || dialogResult.blindRoll
      };
      let armorRollData = await actor.getArmorRollData(armorId);
      if (armorRollData == null) {
        return;
      }
      armorRollData.pool += dialogResult.modifier;
      const rollOptions = {
        type: "armor-block" /* ArmorBlock */,
        messageData,
        rollData: armorRollData
      };
      if (rollOptions.rollData.pool == 0) {
        return;
      }
      const veretenoRollHandler = new VeretenoRoller();
      await veretenoRollHandler.roll(rollOptions);
    }
    async ablateArmor(armorId, value = 1) {
      const { actor } = this;
      if (value < 1) {
        return;
      }
      const armor = this.actor.items.find((x) => x._id === armorId);
      if (!armor) {
        return;
      }
      if (armor.system.durability === 0) {
        return;
      }
      armor.system.durability -= value;
      if (armor.system.durability < 0) {
        armor.system.durability = 0;
      }
      if (armor.system.durability === 0) {
      }
      await this.actor.updateEmbeddedDocuments("Item", [
        { _id: armor._id, "system.durability": armor.system.durability }
      ]);
    }
    async repairArmor(armorId) {
      const armor = this.actor.items.find((x) => x._id === armorId);
      if (!armor) {
      }
      const maxDurability = armor.system.armorClass + armor.system.quality;
      if (armor.system.durability === maxDurability) {
      }
      await this.actor.updateEmbeddedDocuments("Item", [
        { _id: armor._id, "system.durability": maxDurability }
      ]);
    }
  };

  // src/module/actor/character/sheet.ts
  var VeretenoCharacterSheet = class extends VeretenoCreatureSheet {
    static get defaultOptions() {
      const superOptions = super.defaultOptions;
      const mergedObject = mergeObject(superOptions, {
        width: 560,
        classes: [...superOptions.classes, "character-sheet"],
        tabs: [
          {
            navSelector: ".sheet-tabs",
            contentSelector: ".sheet-body",
            initial: "main"
          }
        ]
      });
      return mergedObject;
    }
    async getData(options = {}) {
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
  };

  // src/module/actor/monster/sheet.ts
  var VeretenoMonsterSheet = class extends VeretenoCreatureSheet {
  };

  // src/module/actor/npc/sheet.ts
  var VeretenoNpcSheet = class extends VeretenoCreatureSheet {
  };

  // src/module/system/settings/index.ts
  function registerSettings() {
    game.settings.register("vereteno", "visibility.showTaskCheckOptions", {
      name: "vereteno.settings.showTaskCheckOptions.name",
      hint: "vereteno.settings.showTaskCheckOptions.hint",
      scope: "client",
      config: true,
      default: true,
      type: Boolean
    });
  }

  // src/module/system/settings/client-settings.ts
  var VeretenoClientSettings = class {
    get ShowTaskCheckOptions() {
      return game.settings.get("vereteno", "visibility.showTaskCheckOptions");
    }
  };

  // src/module/item/equipment/sheet.ts
  var VeretenoEquipmentSheet = class extends PhysicalVeretnoItemSheet {
    async getData(options) {
      const sheetData = await super.getData(options);
      const { item } = this;
      const result = {
        ...sheetData
      };
      return result;
    }
    get template() {
      return `systems/vereteno/templates/sheets/items/equipment-sheet.hbs`;
    }
  };

  // src/scripts/hooks/init.ts
  function preloadHandlebarsTemplates() {
    return loadTemplates(VERETENO_PARTIALS);
  }
  var Init = {
    listen() {
      Hooks.once("init", async function() {
        console.log("Vereteno | System init begin.");
        CONFIG.VERETENO = VERETENOCONFIG;
        CONFIG.SETTINGS = new VeretenoClientSettings();
        Actors.unregisterSheet("core", ActorSheet);
        Actors.registerSheet("vereteno", VeretenoCharacterSheet, {
          types: ["character"],
          makeDefault: true
        });
        Actors.registerSheet("vereteno", VeretenoMonsterSheet, {
          types: ["monster"],
          makeDefault: true
        });
        Actors.registerSheet("vereteno", VeretenoNpcSheet, {
          types: ["npc"],
          makeDefault: true
        });
        Items.unregisterSheet("core", ItemSheet);
        Items.registerSheet("vereteno", VeretenoItemSheet, {
          makeDefault: true
        });
        Items.registerSheet("vereteno", VeretenoArmorSheet, {
          types: ["armor"],
          makeDefault: true
        });
        Items.registerSheet("vereteno", VeretenoWeaponSheet, {
          types: ["weapon"],
          makeDefault: true
        });
        Items.registerSheet("vereteno", VeretenoEquipmentSheet, {
          types: ["equipment"],
          makeDefault: true
        });
        preloadHandlebarsTemplates();
        registerSettings();
        console.log("Vereteno | System init done.");
      });
    }
  };

  // src/module/collection/actors.ts
  var VeretenoActors = class extends Actors {
  };

  // src/scripts/hooks/load.ts
  var Load = {
    listen() {
      CONFIG.Actor.collection = VeretenoActors;
      CONFIG.Actor.documentClass = VeretenoActorProxy;
      CONFIG.Item.documentClass = VeretenoItemProxy;
      CONFIG.Dice.rolls.push(VeretenoRoll);
    }
  };

  // src/scripts/hooks/index.ts
  var HooksVereteno = {
    listen() {
      const listeners = [
        Init,
        Load
      ];
      for (const Listener of listeners) {
        Listener.listen();
      }
    }
  };

  // src/vereteno.ts
  HooksVereteno.listen();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL21vZHVsZS9pdGVtL2Jhc2Uvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL3BoeXNpY2FsLWl0ZW0vc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL2FybW9yL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvYmFzZS9kb2N1bWVudC50cyIsICIuLi9zcmMvbW9kdWxlL2RhdGEudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL3dlYXBvbi9kYXRhLnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvY3JlYXR1cmUvZG9jdW1lbnQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9jaGFyYWN0ZXIvZG9jdW1lbnQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9tb25zdGVyL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvbnBjL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9iYXNlL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9waHlzaWNhbC1pdGVtL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9hcm1vci9kb2N1bWVudC50cyIsICIuLi9zcmMvY29tbW9uLnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS93ZWFwb24vZG9jdW1lbnQudHMiLCAiLi4vc3JjL3ZlcmV0ZW5vQ29uZmlnLnRzIiwgIi4uL3NyYy9wYXJ0aWFscy50cyIsICIuLi9zcmMvbW9kdWxlL2l0ZW0vd2VhcG9uL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvYmFzZS9zaGVldC50cyIsICIuLi9zcmMvbW9kdWxlL3N5c3RlbS9yb2xsLnRzIiwgIi4uL3NyYy9tb2R1bGUvdXRpbHMvdmVyZXRlbm8tcm9sbGVyLnRzIiwgIi4uL3NyYy9tb2R1bGUvZGlhbG9nL3JvbGwtZGlhbG9nLnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvY3JlYXR1cmUvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9jaGFyYWN0ZXIvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9tb25zdGVyL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvbnBjL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvc3lzdGVtL3NldHRpbmdzL2luZGV4LnRzIiwgIi4uL3NyYy9tb2R1bGUvc3lzdGVtL3NldHRpbmdzL2NsaWVudC1zZXR0aW5ncy50cyIsICIuLi9zcmMvbW9kdWxlL2l0ZW0vZXF1aXBtZW50L3NoZWV0LnRzIiwgIi4uL3NyYy9zY3JpcHRzL2hvb2tzL2luaXQudHMiLCAiLi4vc3JjL21vZHVsZS9jb2xsZWN0aW9uL2FjdG9ycy50cyIsICIuLi9zcmMvc2NyaXB0cy9ob29rcy9sb2FkLnRzIiwgIi4uL3NyYy9zY3JpcHRzL2hvb2tzL2luZGV4LnRzIiwgIi4uL3NyYy92ZXJldGVuby50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0sIFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIuLi9pbmRleFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9JdGVtU2hlZXQ8VEl0ZW0gZXh0ZW5kcyBWZXJldGVub0l0ZW0+IGV4dGVuZHMgSXRlbVNoZWV0PFRJdGVtPiB7XHJcbiAgICBnZXQgaXRlbURhdGEoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbS5kYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBpdGVtUHJvcGVydGllcygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pdGVtLnN5c3RlbTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0IGRlZmF1bHRPcHRpb25zKCkge1xyXG4gICAgICAgIGNvbnN0IGlzUnVzc2lhbkxhbmd1YWdlID0gZ2FtZS5zZXR0aW5ncy5nZXQoXCJjb3JlXCIsIFwibGFuZ3VhZ2VcIikgPT0gJ3J1JztcclxuXHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IG1lcmdlT2JqZWN0KHN1cGVyLmRlZmF1bHRPcHRpb25zLCB7XHJcbiAgICAgICAgICAgIHdpZHRoOiA1NjAsXHJcbiAgICAgICAgICAgIGNsYXNzZXM6IFsndmVyZXRlbm8nLCAnaXRlbScsICdzaGVldCddXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYoaXNSdXNzaWFuTGFuZ3VhZ2Upe1xyXG4gICAgICAgICAgICBvcHRpb25zLmNsYXNzZXMucHVzaChcImxhbmctcnVcIilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvcHRpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB0ZW1wbGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gYHN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9pdGVtcy8ke3RoaXMuaXRlbS50eXBlfS1zaGVldC5oYnNgO1xyXG4gICAgfVxyXG5cclxuICAgIG92ZXJyaWRlIGFzeW5jIGdldERhdGEob3B0aW9uczogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4gPSB7fSk6IFByb21pc2U8VmVyZXRlbm9JdGVtU2hlZXREYXRhPFRJdGVtPj4ge1xyXG4gICAgICAgIG9wdGlvbnMuaWQgPSB0aGlzLmlkO1xyXG4gICAgICAgIG9wdGlvbnMuZWRpdGFibGUgPSB0aGlzLmlzRWRpdGFibGU7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgaXRlbSB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgLy8gRW5yaWNoIGNvbnRlbnRcclxuICAgICAgICBjb25zdCBlbnJpY2hlZENvbnRlbnQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcclxuICAgICAgICBjb25zdCByb2xsRGF0YSA9IHsgLi4udGhpcy5pdGVtLmdldFJvbGxEYXRhKCksIC4uLnRoaXMuYWN0b3I/LmdldFJvbGxEYXRhKCkgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgaXRlbVR5cGU6IG51bGwsXHJcbiAgICAgICAgICAgIGl0ZW06IGl0ZW0sXHJcbiAgICAgICAgICAgIGRhdGE6IGl0ZW0uc3lzdGVtLFxyXG4gICAgICAgICAgICBpc1BoeXNpY2FsOiBmYWxzZSxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uRGVzY3JpcHRpb24sXHJcbiAgICAgICAgICAgIGNzc0NsYXNzOiB0aGlzLmlzRWRpdGFibGUgPyBcImVkaXRhYmxlXCIgOiBcImxvY2tlZFwiLFxyXG4gICAgICAgICAgICBlZGl0YWJsZTogdGhpcy5pc0VkaXRhYmxlLFxyXG4gICAgICAgICAgICBkb2N1bWVudDogaXRlbSxcclxuICAgICAgICAgICAgbGltaXRlZDogdGhpcy5pdGVtLmxpbWl0ZWQsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHRoaXMub3B0aW9ucyxcclxuICAgICAgICAgICAgb3duZXI6IHRoaXMuaXRlbS5pc093bmVyLFxyXG4gICAgICAgICAgICB0aXRsZTogdGhpcy50aXRsZSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBvdmVycmlkZSBhc3luYyBfdXBkYXRlT2JqZWN0KGV2ZW50OiBFdmVudCwgZm9ybURhdGE6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIHN1cGVyLl91cGRhdGVPYmplY3QoZXZlbnQsIGZvcm1EYXRhKTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vSXRlbVNoZWV0RGF0YTxUSXRlbSBleHRlbmRzIFZlcmV0ZW5vSXRlbT4gZXh0ZW5kcyBJdGVtU2hlZXREYXRhPFRJdGVtPiB7XHJcbiAgICBpdGVtVHlwZTogc3RyaW5nIHwgbnVsbDtcclxuICAgIGl0ZW06IFRJdGVtO1xyXG4gICAgZGF0YTogVEl0ZW1bXCJzeXN0ZW1cIl07XHJcbiAgICBpc1BoeXNpY2FsOiBib29sZWFuO1xyXG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcclxuICAgIC8vIHN5c3RlbTogVmVyZXRlbm9JdGVtU3lzdGVtRGF0YTtcclxufVxyXG5cclxuaW50ZXJmYWNlIEl0ZW1TaGVldE9wdGlvbnMgZXh0ZW5kcyBEb2N1bWVudFNoZWV0T3B0aW9ucyB7XHJcbiAgICBoYXNTaWRlYmFyOiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0l0ZW1TaGVldCB9O1xyXG5leHBvcnQgdHlwZSB7IFZlcmV0ZW5vSXRlbVNoZWV0RGF0YSwgSXRlbVNoZWV0T3B0aW9ucyB9OyIsICJpbXBvcnQgeyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIuLi9pbmRleFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW1TaGVldCwgVmVyZXRlbm9JdGVtU2hlZXREYXRhIH0gZnJvbSBcIi4uL2Jhc2Uvc2hlZXRcIjtcclxuXHJcbmNsYXNzIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldDxUSXRlbSBleHRlbmRzIFBoeXNpY2FsVmVyZXRlbm9JdGVtPiBleHRlbmRzIFZlcmV0ZW5vSXRlbVNoZWV0PFRJdGVtPiB7XHJcbiAgICBvdmVycmlkZSBhc3luYyBnZXREYXRhKG9wdGlvbnM/OiBQYXJ0aWFsPERvY3VtZW50U2hlZXRPcHRpb25zPik6IFByb21pc2U8UGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YTxUSXRlbT4+IHtcclxuICAgICAgICBjb25zdCBzaGVldERhdGEgPSBhd2FpdCBzdXBlci5nZXREYXRhKG9wdGlvbnMpO1xyXG4gICAgICAgIGNvbnN0IHsgaXRlbSB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgLi4uc2hlZXREYXRhLFxyXG4gICAgICAgICAgICBpc1BoeXNpY2FsOiB0cnVlLFxyXG4gICAgICAgICAgICB3ZWlnaHQ6IGl0ZW0ud2VpZ2h0LFxyXG4gICAgICAgICAgICBwcmljZTogaXRlbS5wcmljZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGE8VEl0ZW0gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbT4gZXh0ZW5kcyBWZXJldGVub0l0ZW1TaGVldERhdGE8VEl0ZW0+IHtcclxuICAgIGlzUGh5c2ljYWw6IHRydWU7XHJcbiAgICB3ZWlnaHQ6IG51bWJlcjtcclxuICAgIHByaWNlOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldCB9O1xyXG5leHBvcnQgdHlwZSB7IFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGEgfTsiLCAiaW1wb3J0IHsgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0LCBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXREYXRhIH0gZnJvbSBcIi4uL3BoeXNpY2FsLWl0ZW0vc2hlZXRcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9Bcm1vciB9IGZyb20gXCIuL2RvY3VtZW50XCI7XHJcblxyXG5jbGFzcyBWZXJldGVub0FybW9yU2hlZXQgZXh0ZW5kcyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQ8VmVyZXRlbm9Bcm1vcj4ge1xyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zPzogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4pOiBQcm9taXNlPFZlcmV0ZW5vQXJtb3JTaGVldERhdGE+IHtcclxuICAgICAgICBjb25zdCBzaGVldERhdGEgPSBhd2FpdCBzdXBlci5nZXREYXRhKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW0gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogVmVyZXRlbm9Bcm1vclNoZWV0RGF0YSA9IHtcclxuICAgICAgICAgICAgLi4uc2hlZXREYXRhLFxyXG4gICAgICAgICAgICBhcm1vckNsYXNzOiBpdGVtLmFybW9yQ2xhc3MsXHJcbiAgICAgICAgICAgIHF1YWxpdHk6IGl0ZW0ucXVhbGl0eSxcclxuICAgICAgICAgICAgZHVyYWJpbGl0eTogaXRlbS5kdXJhYmlsaXR5LFxyXG4gICAgICAgICAgICBtYXhEdXJhYmlsaXR5OiBpdGVtLm1heER1YXJhYmlsaXR5LFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRlbXBsYXRlKCkge1xyXG4gICAgICAgIHJldHVybiBgc3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL2l0ZW1zL2FybW9yLXNoZWV0Lmhic2A7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0FybW9yU2hlZXREYXRhIGV4dGVuZHMgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YTxWZXJldGVub0FybW9yPiB7XHJcbiAgICBhcm1vckNsYXNzOiBudW1iZXI7XHJcbiAgICBxdWFsaXR5OiBudW1iZXI7XHJcbiAgICBkdXJhYmlsaXR5OiBudW1iZXI7XHJcbiAgICBtYXhEdXJhYmlsaXR5OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQXJtb3JTaGVldCB9O1xyXG5leHBvcnQgdHlwZSB7IFZlcmV0ZW5vQXJtb3JTaGVldERhdGEgfTsiLCAiaW1wb3J0IHsgVmVyZXRlbm9BY3RvclNvdXJjZSwgVmVyZXRlbm9BY3RvclN5c3RlbURhdGEgfSBmcm9tIFwiLi9kYXRhXCI7XHJcblxyXG5jbGFzcyBWZXJldGVub0FjdG9yPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIEFjdG9yPFRQYXJlbnQ+e1xyXG4gICAgZ2V0IERlc2NyaXB0aW9uKCk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnN5c3RlbS5kZXNjcmlwdGlvbiB8fCAnJykudHJpbSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9BY3RvcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBBY3RvcjxUUGFyZW50PiB7XHJcbiAgICBjb25zdHJ1Y3RvcjogdHlwZW9mIFZlcmV0ZW5vQWN0b3I7XHJcbiAgICBzeXN0ZW06IFZlcmV0ZW5vQWN0b3JTeXN0ZW1EYXRhO1xyXG5cclxuICAgIERlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IFZlcmV0ZW5vQWN0b3JQcm94eSA9IG5ldyBQcm94eShWZXJldGVub0FjdG9yLCB7XHJcbiAgICBjb25zdHJ1Y3QoXHJcbiAgICAgICAgX3RhcmdldCxcclxuICAgICAgICBhcmdzOiBbc291cmNlOiBQcmVDcmVhdGU8VmVyZXRlbm9BY3RvclNvdXJjZT4sIGNvbnRleHQ/OiBEb2N1bWVudENvbnN0cnVjdGlvbkNvbnRleHQ8VmVyZXRlbm9BY3RvcltcInBhcmVudFwiXT5dLFxyXG4gICAgKSB7XHJcbiAgICAgICAgY29uc3Qgc291cmNlID0gYXJnc1swXTtcclxuICAgICAgICBjb25zdCB0eXBlID0gc291cmNlPy50eXBlO1xyXG4gICAgICAgIHJldHVybiBuZXcgQ09ORklHLlZFUkVURU5PLkFjdG9yLmRvY3VtZW50Q2xhc3Nlc1t0eXBlXSguLi5hcmdzKTtcclxuICAgIH0sXHJcbn0pO1xyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9BY3RvciwgVmVyZXRlbm9BY3RvclByb3h5IH07IiwgImludGVyZmFjZSBJZExhYmVsVHlwZTxUPiB7XHJcbiAgICBpZDogbnVtYmVyO1xyXG4gICAgbGFiZWw6IHN0cmluZztcclxuICAgIHR5cGU6IFQ7XHJcbn1cclxuXHJcbmNsYXNzIFZlcmV0ZW5vUm9sbE9wdGlvbnMge1xyXG4gICAgdHlwZTogVmVyZXRlbm9Sb2xsVHlwZSA9IFZlcmV0ZW5vUm9sbFR5cGUuUmVndWxhcjtcclxuICAgIG1lc3NhZ2VEYXRhOiBWZXJldGVub01lc3NhZ2VEYXRhID0gbmV3IFZlcmV0ZW5vTWVzc2FnZURhdGEoKTtcclxuICAgIHJvbGxEYXRhOiBWZXJldGVub1JvbGxEYXRhID0gbmV3IFZlcmV0ZW5vUm9sbERhdGEoKTtcclxufVxyXG5lbnVtIFZlcmV0ZW5vUm9sbFR5cGUge1xyXG4gICAgTm9uZSA9ICdub25lJyxcclxuICAgIFJlZ3VsYXIgPSAncmVndWxhcicsXHJcbiAgICBBcm1vckJsb2NrID0gJ2FybW9yLWJsb2NrJyxcclxuICAgIEF0dGFjayA9ICdhdHRhY2snLFxyXG4gICAgSW5pdGlhdGl2ZSA9ICdpbml0aWF0aXZlJyxcclxuICAgIERlc3BlcmF0aW9uID0gJ2Rlc3BlcmF0aW9uJ1xyXG59XHJcblxyXG5jbGFzcyBWZXJldGVub01lc3NhZ2VEYXRhIGltcGxlbWVudHMgUm9sbE9wdGlvbnMge1xyXG4gICAgW2luZGV4OiBzdHJpbmddOiBhbnk7XHJcbiAgICB1c2VySWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcclxuICAgIHNwZWFrZXI6IGFueSA9IHt9O1xyXG4gICAgZmxhdm9yOiBzdHJpbmcgPSAnJztcclxuICAgIHNvdW5kOiBhbnkgfCBudWxsID0gbnVsbDtcclxufVxyXG5cclxuY2xhc3MgVmVyZXRlbm9Sb2xsRGF0YSB7XHJcbiAgICBkaWNlOiBzdHJpbmcgPSAnZDIwJztcclxuICAgIHBvb2w6IG51bWJlciA9IDE7XHJcbiAgICBib251czogbnVtYmVyID0gMDtcclxuICAgIGlzU2VyaWFsOiBib29sZWFuID0gZmFsc2U7XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub1JvbGxEYXRhIHtcclxuICAgIGRpY2U6IHN0cmluZztcclxuICAgIHBvb2w6IG51bWJlcjtcclxuICAgIGJvbnVzOiBudW1iZXI7XHJcbiAgICBpc1NlcmlhbDogYm9vbGVhbjtcclxufVxyXG5cclxuY2xhc3MgVmVyZXRlbm9DaGF0T3B0aW9ucyB7XHJcbiAgICBpc0JsaW5kOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBzaG93RGlhbG9nOiBib29sZWFuID0gZmFsc2U7XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0NoYXRPcHRpb25zIHtcclxuICAgIGlzQmxpbmQ6IGJvb2xlYW47XHJcbiAgICBzaG93RGlhbG9nOiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSB7IElkTGFiZWxUeXBlIH1cclxuZXhwb3J0IHR5cGUgeyBWZXJldGVub1JvbGxPcHRpb25zLCBWZXJldGVub01lc3NhZ2VEYXRhIH1cclxuZXhwb3J0IHsgVmVyZXRlbm9Sb2xsVHlwZSwgVmVyZXRlbm9Sb2xsRGF0YSwgVmVyZXRlbm9DaGF0T3B0aW9ucyB9IiwgImltcG9ydCB7IFNraWxsVHlwZSB9IGZyb20gXCIkY29tbW9uXCI7XHJcbmltcG9ydCB7IEJhc2VQaHlzaWNhbEl0ZW1Tb3VyY2UsIFBoeXNpY2FsU3lzdGVtU291cmNlLCBQaHlzaWNhbFZlcmV0ZW5vSXRlbVN5c3RlbURhdGEgfSBmcm9tIFwiLi4vcGh5c2ljYWwtaXRlbS9kYXRhXCI7XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9XZWFwb25TeXN0ZW1EYXRhIGV4dGVuZHMgUGh5c2ljYWxWZXJldGVub0l0ZW1TeXN0ZW1EYXRhIHtcclxuICAgIG1vZGlmaWVyOiBudW1iZXI7XHJcbiAgICBkYW1hZ2U6IG51bWJlcjtcclxuICAgIGluaXRpYXRpdmU6IG51bWJlcjtcclxuICAgIGNyaXQ6IG51bWJlcjtcclxuICAgIHdlYXBvblR5cGU6IFdlYXBvblR5cGUsXHJcbiAgICBhdHRhY2tXaXRoOiBTa2lsbFR5cGUsXHJcbiAgICByYW5nZTogUmFuZ2VUeXBlLFxyXG4gICAgaGFzQnVyc3Q6IGJvb2xlYW5cclxufVxyXG5cclxudHlwZSBXZWFwb25Tb3VyY2UgPSBCYXNlUGh5c2ljYWxJdGVtU291cmNlPFwid2VhcG9uXCIsIFdlYXBvblN5c3RlbVNvdXJjZT47XHJcblxyXG5pbnRlcmZhY2UgV2VhcG9uU3lzdGVtU291cmNlIGV4dGVuZHMgUGh5c2ljYWxTeXN0ZW1Tb3VyY2Uge1xyXG4gICAgbW9kaWZpZXI6IG51bWJlcjtcclxuICAgIGRhbWFnZTogbnVtYmVyO1xyXG4gICAgaW5pdGlhdGl2ZTogbnVtYmVyO1xyXG4gICAgY3JpdDogbnVtYmVyO1xyXG4gICAgd2VhcG9uVHlwZTogV2VhcG9uVHlwZSxcclxuICAgIGF0dGFja1dpdGg6IFNraWxsVHlwZSxcclxuICAgIHJhbmdlOiBSYW5nZVR5cGUsXHJcbiAgICBoYXNCdXJzdDogYm9vbGVhblxyXG59XHJcblxyXG5lbnVtIFdlYXBvblR5cGUge1xyXG4gICAgTm9uZSA9IFwibm9uZVwiLFxyXG4gICAgQnJhd2xpbmcgPSBcImJyYXdsaW5nXCIsXHJcbiAgICBNZWxlZSA9IFwibWVsZWVcIixcclxuICAgIFJhbmdlZCA9IFwicmFuZ2VkXCJcclxufVxyXG5cclxuZW51bSBSYW5nZVR5cGUge1xyXG4gICAgTm9uZSA9IFwibm9uZVwiLFxyXG4gICAgUG9pbnRCbGFuayA9IFwicG9pbnRCbGFua1wiLFxyXG4gICAgQ2xvc2UgPSBcImNsb3NlXCIsXHJcbiAgICBNZWRpdW0gPSBcIm1lZGl1bVwiLFxyXG4gICAgTG9uZyA9IFwibG9uZ1wiLFxyXG4gICAgVXRtb3N0ID0gXCJ1dG1vc3RcIlxyXG59XHJcblxyXG5lbnVtIEF0dGFja1R5cGUge1xyXG4gICAgTm9uZSA9IFwibm9uZVwiLFxyXG4gICAgUmVndWxhciA9IFwicmVndWxhclwiLFxyXG4gICAgUG93ZXIgPSBcInBvd2VyXCIsXHJcbiAgICBMaWdodCA9IFwibGlnaHRcIixcclxuICAgIEFpbWVkID0gXCJhaW1lZFwiLFxyXG4gICAgSGlwID0gXCJoaXBcIixcclxuICAgIEJ1cnN0ID0gXCJidXJzdFwiXHJcbn1cclxuXHJcbmV4cG9ydCB7IFdlYXBvblR5cGUsIFJhbmdlVHlwZSwgQXR0YWNrVHlwZSB9XHJcbmV4cG9ydCB7IFZlcmV0ZW5vV2VhcG9uU3lzdGVtRGF0YSwgV2VhcG9uU291cmNlIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9Sb2xsRGF0YSB9IGZyb20gXCIkbW9kdWxlL2RhdGFcIjtcclxuaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0sIFZlcmV0ZW5vQXJtb3IsIFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIkbW9kdWxlL2l0ZW1cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtVHlwZSB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vYmFzZS9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vRXF1aXBtZW50IH0gZnJvbSBcIiRtb2R1bGUvaXRlbS9lcXVpcG1lbnQvZG9jdW1lbnRcIjtcclxuaW1wb3J0IHsgQXR0YWNrVHlwZSwgV2VhcG9uVHlwZSB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vd2VhcG9uL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9XZWFwb24gfSBmcm9tIFwiJG1vZHVsZS9pdGVtL3dlYXBvbi9kb2N1bWVudFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcbmltcG9ydCB7IEF0dHJpYnV0ZXNCbG9jaywgU2tpbGxzQmxvY2ssIFN0YXRzQmxvY2ssIFZlcmV0ZW5vQ3JlYXR1cmVTeXN0ZW1EYXRhLCBXZWFwb25BdHRhY2tJbmZvIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9DcmVhdHVyZTxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0FjdG9yPFRQYXJlbnQ+e1xyXG4gICAgZ2V0IFN0YXRzKCk6IFN0YXRzQmxvY2sge1xyXG4gICAgICAgIGNvbnN0IGhwID0gdGhpcy5zeXN0ZW0uc3RhdHMuaGl0UG9pbnRzLnZhbHVlO1xyXG4gICAgICAgIGlmIChocCA+IHRoaXMuTWF4SHApIHtcclxuICAgICAgICAgICAgdGhpcy5zeXN0ZW0uc3RhdHMuaGl0UG9pbnRzLnZhbHVlID0gdGhpcy5NYXhIcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHdwID0gdGhpcy5zeXN0ZW0uc3RhdHMud2lsbFBvaW50cy52YWx1ZTtcclxuICAgICAgICBpZiAod3AgPiB0aGlzLk1heFdwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3lzdGVtLnN0YXRzLndpbGxQb2ludHMudmFsdWUgPSB0aGlzLk1heFdwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLnN0YXRzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBBdHRyaWJ1dGVzKCk6IEF0dHJpYnV0ZXNCbG9jayB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmF0dHJpYnV0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IFNraWxscygpOiBTa2lsbHNCbG9jayB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLnNraWxscztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgTWF4SHAoKTogbnVtYmVyIHtcclxuICAgICAgICBjb25zdCBjb25zdGl0dXRpb25WYWx1ZSA9IHRoaXMuQXR0cmlidXRlcy5jb25zdGl0dXRpb24udmFsdWU7XHJcbiAgICAgICAgY29uc3QgZGV4dGVyaXR5VmFsdWUgPSB0aGlzLkF0dHJpYnV0ZXMuZGV4dGVyaXR5LnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IGJvbnVzZXMgPSAwO1xyXG5cclxuICAgICAgICByZXR1cm4gY29uc3RpdHV0aW9uVmFsdWUgKyBkZXh0ZXJpdHlWYWx1ZSArIGJvbnVzZXM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IE1heFdwKCk6IG51bWJlciB7XHJcbiAgICAgICAgY29uc3QgaW50ZWxsaWdlbmNlVmFsdWUgPSB0aGlzLkF0dHJpYnV0ZXMuaW50ZWxsaWdlbmNlLnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IGVtcGF0aHlWYWx1ZSA9IHRoaXMuQXR0cmlidXRlcy5lbXBhdGh5LnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IGJvbnVzZXMgPSAwO1xyXG5cclxuICAgICAgICByZXR1cm4gaW50ZWxsaWdlbmNlVmFsdWUgKyBlbXBhdGh5VmFsdWUgKyBib251c2VzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHUwNDE4XHUwNDNDXHUwNDM1XHUwNDRFXHUwNDQ5XHUwNDM1XHUwNDM1XHUwNDQxXHUwNDRGIFx1MDQzRVx1MDQ0MFx1MDQ0M1x1MDQzNlx1MDQzOFx1MDQzNS5cclxuICAgICAqL1xyXG4gICAgZ2V0IFdlYXBvbnMoKTogVmVyZXRlbm9XZWFwb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXMubWFwKHggPT4geCBhcyB1bmtub3duIGFzIFZlcmV0ZW5vSXRlbSkuZmlsdGVyKHggPT4geC50eXBlID09IFZlcmV0ZW5vSXRlbVR5cGUuV2VhcG9uKS5tYXAoeCA9PiB4IGFzIFZlcmV0ZW5vV2VhcG9uKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFx1MDQyRFx1MDQzQVx1MDQzOFx1MDQzRlx1MDQzOFx1MDQ0MFx1MDQzRVx1MDQzMlx1MDQzMFx1MDQzRFx1MDQzRFx1MDQzRVx1MDQzNSBcdTA0M0VcdTA0NDBcdTA0NDNcdTA0MzZcdTA0MzhcdTA0MzUuXHJcbiAgICAgKi9cclxuICAgIGdldCBFcXVpcHBlZFdlYXBvbnMoKTogVmVyZXRlbm9XZWFwb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuV2VhcG9ucy5maWx0ZXIoeCA9PiB4LnN5c3RlbS5pc0VxdWlwcGVkKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFx1MDQxOFx1MDQzQ1x1MDQzNVx1MDQ0RVx1MDQ0OVx1MDQzMFx1MDQ0Rlx1MDQ0MVx1MDQ0RiBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0NEYuXHJcbiAgICAgKi9cclxuICAgIGdldCBBcm1vcnMoKTogVmVyZXRlbm9Bcm1vcltdIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pdGVtcy5tYXAoeCA9PiB4IGFzIHVua25vd24gYXMgVmVyZXRlbm9JdGVtKS5maWx0ZXIoeCA9PiB4LnR5cGUgPT0gVmVyZXRlbm9JdGVtVHlwZS5Bcm1vcikubWFwKHggPT4geCBhcyBWZXJldGVub0FybW9yKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFx1MDQyRFx1MDQzQVx1MDQzOFx1MDQzRlx1MDQzOFx1MDQ0MFx1MDQzRVx1MDQzMlx1MDQzMFx1MDQzRFx1MDQzRFx1MDQzMFx1MDQ0RiBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0NEYuXHJcbiAgICAgKi9cclxuICAgIGdldCBFcXVpcHBlZEFybW9yKCk6IFZlcmV0ZW5vQXJtb3Ige1xyXG4gICAgICAgIHJldHVybiB0aGlzLkFybW9ycy5maWx0ZXIoeCA9PiB4LnN5c3RlbS5pc0VxdWlwcGVkKVswXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBJdGVtcygpOiBWZXJldGVub0VxdWlwbWVudFtdIHtcclxuICAgICAgICBsZXQgaXRlbXMgPSB0aGlzLml0ZW1zLm1hcCh4ID0+IHggYXMgdW5rbm93biBhcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSk7XHJcblxyXG4gICAgICAgIGl0ZW1zID0gaXRlbXNcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICF0aGlzLkFybW9ycy5maW5kKGEgPT4gYS5pZCA9PSB4LmlkKSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICF0aGlzLldlYXBvbnMuZmluZCh3ID0+IHcuaWQgPT0geC5pZCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gaXRlbXM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IEVxdWlwcGVkSXRlbXMoKTogVmVyZXRlbm9FcXVpcG1lbnRbXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuSXRlbXMuZmlsdGVyKHggPT4geC5zeXN0ZW0uaXNFcXVpcHBlZCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2V0QXR0cmlidXRlUm9sbERhdGEoa2V5OiBzdHJpbmcpOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERhdGE+IHtcclxuICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSB0aGlzLkF0dHJpYnV0ZXNba2V5XTtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGF0YSgpO1xyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGUudmFsdWU7XHJcbiAgICAgICAgY29uc3QgYm9udXNlcyA9IDA7XHJcbiAgICAgICAgcmVzdWx0LnBvb2wgPSB2YWx1ZSArIGJvbnVzZXM7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2V0U2tpbGxSb2xsRGF0YShrZXk6IHN0cmluZyk6IFByb21pc2U8VmVyZXRlbm9Sb2xsRGF0YT4ge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNraWxsID0gdGhpcy5Ta2lsbHNba2V5XTtcclxuICAgICAgICBpZiAoc2tpbGwgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgYXR0cmlidXRlUm9sbERhdGEgPSBhd2FpdCB0aGlzLmdldEF0dHJpYnV0ZVJvbGxEYXRhKHNraWxsLmF0dHJpYnV0ZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gc2tpbGwudmFsdWU7XHJcbiAgICAgICAgY29uc3QgYm9udXNlcyA9IDA7XHJcbiAgICAgICAgcmVzdWx0LnBvb2wgPSBhdHRyaWJ1dGVSb2xsRGF0YS5wb29sICsgdmFsdWUgKyBib251c2VzO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGdldFdlYXBvblJvbGxEYXRhKHdlYXBvbkRhdGE6IFdlYXBvbkF0dGFja0luZm8pOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERhdGE+IHtcclxuICAgICAgICBsZXQgaXRlbSA9IHRoaXMuaXRlbXMuZ2V0KHdlYXBvbkRhdGEuaWQpIGFzIHVua25vd24gYXMgVmVyZXRlbm9XZWFwb247XHJcblxyXG4gICAgICAgIGxldCBpdGVtU2tpbGwgPSBpdGVtLnN5c3RlbS5hdHRhY2tXaXRoO1xyXG4gICAgICAgIGxldCBza2lsbFJvbGxEYXRhID0gYXdhaXQgdGhpcy5nZXRTa2lsbFJvbGxEYXRhKGl0ZW1Ta2lsbCk7XHJcblxyXG4gICAgICAgIGxldCB3ZWFwb25BdHRhY2tUeXBlTW9kaWZpZXIgPSB0aGlzLmdldFdlYXBvbkF0dGFja1R5cGVNb2RpZmllcih3ZWFwb25EYXRhKTtcclxuXHJcbiAgICAgICAgbGV0IHdlYXBvbkF0dGFja01vZGlmaWVyID0gaXRlbS5zeXN0ZW0ubW9kaWZpZXI7XHJcblxyXG4gICAgICAgIGxldCB3ZWFwb25EYW1hZ2UgPSBpdGVtLnN5c3RlbS5kYW1hZ2U7XHJcblxyXG4gICAgICAgIGNvbnN0IHJvbGxEYXRhOiBWZXJldGVub1JvbGxEYXRhID0gbWVyZ2VPYmplY3Qoc2tpbGxSb2xsRGF0YSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcG9vbDogc2tpbGxSb2xsRGF0YS5wb29sICsgd2VhcG9uQXR0YWNrVHlwZU1vZGlmaWVyICsgd2VhcG9uQXR0YWNrTW9kaWZpZXIsXHJcbiAgICAgICAgICAgICAgICB3ZWFwb25EYW1hZ2UsXHJcbiAgICAgICAgICAgICAgICB3ZWFwb25BdHRhY2tNb2RpZmllclxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHdlYXBvbkRhdGEuYXR0YWNrVHlwZSA9PSBBdHRhY2tUeXBlLkJ1cnN0KSB7XHJcbiAgICAgICAgICAgIHJvbGxEYXRhLmlzU2VyaWFsID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByb2xsRGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRXZWFwb25BdHRhY2tUeXBlTW9kaWZpZXIod2VhcG9uRGF0YTogV2VhcG9uQXR0YWNrSW5mbyk6IG51bWJlciB7XHJcbiAgICAgICAgaWYgKHdlYXBvbkRhdGEud2VhcG9uVHlwZSA9PSBXZWFwb25UeXBlLk1lbGVlIHx8IHdlYXBvbkRhdGEud2VhcG9uVHlwZSA9PSBXZWFwb25UeXBlLkJyYXdsaW5nKSB7XHJcbiAgICAgICAgICAgIGlmICh3ZWFwb25EYXRhLmF0dGFja1R5cGUgPT0gQXR0YWNrVHlwZS5Qb3dlcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh3ZWFwb25EYXRhLmF0dGFja1R5cGUgPT0gQXR0YWNrVHlwZS5MaWdodCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0yO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh3ZWFwb25EYXRhLndlYXBvblR5cGUgPT0gV2VhcG9uVHlwZS5SYW5nZWQpIHtcclxuICAgICAgICAgICAgaWYgKHdlYXBvbkRhdGEuYXR0YWNrVHlwZSA9PSBBdHRhY2tUeXBlLkFpbWVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHdlYXBvbkRhdGEuYXR0YWNrVHlwZSA9PSBBdHRhY2tUeXBlLkhpcCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0yO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAod2VhcG9uRGF0YS5hdHRhY2tUeXBlID09IEF0dGFja1R5cGUuQnVyc3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBnZXRBcm1vclJvbGxEYXRhKGl0ZW1JZDogc3RyaW5nKTogUHJvbWlzZTxWZXJldGVub1JvbGxEYXRhIHwgbnVsbD4ge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcbiAgICAgICAgbGV0IGl0ZW0gPSAodGhpcy5pdGVtcy5nZXQoaXRlbUlkKSBhcyB1bmtub3duIGFzIFZlcmV0ZW5vQXJtb3IpO1xyXG5cclxuICAgICAgICBpZiAoIWl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXN1bHQucG9vbCA9IGl0ZW0uc3lzdGVtLmR1cmFiaWxpdHlcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBnZXRJbml0aWF0aXZlUm9sbERhdGEoaXRlbUlkOiBzdHJpbmcpOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERhdGE+IHtcclxuICAgICAgICBsZXQgaXRlbSA9ICh0aGlzLml0ZW1zLmdldChpdGVtSWQpIGFzIHVua25vd24gYXMgVmVyZXRlbm9XZWFwb24pO1xyXG5cclxuICAgICAgICBsZXQgc2tpbGwgPSB0aGlzLlNraWxscy5hZ2lsaXR5O1xyXG5cclxuICAgICAgICBsZXQgYm9udXNlcyA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcbiAgICAgICAgcmVzdWx0LnBvb2wgPSAxO1xyXG4gICAgICAgIHJlc3VsdC5ib251cyA9IHNraWxsLnZhbHVlICsgaXRlbS5zeXN0ZW0ubW9kaWZpZXIgKyBib251c2VzO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGVxdWlwV2VhcG9uKCkgeyB9XHJcblxyXG4gICAgYXN5bmMgZXF1aXBBcm1vcigpIHsgfVxyXG5cclxuICAgIGFzeW5jIHVuZXF1aXBJdGVtKCkgeyB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQWN0b3I8VFBhcmVudD4ge1xyXG4gICAgc3lzdGVtOiBWZXJldGVub0NyZWF0dXJlU3lzdGVtRGF0YSxcclxuICAgIFN0YXRzOiBTdGF0c0Jsb2NrO1xyXG4gICAgQXR0cmlidXRlczogQXR0cmlidXRlc0Jsb2NrO1xyXG4gICAgU2tpbGxzOiBTa2lsbHNCbG9jaztcclxuICAgIE1heEhwOiBudW1iZXI7XHJcbiAgICBNYXhXcDogbnVtYmVyO1xyXG4gICAgV2VhcG9uczogVmVyZXRlbm9XZWFwb25bXTtcclxuICAgIEFybW9yczogVmVyZXRlbm9Bcm1vcltdO1xyXG4gICAgSXRlbXM6IFZlcmV0ZW5vRXF1aXBtZW50W107XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmUgfSIsICJpbXBvcnQgeyBWZXJldGVub0NyZWF0dXJlIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ2hhcmFjdGVyU3lzdGVtRGF0YSB9IGZyb20gXCIuL2RhdGFcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vQ2hhcmFjdGVyPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudD57XHJcbiAgICBnZXQgTW9uZXkoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ubW9uZXkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgUmVwdXRhdGlvbigpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5yZXB1dGF0aW9uIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IEV4cCgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5leHAgfHwgMDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQ2hhcmFjdGVyPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudD4ge1xyXG4gICAgc3lzdGVtOiBWZXJldGVub0NoYXJhY3RlclN5c3RlbURhdGE7XHJcblxyXG4gICAgTW9uZXk6IG51bWJlcjtcclxuICAgIFJlcHV0YXRpb246IG51bWJlcjtcclxuICAgIEV4cDogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0NoYXJhY3RlciB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmUgfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vTW9uc3RlcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQ+e1xyXG5cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vTW9uc3RlcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQ+IHtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vTW9uc3RlciB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmUgfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vTnBjPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudD57XHJcblxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9OcGM8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZTxUUGFyZW50PiB7XHJcblxyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub05wYyB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3IgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW1Tb3VyY2UsIFZlcmV0ZW5vSXRlbVN5c3RlbURhdGEgfSBmcm9tIFwiLi9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vSXRlbVNoZWV0IH0gZnJvbSBcIi4vc2hlZXRcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vSXRlbTxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBJdGVtPFRQYXJlbnQ+e1xyXG4gICAgZ2V0IGRhdGEoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucHJlcGFyZURhdGEoKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgRGVzY3JpcHRpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnN5c3RlbS5kZXNjcmlwdGlvbiB8fCAnJykudHJpbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBLZWVwIGBUZXh0RWRpdG9yYCBhbmQgYW55dGhpbmcgZWxzZSB1cCB0byBubyBnb29kIGZyb20gc2V0dGluZyB0aGlzIGl0ZW0ncyBkZXNjcmlwdGlvbiB0byBgbnVsbGAgKi9cclxuICAgIHByb3RlY3RlZCBvdmVycmlkZSBhc3luYyBfcHJlVXBkYXRlKFxyXG4gICAgICAgIGNoYW5nZWQ6IERlZXBQYXJ0aWFsPHRoaXNbXCJfc291cmNlXCJdPixcclxuICAgICAgICBvcHRpb25zOiBEb2N1bWVudFVwZGF0ZUNvbnRleHQ8VFBhcmVudD4sXHJcbiAgICAgICAgdXNlcjogVXNlcixcclxuICAgICk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcclxuICAgICAgICByZXR1cm4gc3VwZXIuX3ByZVVwZGF0ZShjaGFuZ2VkLCBvcHRpb25zLCB1c2VyKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqIFJlZnJlc2ggdGhlIEl0ZW0gRGlyZWN0b3J5IGlmIHRoaXMgaXRlbSBpc24ndCBlbWJlZGRlZCAqL1xyXG4gICAgcHJvdGVjdGVkIG92ZXJyaWRlIF9vblVwZGF0ZShcclxuICAgICAgICBkYXRhOiBEZWVwUGFydGlhbDx0aGlzW1wiX3NvdXJjZVwiXT4sXHJcbiAgICAgICAgb3B0aW9uczogRG9jdW1lbnRNb2RpZmljYXRpb25Db250ZXh0PFRQYXJlbnQ+LFxyXG4gICAgICAgIHVzZXJJZDogc3RyaW5nLFxyXG4gICAgKTogdm9pZCB7XHJcbiAgICAgICAgc3VwZXIuX29uVXBkYXRlKGRhdGEsIG9wdGlvbnMsIHVzZXJJZCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0l0ZW08VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgSXRlbTxUUGFyZW50PiB7XHJcbiAgICBjb25zdHJ1Y3RvcjogdHlwZW9mIFZlcmV0ZW5vSXRlbTtcclxuICAgIHN5c3RlbTogVmVyZXRlbm9JdGVtU3lzdGVtRGF0YTtcclxuXHJcbiAgICBEZXNjcmlwdGlvbjogc3RyaW5nO1xyXG5cclxuICAgIF9zaGVldDogVmVyZXRlbm9JdGVtU2hlZXQ8dGhpcz4gfCBudWxsO1xyXG5cclxuICAgIGdldCBzaGVldCgpOiBWZXJldGVub0l0ZW1TaGVldDx0aGlzPjtcclxuXHJcbiAgICBwcmVwYXJlU2libGluZ0RhdGE/KHRoaXM6IFZlcmV0ZW5vSXRlbTxWZXJldGVub0FjdG9yPik6IHZvaWQ7XHJcbiAgICBwcmVwYXJlQWN0b3JEYXRhPyh0aGlzOiBWZXJldGVub0l0ZW08VmVyZXRlbm9BY3Rvcj4pOiB2b2lkO1xyXG4gICAgLyoqIE9wdGlvbmFsIGRhdGEtcHJlcGFyYXRpb24gY2FsbGJhY2sgZXhlY3V0ZWQgYWZ0ZXIgcnVsZS1lbGVtZW50IHN5bnRoZXRpY3MgYXJlIHByZXBhcmVkICovXHJcbiAgICBvblByZXBhcmVTeW50aGV0aWNzPyh0aGlzOiBWZXJldGVub0l0ZW08VmVyZXRlbm9BY3Rvcj4pOiB2b2lkO1xyXG5cclxuICAgIC8qKiBSZXR1cm5zIGl0ZW1zIHRoYXQgc2hvdWxkIGFsc28gYmUgYWRkZWQgd2hlbiB0aGlzIGl0ZW0gaXMgY3JlYXRlZCAqL1xyXG4gICAgY3JlYXRlR3JhbnRlZEl0ZW1zPyhvcHRpb25zPzogb2JqZWN0KTogUHJvbWlzZTxWZXJldGVub0l0ZW1bXT47XHJcblxyXG4gICAgLyoqIFJldHVybnMgaXRlbXMgdGhhdCBzaG91bGQgYWxzbyBiZSBkZWxldGVkIHNob3VsZCB0aGlzIGl0ZW0gYmUgZGVsZXRlZCAqL1xyXG4gICAgZ2V0TGlua2VkSXRlbXM/KCk6IFZlcmV0ZW5vSXRlbTxWZXJldGVub0FjdG9yPltdO1xyXG59XHJcblxyXG5jb25zdCBWZXJldGVub0l0ZW1Qcm94eSA9IG5ldyBQcm94eShWZXJldGVub0l0ZW0sIHtcclxuICAgIGNvbnN0cnVjdChcclxuICAgICAgICBfdGFyZ2V0LFxyXG4gICAgICAgIGFyZ3M6IFtzb3VyY2U6IFByZUNyZWF0ZTxWZXJldGVub0l0ZW1Tb3VyY2U+LCBjb250ZXh0PzogRG9jdW1lbnRDb25zdHJ1Y3Rpb25Db250ZXh0PFZlcmV0ZW5vQWN0b3IgfCBudWxsPl0sXHJcbiAgICApIHtcclxuICAgICAgICBjb25zdCBzb3VyY2UgPSBhcmdzWzBdO1xyXG4gICAgICAgIGNvbnN0IHR5cGUgPSBzb3VyY2U/LnR5cGU7XHJcbiAgICAgICAgY29uc3QgSXRlbUNsYXNzOiB0eXBlb2YgVmVyZXRlbm9JdGVtID0gQ09ORklHLlZFUkVURU5PLkl0ZW0uZG9jdW1lbnRDbGFzc2VzW3R5cGVdID8/IFZlcmV0ZW5vSXRlbTtcclxuICAgICAgICByZXR1cm4gbmV3IEl0ZW1DbGFzcyguLi5hcmdzKTtcclxuICAgIH0sXHJcbn0pO1xyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9JdGVtLCBWZXJldGVub0l0ZW1Qcm94eSB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3IgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW1TeXN0ZW1EYXRhIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgUGh5c2ljYWxWZXJldGVub0l0ZW08VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9JdGVtPFRQYXJlbnQ+IHtcclxuICAgIGdldCB3ZWlnaHQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLndlaWdodCB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBwcmljZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ucHJpY2UgfHwgMDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFBoeXNpY2FsVmVyZXRlbm9JdGVtPFRQYXJlbnQgZXh0ZW5kcyBWZXJldGVub0FjdG9yIHwgbnVsbCA9IFZlcmV0ZW5vQWN0b3IgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBzeXN0ZW06IFBoeXNpY2FsVmVyZXRlbm9JdGVtU3lzdGVtRGF0YTtcclxufVxyXG5cclxuZXhwb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0gfTsiLCAiaW1wb3J0IHsgVmVyZXRlbm9BY3RvciB9IGZyb20gXCIkbW9kdWxlL2FjdG9yXCI7XHJcbmltcG9ydCB7IFBoeXNpY2FsVmVyZXRlbm9JdGVtIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQXJtb3JTeXN0ZW1EYXRhIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9Bcm1vcjxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBnZXQgYXJtb3JDbGFzcygpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5hcm1vckNsYXNzIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHF1YWxpdHkoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ucXVhbGl0eSB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBtYXhEdWFyYWJpbGl0eSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFybW9yQ2xhc3MgKyB0aGlzLnF1YWxpdHk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGR1cmFiaWxpdHkoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uZHVyYWJpbGl0eSB8fCB0aGlzLm1heER1YXJhYmlsaXR5O1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Bcm1vcjxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBzeXN0ZW06IFZlcmV0ZW5vQXJtb3JTeXN0ZW1EYXRhO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0FybW9yIH0iLCAiZW51bSBTa2lsbFR5cGUge1xyXG4gICAgTm9uZSA9IFwibm9uZVwiLFxyXG4gICAgTWVsZWUgPSBcIm1lbGVlXCIsXHJcbiAgICBTdHJlbmd0aCA9IFwic3RyZW5ndGhcIixcclxuICAgIEFnaWxpdHkgPSBcImFnaWxpdHlcIixcclxuICAgIFBpbG90aW5nID0gXCJwaWxvdGluZ1wiLFxyXG4gICAgU3RlYWx0aCA9IFwic3RlYWx0aFwiLFxyXG4gICAgUmFuZ2VkID0gXCJyYW5nZWRcIixcclxuICAgIEN5YmVyc2hhbWFuaXNtID0gXCJjeWJlcnNoYW1hbmlzbVwiLFxyXG4gICAgU3Vydml2YWwgPSBcInN1cnZpdmFsXCIsXHJcbiAgICBNZWRpY2luZSA9IFwibWVkaWNpbmVcIixcclxuICAgIE9ic2VydmF0aW9uID0gXCJvYnNlcnZhdGlvblwiLFxyXG4gICAgU2NpZW5jZSA9IFwic2NpZW5jZVwiLFxyXG4gICAgTWVjaGFuaWNzID0gXCJtZWNoYW5pY3NcIixcclxuICAgIE1hbmlwdWxhdGlvbiA9IFwibWFuaXB1bGF0aW9uXCIsXHJcbiAgICBMZWFkZXJzaGlwID0gXCJsZWFkZXJzaGlwXCIsXHJcbiAgICBXaXRjaGNyYWZ0ID0gXCJ3aXRjaGNyYWZ0XCIsXHJcbiAgICBDdWx0dXJlID0gXCJjdWx0dXJlXCIsXHJcbn07XHJcblxyXG5pbnRlcmZhY2UgSURpY3Rpb25hcnk8VD4ge1xyXG4gICAgW2luZGV4OiBzdHJpbmddOiBUXHJcbn1cclxuXHJcbmV4cG9ydCB7IFNraWxsVHlwZSB9XHJcbmV4cG9ydCB0eXBlIHsgSURpY3Rpb25hcnkgfSIsICJpbXBvcnQgeyBTa2lsbFR5cGUgfSBmcm9tIFwiJGNvbW1vblwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIiRtb2R1bGUvYWN0b3JcIjtcclxuaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuaW1wb3J0IHsgV2VhcG9uVHlwZSwgUmFuZ2VUeXBlLCBWZXJldGVub1dlYXBvblN5c3RlbURhdGEgfSBmcm9tIFwiLi9kYXRhXCI7XHJcblxyXG5jbGFzcyBWZXJldGVub1dlYXBvbjxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBnZXQgTW9kaWZpZXIoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ubW9kaWZpZXI7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IERhbWFnZSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5kYW1hZ2U7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IEluaXRpYXRpdmUoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uaW5pdGlhdGl2ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgQ3JpdCgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5jcml0O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBXZWFwb25UeXBlKCk6IFdlYXBvblR5cGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS53ZWFwb25UeXBlIHx8IFdlYXBvblR5cGUuTm9uZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgQXR0YWNrV2l0aCgpOiBTa2lsbFR5cGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5hdHRhY2tXaXRoIHx8IFNraWxsVHlwZS5Ob25lO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBSYW5nZSgpOiBSYW5nZVR5cGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5yYW5nZSB8fCBSYW5nZVR5cGUuTm9uZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgSGFzQnVyc3QoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmhhc0J1cnN0IHx8IGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9XZWFwb248VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgUGh5c2ljYWxWZXJldGVub0l0ZW08VFBhcmVudD4ge1xyXG4gICAgc3lzdGVtOiBWZXJldGVub1dlYXBvblN5c3RlbURhdGE7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vV2VhcG9uIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9DaGFyYWN0ZXIsIFZlcmV0ZW5vTW9uc3RlciwgVmVyZXRlbm9OcGMgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FybW9yIH0gZnJvbSBcIiRtb2R1bGUvaXRlbVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub1dlYXBvbiB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vd2VhcG9uL2RvY3VtZW50XCI7XHJcblxyXG5leHBvcnQgY29uc3QgVkVSRVRFTk9DT05GSUcgPSB7XHJcbiAgICBjb21tb246IHtcclxuICAgICAgICBwcmljZTogXCJ2ZXJldGVuby5jb21tb24ucHJpY2VcIixcclxuICAgIH0sXHJcbiAgICB0YWJzOiB7XHJcbiAgICAgICAgc3RhdDogXCJ2ZXJldGVuby50YWIuc3RhdFwiLFxyXG4gICAgICAgIGVxdWlwbWVudDogXCJ2ZXJldGVuby50YWIuZXF1aXBtZW50XCIsXHJcbiAgICAgICAgZmlnaHQ6IFwidmVyZXRlbm8udGFiLmZpZ2h0XCIsXHJcbiAgICAgICAgYmlvOiBcInZlcmV0ZW5vLnRhYi5iaW9cIlxyXG4gICAgfSxcclxuICAgIHdlYXBvblR5cGVzOiB7XHJcbiAgICAgICAgbm9uZTogXCJ2ZXJldGVuby53ZWFwb25UeXBlLm5vbmVcIixcclxuICAgICAgICBicmF3bGluZzogXCJ2ZXJldGVuby53ZWFwb25UeXBlLmJyYXdsaW5nXCIsXHJcbiAgICAgICAgbWVsZWU6IFwidmVyZXRlbm8ud2VhcG9uVHlwZS5tZWxlZVwiLFxyXG4gICAgICAgIHJhbmdlZDogXCJ2ZXJldGVuby53ZWFwb25UeXBlLnJhbmdlZFwiLFxyXG4gICAgfSxcclxuICAgIHJhbmdlVHlwZXM6IHtcclxuICAgICAgICBwb2ludEJsYW5rOiBcInZlcmV0ZW5vLnJhbmdlLnBvaW50QmxhbmtcIixcclxuICAgICAgICBjbG9zZTogXCJ2ZXJldGVuby5yYW5nZS5jbG9zZVwiLFxyXG4gICAgICAgIG1lZGl1bTogXCJ2ZXJldGVuby5yYW5nZS5tZWRpdW1cIixcclxuICAgICAgICBsb25nOiBcInZlcmV0ZW5vLnJhbmdlLmxvbmdcIixcclxuICAgICAgICB1dG1vc3Q6IFwidmVyZXRlbm8ucmFuZ2UudXRtb3N0XCJcclxuICAgIH0sXHJcbiAgICBzdGF0czoge1xyXG4gICAgICAgIGhpdFBvaW50czogXCJ2ZXJldGVuby5zdGF0LmhpdFBvaW50XCIsXHJcbiAgICAgICAgd2lsbFBvaW50czogXCJ2ZXJldGVuby5zdGF0LndpbGxQb2ludFwiLFxyXG4gICAgICAgIHJlcHV0YXRpb246IFwidmVyZXRlbm8uc3RhdC5yZXB1dGF0aW9uXCJcclxuICAgIH0sXHJcbiAgICBhdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgY29uc3RpdHV0aW9uOiBcInZlcmV0ZW5vLmF0dHJpYnV0ZS5jb25zdGl0dXRpb25cIixcclxuICAgICAgICBpbnRlbGxpZ2VuY2U6IFwidmVyZXRlbm8uYXR0cmlidXRlLmludGVsbGlnZW5jZVwiLFxyXG4gICAgICAgIGRleHRlcml0eTogXCJ2ZXJldGVuby5hdHRyaWJ1dGUuZGV4dGVyaXR5XCIsXHJcbiAgICAgICAgZW1wYXRoeTogXCJ2ZXJldGVuby5hdHRyaWJ1dGUuZW1wYXRoeVwiXHJcbiAgICB9LFxyXG4gICAgc2tpbGxzOiB7XHJcbiAgICAgICAgbWVsZWU6IFwidmVyZXRlbm8uc2tpbGwubWVsZWVcIixcclxuICAgICAgICBzdHJlbmd0aDogXCJ2ZXJldGVuby5za2lsbC5zdHJlbmd0aFwiLFxyXG4gICAgICAgIGFnaWxpdHk6IFwidmVyZXRlbm8uc2tpbGwuYWdpbGl0eVwiLFxyXG4gICAgICAgIHBpbG90aW5nOiBcInZlcmV0ZW5vLnNraWxsLnBpbG90aW5nXCIsXHJcbiAgICAgICAgc3RlYWx0aDogXCJ2ZXJldGVuby5za2lsbC5zdGVhbHRoXCIsXHJcbiAgICAgICAgcmFuZ2VkOiBcInZlcmV0ZW5vLnNraWxsLnJhbmdlZFwiLFxyXG4gICAgICAgIGN5YmVyc2hhbWFuaXNtOiBcInZlcmV0ZW5vLnNraWxsLmN5YmVyc2hhbWFuaXNtXCIsXHJcbiAgICAgICAgc3Vydml2YWw6IFwidmVyZXRlbm8uc2tpbGwuc3Vydml2YWxcIixcclxuICAgICAgICBtZWRpY2luZTogXCJ2ZXJldGVuby5za2lsbC5tZWRpY2luZVwiLFxyXG4gICAgICAgIG9ic2VydmF0aW9uOiBcInZlcmV0ZW5vLnNraWxsLm9ic2VydmF0aW9uXCIsXHJcbiAgICAgICAgc2NpZW5jZTogXCJ2ZXJldGVuby5za2lsbC5zY2llbmNlXCIsXHJcbiAgICAgICAgbWVjaGFuaWNzOiBcInZlcmV0ZW5vLnNraWxsLm1lY2hhbmljc1wiLFxyXG4gICAgICAgIG1hbmlwdWxhdGlvbjogXCJ2ZXJldGVuby5za2lsbC5tYW5pcHVsYXRpb25cIixcclxuICAgICAgICBsZWFkZXJzaGlwOiBcInZlcmV0ZW5vLnNraWxsLmxlYWRlcnNoaXBcIixcclxuICAgICAgICB3aXRjaGNyYWZ0OiBcInZlcmV0ZW5vLnNraWxsLndpdGNoY3JhZnRcIixcclxuICAgICAgICBjdWx0dXJlOiBcInZlcmV0ZW5vLnNraWxsLmN1bHR1cmVcIlxyXG4gICAgfSxcclxuXHJcbiAgICBJdGVtOiB7XHJcbiAgICAgICAgZG9jdW1lbnRDbGFzc2VzOiB7XHJcbiAgICAgICAgICAgIGFybW9yOiBWZXJldGVub0FybW9yLFxyXG4gICAgICAgICAgICB3ZWFwb246IFZlcmV0ZW5vV2VhcG9uXHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcblxyXG4gICAgQWN0b3I6IHtcclxuICAgICAgICBkb2N1bWVudENsYXNzZXM6IHtcclxuICAgICAgICAgICAgY2hhcmFjdGVyOiBWZXJldGVub0NoYXJhY3RlcixcclxuICAgICAgICAgICAgbnBjOiBWZXJldGVub05wYyxcclxuICAgICAgICAgICAgbW9uc3RlcjogVmVyZXRlbm9Nb25zdGVyXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwgImV4cG9ydCBjb25zdCBWRVJFVEVOT19QQVJUSUFMUyA9IFtcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL3N0YXRzLXRhYi5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL3N0YXRzLWJsb2NrLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3Ivc2tpbGxzLWJsb2NrLmhic1wiLFxyXG5cclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2VxdWlwbWVudC10YWIuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9pdGVtL3dlYXBvbi1wbGF0ZS5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2l0ZW0vYXJtb3ItcGxhdGUuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9pdGVtL2VxdWlwbWVudC1wbGF0ZS5oYnNcIixcclxuXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9maWdodC10YWIuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9maWdodC9icmF3bGluZy13ZWFwb24tcGxhdGUuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9maWdodC9tZWxlZS13ZWFwb24tcGxhdGUuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9maWdodC9yYW5nZWQtd2VhcG9uLXBsYXRlLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvZmlnaHQvYXJtb3ItcGxhdGUuaGJzXCIsXHJcblxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvYmlvLXRhYi5oYnNcIixcclxuXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9pdGVtL2Jhc2UtaXRlbS1ibG9jay5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2l0ZW0vcGh5c2ljYWwtaXRlbS1ibG9jay5oYnNcIixcclxuXTsiLCAiaW1wb3J0IHsgU2tpbGxUeXBlIH0gZnJvbSBcIiRjb21tb25cIjtcclxuaW1wb3J0IHsgSWRMYWJlbFR5cGUgfSBmcm9tIFwiJG1vZHVsZS9kYXRhXCI7XHJcbmltcG9ydCB7IFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldCwgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YSB9IGZyb20gXCIuLi9waHlzaWNhbC1pdGVtL3NoZWV0XCI7XHJcbmltcG9ydCB7IFdlYXBvblR5cGUsIFJhbmdlVHlwZSB9IGZyb20gXCIuL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9XZWFwb24gfSBmcm9tIFwiLi9kb2N1bWVudFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9XZWFwb25TaGVldCBleHRlbmRzIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldDxWZXJldGVub1dlYXBvbj57XHJcbiAgICBvdmVycmlkZSBhc3luYyBnZXREYXRhKG9wdGlvbnM/OiBQYXJ0aWFsPERvY3VtZW50U2hlZXRPcHRpb25zPik6IFByb21pc2U8VmVyZXRlbm9XZWFwb25TaGVldERhdGE+IHtcclxuICAgICAgICBjb25zdCBzaGVldERhdGEgPSBhd2FpdCBzdXBlci5nZXREYXRhKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW0gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciB3ZWFwb25UeXBlcyA9IE9iamVjdC52YWx1ZXMoV2VhcG9uVHlwZSkubWFwKChlLCBpKSA9PiB7IHJldHVybiB7IGlkOiBpLCBsYWJlbDogZ2FtZS5pMThuLmxvY2FsaXplKGB2ZXJldGVuby53ZWFwb25UeXBlLiR7ZX1gKSwgdHlwZTogZSB9IH0pXHJcbiAgICAgICAgdmFyIHJhbmdlVHlwZXMgPSBPYmplY3QudmFsdWVzKFJhbmdlVHlwZSkubWFwKChlLCBpKSA9PiB7IHJldHVybiB7IGlkOiBpLCBsYWJlbDogZ2FtZS5pMThuLmxvY2FsaXplKGB2ZXJldGVuby5yYW5nZS4ke2V9YCksIHR5cGU6IGUgfSB9KVxyXG4gICAgICAgIHZhciBza2lsbFR5cGVzID0gT2JqZWN0LnZhbHVlcyhTa2lsbFR5cGUpLm1hcCgoZSwgaSkgPT4geyByZXR1cm4geyBpZDogaSwgbGFiZWw6IGdhbWUuaTE4bi5sb2NhbGl6ZShgdmVyZXRlbm8uc2tpbGwuJHtlfWApLCB0eXBlOiBlIH0gfSlcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0OiBWZXJldGVub1dlYXBvblNoZWV0RGF0YSA9IHtcclxuICAgICAgICAgICAgLi4uc2hlZXREYXRhLFxyXG4gICAgICAgICAgICBtb2RpZmllcjogaXRlbS5Nb2RpZmllcixcclxuICAgICAgICAgICAgd2VhcG9uVHlwZTogaXRlbS5XZWFwb25UeXBlLFxyXG4gICAgICAgICAgICBhdHRhY2tXaXRoOiBpdGVtLkF0dGFja1dpdGgsXHJcbiAgICAgICAgICAgIGNyaXQ6IGl0ZW0uQ3JpdCxcclxuICAgICAgICAgICAgZGFtYWdlOiBpdGVtLkRhbWFnZSxcclxuICAgICAgICAgICAgaW5pdGlhdGl2ZTogaXRlbS5Jbml0aWF0aXZlLFxyXG4gICAgICAgICAgICByYW5nZTogaXRlbS5SYW5nZSxcclxuICAgICAgICAgICAgd2VhcG9uVHlwZXM6IHdlYXBvblR5cGVzLFxyXG4gICAgICAgICAgICByYW5nZXM6IHJhbmdlVHlwZXMsXHJcbiAgICAgICAgICAgIHNraWxsczogc2tpbGxUeXBlcyxcclxuICAgICAgICAgICAgaXNSYW5nZWQ6IGl0ZW0uUmFuZ2UgPiBSYW5nZVR5cGUuTWVkaXVtLFxyXG4gICAgICAgICAgICBoYXNCdXJzdDogaXRlbS5IYXNCdXJzdFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRlbXBsYXRlKCkge1xyXG4gICAgICAgIHJldHVybiBgc3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL2l0ZW1zL3dlYXBvbi1zaGVldC5oYnNgO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9XZWFwb25TaGVldERhdGEgZXh0ZW5kcyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXREYXRhPFZlcmV0ZW5vV2VhcG9uPiB7XHJcbiAgICBtb2RpZmllcjogbnVtYmVyO1xyXG4gICAgZGFtYWdlOiBudW1iZXI7XHJcbiAgICBpbml0aWF0aXZlOiBudW1iZXI7XHJcbiAgICBjcml0OiBudW1iZXI7XHJcbiAgICB3ZWFwb25UeXBlOiBXZWFwb25UeXBlLFxyXG4gICAgd2VhcG9uVHlwZXM6IElkTGFiZWxUeXBlPFdlYXBvblR5cGU+W10sXHJcbiAgICBhdHRhY2tXaXRoOiBTa2lsbFR5cGUsXHJcbiAgICBza2lsbHM6IElkTGFiZWxUeXBlPFNraWxsVHlwZT5bXTtcclxuICAgIHJhbmdlOiBSYW5nZVR5cGVcclxuICAgIHJhbmdlczogSWRMYWJlbFR5cGU8UmFuZ2VUeXBlPltdO1xyXG4gICAgaXNSYW5nZWQ6IGJvb2xlYW47XHJcbiAgICBoYXNCdXJzdDogYm9vbGVhblxyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub1dlYXBvblNoZWV0IH07XHJcbmV4cG9ydCB0eXBlIHsgVmVyZXRlbm9XZWFwb25TaGVldERhdGEgfSIsICJpbXBvcnQgeyBWZXJldGVub0l0ZW0gfSBmcm9tIFwiJG1vZHVsZS9pdGVtXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQWN0b3IgfSBmcm9tIFwiLi5cIjtcclxuXHJcbmFic3RyYWN0IGNsYXNzIFZlcmV0ZW5vQWN0b3JTaGVldDxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub0FjdG9yPiBleHRlbmRzIEFjdG9yU2hlZXQ8VEFjdG9yLCBWZXJldGVub0l0ZW0+IHtcclxuICAgIHN0YXRpYyBvdmVycmlkZSBnZXQgZGVmYXVsdE9wdGlvbnMoKTogQWN0b3JTaGVldE9wdGlvbnMge1xyXG4gICAgICAgIGNvbnN0IGlzUnVzc2lhbkxhbmd1YWdlID0gZ2FtZS5zZXR0aW5ncy5nZXQoXCJjb3JlXCIsIFwibGFuZ3VhZ2VcIikgPT0gJ3J1JztcclxuXHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IG1lcmdlT2JqZWN0KHN1cGVyLmRlZmF1bHRPcHRpb25zLCB7XHJcbiAgICAgICAgICAgIHdpZHRoOiA1NjAsXHJcbiAgICAgICAgICAgIGNsYXNzZXM6IFsndmVyZXRlbm8nLCAnYWN0b3InLCAnc2hlZXQnXVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmKGlzUnVzc2lhbkxhbmd1YWdlKXtcclxuICAgICAgICAgICAgb3B0aW9ucy5jbGFzc2VzLnB1c2goXCJsYW5nLXJ1XCIpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb3B0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICBvdmVycmlkZSBhc3luYyBnZXREYXRhKG9wdGlvbnM6IFBhcnRpYWw8RG9jdW1lbnRTaGVldE9wdGlvbnM+ID0ge30pOiBQcm9taXNlPFZlcmV0ZW5vQWN0b3JTaGVldERhdGE8VEFjdG9yPj4ge1xyXG4gICAgICAgIG9wdGlvbnMuaWQgPSB0aGlzLmlkO1xyXG4gICAgICAgIG9wdGlvbnMuZWRpdGFibGUgPSB0aGlzLmlzRWRpdGFibGU7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGFjdG9yOiBhY3RvcixcclxuICAgICAgICAgICAgY3NzQ2xhc3M6IHRoaXMuYWN0b3IuaXNPd25lciA/IFwiZWRpdGFibGVcIiA6IFwibG9ja2VkXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IGFjdG9yLnN5c3RlbSxcclxuICAgICAgICAgICAgZG9jdW1lbnQ6IHRoaXMuYWN0b3IsXHJcbiAgICAgICAgICAgIGVkaXRhYmxlOiB0aGlzLmlzRWRpdGFibGUsXHJcbiAgICAgICAgICAgIGVmZmVjdHM6IFtdLFxyXG4gICAgICAgICAgICBsaW1pdGVkOiB0aGlzLmFjdG9yLmxpbWl0ZWQsXHJcbiAgICAgICAgICAgIG9wdGlvbnMsXHJcbiAgICAgICAgICAgIG93bmVyOiB0aGlzLmFjdG9yLmlzT3duZXIsXHJcbiAgICAgICAgICAgIHRpdGxlOiB0aGlzLnRpdGxlLFxyXG4gICAgICAgICAgICBpdGVtczogYWN0b3IuaXRlbXMsXHJcbiAgICAgICAgICAgIGFjdG9yVHlwZTogYWN0b3IudHlwZSxcclxuXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBhY3Rvci5EZXNjcmlwdGlvblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvdmVycmlkZSBhY3RpdmF0ZUxpc3RlbmVycygkaHRtbDogSlF1ZXJ5KTogdm9pZCB7XHJcbiAgICAgICAgc3VwZXIuYWN0aXZhdGVMaXN0ZW5lcnMoJGh0bWwpO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9BY3RvclNoZWV0RGF0YTxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub0FjdG9yPiBleHRlbmRzIEFjdG9yU2hlZXREYXRhPFRBY3Rvcj4ge1xyXG4gICAgYWN0b3JUeXBlOiBzdHJpbmcgfCBudWxsO1xyXG4gICAgYWN0b3I6IFRBY3RvcjtcclxuICAgIGRhdGE6IFRBY3RvcltcInN5c3RlbVwiXTtcclxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQWN0b3JTaGVldCB9XHJcbmV4cG9ydCB0eXBlIHsgVmVyZXRlbm9BY3RvclNoZWV0RGF0YSB9XHJcbiIsICJpbXBvcnQgeyBWZXJldGVub1JvbGxEYXRhLCBWZXJldGVub1JvbGxPcHRpb25zIH0gZnJvbSBcIiRtb2R1bGUvZGF0YVwiO1xyXG5pbXBvcnQgeyBDaGF0TWVzc2FnZVNjaGVtYSB9IGZyb20gXCIuLi8uLi8uLi90eXBlcy9mb3VuZHJ5L2NvbW1vbi9kb2N1bWVudHMvY2hhdC1tZXNzYWdlXCI7XHJcblxyXG5jbGFzcyBWZXJldGVub1JvbGwgZXh0ZW5kcyBSb2xsIHtcclxuICAgIHN0YXRpYyBvdmVycmlkZSBDSEFUX1RFTVBMQVRFID0gXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9jaGF0L3JvbGxzL3ZlcmV0ZW5vLXJvbGwtY2hhdC1tZXNzYWdlLmhic1wiO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGZvcm11bGE6IHN0cmluZywgZGF0YT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBvcHRpb25zPzogUm9sbE9wdGlvbnMpIHtcclxuICAgICAgICBzdXBlcihmb3JtdWxhLCBkYXRhLCBvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb3ZlcnJpZGUgYXN5bmMgX2V2YWx1YXRlKHsgbWluaW1pemUsIG1heGltaXplLCB9OiBPbWl0PEV2YWx1YXRlUm9sbFBhcmFtcywgXCJhc3luY1wiPik6IFByb21pc2U8Um9sbGVkPHRoaXM+PiB7XHJcbiAgICAgICAgY29uc3Qgc3VwZXJFdmFsdWF0ZSA9IGF3YWl0IHN1cGVyLl9ldmFsdWF0ZSh7IG1pbmltaXplLCBtYXhpbWl6ZSB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN1cGVyRXZhbHVhdGU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub1JvbGwgZXh0ZW5kcyBSb2xsIHsgfVxyXG5cclxuY2xhc3MgVmVyZXRlbm9Ta2lsbFJvbGwgZXh0ZW5kcyBWZXJldGVub1JvbGwge1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IHJvbGxEYXRhID0gb3B0aW9ucy5yb2xsRGF0YTtcclxuICAgICAgICBjb25zdCBmb3JtdWxhID0gYCR7cm9sbERhdGEucG9vbH0ke3JvbGxEYXRhLmRpY2V9YDtcclxuXHJcbiAgICAgICAgc3VwZXIoZm9ybXVsYSwgKHJvbGxEYXRhIGFzIFJlY29yZDxzdHJpbmcsIGFueT4pLCBvcHRpb25zLm1lc3NhZ2VEYXRhKTtcclxuICAgIH1cclxufVxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Ta2lsbFJvbGwgZXh0ZW5kcyBWZXJldGVub1JvbGwgeyB9XHJcblxyXG5leHBvcnQgeyBWZXJldGVub1JvbGwsIFZlcmV0ZW5vU2tpbGxSb2xsIH1cclxuIiwgImltcG9ydCB7IFZlcmV0ZW5vUm9sbE9wdGlvbnMsIFZlcmV0ZW5vUm9sbFR5cGUgfSBmcm9tIFwiJG1vZHVsZS9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vUm9sbCB9IGZyb20gXCIkbW9kdWxlL3N5c3RlbS9yb2xsXCI7XHJcblxyXG5jbGFzcyBWZXJldGVub1JvbGxlciB7XHJcbiAgICByb2xsT2JqZWN0OiBWZXJldGVub1JvbGwgfCBudWxsID0gbnVsbDtcclxuICAgIG9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMgfCBudWxsID0gbnVsbDtcclxuICAgIHZlcmV0ZW5vUmVzdWx0OiBWZXJldGVub1Jlc3VsdCA9IG5ldyBWZXJldGVub1Jlc3VsdCgpO1xyXG4gICAgdmVyZXRlbm9Sb2xsczogVmVyZXRlbm9EaWVSZXN1bHRbXSA9IFtdO1xyXG5cclxuICAgIGFzeW5jIHJvbGwocm9sbE9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSByb2xsT3B0aW9ucztcclxuICAgICAgICBpZiAocm9sbE9wdGlvbnMucm9sbERhdGEucG9vbCA8PSAwICYmIHJvbGxPcHRpb25zLnR5cGUgIT0gVmVyZXRlbm9Sb2xsVHlwZS5Bcm1vckJsb2NrKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJvbGxEZXNwZXJhdGlvbihyb2xsT3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcm9sbEZvcm11bGEgPSBgJHtyb2xsT3B0aW9ucy5yb2xsRGF0YS5wb29sfSR7cm9sbE9wdGlvbnMucm9sbERhdGEuZGljZX1gO1xyXG5cclxuICAgICAgICBsZXQgcm9sbCA9IG5ldyBWZXJldGVub1JvbGwocm9sbEZvcm11bGEpO1xyXG4gICAgICAgIHRoaXMucm9sbE9iamVjdCA9IHJvbGw7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5yb2xsT2JqZWN0Ll9ldmFsdWF0ZWQpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5yb2xsT2JqZWN0LmV2YWx1YXRlKHt9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVldmFsdWF0ZVRvdGFsKCk7XHJcbiAgICAgICAgdGhpcy50b01lc3NhZ2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByb2xsRGVzcGVyYXRpb24ocm9sbE9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBsZXQgcm9sbEZvcm11bGEgPSAnMGQyMCc7XHJcbiAgICAgICAgaWYgKHJvbGxPcHRpb25zLnJvbGxEYXRhLnBvb2wgPT0gMCkge1xyXG4gICAgICAgICAgICByb2xsRm9ybXVsYSA9ICcxZDIwJztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByb2xsRm9ybXVsYSA9ICcyZDIwJ1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJvbGwgPSBuZXcgVmVyZXRlbm9Sb2xsKHJvbGxGb3JtdWxhKTtcclxuICAgICAgICB0aGlzLnJvbGxPYmplY3QgPSByb2xsO1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyEudHlwZSA9IFZlcmV0ZW5vUm9sbFR5cGUuRGVzcGVyYXRpb247XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVldmFsdWF0ZURlc3BlcmF0aW9uVG90YWwoKTtcclxuICAgICAgICB0aGlzLnRvTWVzc2FnZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJvbGxJbml0aWF0aXZlKHJvbGxPcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gcm9sbE9wdGlvbnM7XHJcblxyXG4gICAgICAgIGxldCByb2xsRm9ybXVsYSA9IGAke3JvbGxPcHRpb25zLnJvbGxEYXRhLnBvb2x9JHtyb2xsT3B0aW9ucy5yb2xsRGF0YS5kaWNlfWA7XHJcblxyXG4gICAgICAgIGNvbnN0IGJvbnVzID0gcm9sbE9wdGlvbnMucm9sbERhdGEuYm9udXM7XHJcbiAgICAgICAgaWYgKGJvbnVzICE9PSBudWxsICYmIGJvbnVzICE9PSAwKSB7XHJcbiAgICAgICAgICAgIGlmIChib251cyA+IDApIHtcclxuICAgICAgICAgICAgICAgIHJvbGxGb3JtdWxhID0gcm9sbEZvcm11bGEgKyBgKyR7Ym9udXN9YFxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcm9sbEZvcm11bGEgPSByb2xsRm9ybXVsYSArIGAke2JvbnVzfWBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJvbGwgPSBuZXcgVmVyZXRlbm9Sb2xsKHJvbGxGb3JtdWxhKTtcclxuICAgICAgICB0aGlzLnJvbGxPYmplY3QgPSByb2xsO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMucm9sbE9iamVjdC5fZXZhbHVhdGVkKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucm9sbE9iamVjdC5ldmFsdWF0ZSh7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLnJlZXZhbHVhdGVUb3RhbCgpO1xyXG4gICAgICAgIHRoaXMudG9NZXNzYWdlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVldmFsdWF0ZVRvdGFsKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGlmICghdGhpcy5yb2xsT2JqZWN0IHx8ICF0aGlzLm9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnJvbGxPYmplY3QhLl9ldmFsdWF0ZWQpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5yb2xsT2JqZWN0IS5ldmFsdWF0ZSh7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJvbGxEYXRhLmlzU2VyaWFsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucm9sbE9iamVjdC5fZm9ybXVsYSArPSAnKydcclxuICAgICAgICAgICAgbGV0IGlzSW50ZXJydXB0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgd2hpbGUgKCFpc0ludGVycnVwdGVkKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWRkaXRpb25hbFJvbGwgPSBuZXcgUm9sbCgnMWQyMCcpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgYWRkaXRpb25hbFJvbGwuZXZhbHVhdGUoe30pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYWRkaXRpb25hbFJvbGxSZXN1bHQ6IERpZVJlc3VsdCA9IChhZGRpdGlvbmFsUm9sbC50ZXJtc1swXSBhcyBhbnkpLnJlc3VsdHNbMF07XHJcbiAgICAgICAgICAgICAgICAodGhpcy5yb2xsT2JqZWN0LnRlcm1zWzBdIGFzIGFueSkucmVzdWx0cy5wdXNoKGFkZGl0aW9uYWxSb2xsUmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIGlmIChhZGRpdGlvbmFsUm9sbFJlc3VsdC5yZXN1bHQgPD0gNCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlzSW50ZXJydXB0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcm9sbERpY2VzUmVzdWx0cyA9ICh0aGlzLnJvbGxPYmplY3QudGVybXNbMF0gYXMgYW55KS5yZXN1bHRzIGFzIERpZVJlc3VsdFtdO1xyXG4gICAgICAgIGxldCByb2xsUmVzdWx0ID0gdGhpcy5jYWxjdWxhdGVEaWNlc1RvdGFsKHJvbGxEaWNlc1Jlc3VsdHMpO1xyXG5cclxuICAgICAgICB0aGlzLnZlcmV0ZW5vUmVzdWx0ID0gcm9sbFJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWV2YWx1YXRlRGVzcGVyYXRpb25Ub3RhbCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMucm9sbE9iamVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMucm9sbE9iamVjdC5fZXZhbHVhdGVkKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucm9sbE9iamVjdC5ldmFsdWF0ZSh7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcm9sbERpY2VzUmVzdWx0cyA9ICh0aGlzLnJvbGxPYmplY3QudGVybXNbMF0gYXMgYW55KS5yZXN1bHRzO1xyXG4gICAgICAgIGxldCByb2xsUmVzdWx0ID0gdGhpcy5jYWxjdWxhdGVEZXNwZXJhdGlvbkRpY2VzVG90YWwocm9sbERpY2VzUmVzdWx0cyk7XHJcblxyXG4gICAgICAgIHRoaXMudmVyZXRlbm9SZXN1bHQgPSByb2xsUmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGNhbGN1bGF0ZURpY2VzVG90YWwoZGljZXM6IERpZVJlc3VsdFtdKTogVmVyZXRlbm9SZXN1bHQge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogVmVyZXRlbm9SZXN1bHQgPSB7XHJcbiAgICAgICAgICAgIHRvdGFsOiAwLFxyXG4gICAgICAgICAgICBzdWNjZXNzZXM6IDAsXHJcbiAgICAgICAgICAgIGNyaXRGYWlsczogMFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGljZXMuZm9yRWFjaChyID0+IHtcclxuICAgICAgICAgICAgbGV0IHJvbGxSZXN1bHQ6IFZlcmV0ZW5vRGllUmVzdWx0ID0ge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0OiByLnJlc3VsdCxcclxuICAgICAgICAgICAgICAgIGNsYXNzZXM6ICdkMjAnXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAoci5yZXN1bHQgPT09IDIwKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQudG90YWwgKz0gMjtcclxuICAgICAgICAgICAgICAgIHJvbGxSZXN1bHQuY2xhc3NlcyArPSAnIG1heCc7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuc3VjY2Vzc2VzICs9IDI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyLnJlc3VsdCA+PSAxNyAmJiByLnJlc3VsdCA8PSAxOSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRvdGFsKys7XHJcbiAgICAgICAgICAgICAgICByb2xsUmVzdWx0LmNsYXNzZXMgKz0gJyBnb29kJztcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5zdWNjZXNzZXMrKztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHIucmVzdWx0ID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQudG90YWwtLTtcclxuICAgICAgICAgICAgICAgIHJvbGxSZXN1bHQuY2xhc3NlcyArPSAnIG1pbic7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuY3JpdEZhaWxzKys7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudmVyZXRlbm9Sb2xscy5wdXNoKHJvbGxSZXN1bHQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGNhbGN1bGF0ZURlc3BlcmF0aW9uRGljZXNUb3RhbChkaWNlczogRGllUmVzdWx0W10pOiBWZXJldGVub1Jlc3VsdCB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0OiBWZXJldGVub1Jlc3VsdCA9IHtcclxuICAgICAgICAgICAgdG90YWw6IDAsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NlczogMCxcclxuICAgICAgICAgICAgY3JpdEZhaWxzOiAwXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaWNlcy5mb3JFYWNoKHIgPT4ge1xyXG4gICAgICAgICAgICBsZXQgcm9sbFJlc3VsdCA9IHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdDogci5yZXN1bHQsXHJcbiAgICAgICAgICAgICAgICBjbGFzc2VzOiAnZDIwJ1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKHIucmVzdWx0ID09PSAyMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRvdGFsKys7XHJcbiAgICAgICAgICAgICAgICByb2xsUmVzdWx0LmNsYXNzZXMgKz0gJyBtYXgnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoci5yZXN1bHQgPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC50b3RhbC0tO1xyXG4gICAgICAgICAgICAgICAgcm9sbFJlc3VsdC5jbGFzc2VzICs9ICcgbWluJztcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5jcml0RmFpbHMrKztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy52ZXJldGVub1JvbGxzLnB1c2gocm9sbFJlc3VsdCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRpY2VzQ291bnQgPSBkaWNlcy5sZW5ndGg7XHJcbiAgICAgICAgaWYgKHJlc3VsdC50b3RhbCA9PSBkaWNlc0NvdW50KSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC50b3RhbCA9IDE7XHJcbiAgICAgICAgICAgIHJlc3VsdC5zdWNjZXNzZXMgPSAxO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQudG90YWwgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQudG90YWwgPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHRvTWVzc2FnZSgpOiBQcm9taXNlPENoYXRNZXNzYWdlIHwgdW5kZWZpbmVkPiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY2hhdERhdGEgPSB0aGlzLm9wdGlvbnMubWVzc2FnZURhdGE7XHJcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSB0aGlzLmdldFRlbXBsYXRlKHRoaXMub3B0aW9ucy50eXBlKTtcclxuICAgICAgICBjb25zdCB2ZXJldGVub1JvbGxEYXRhID0gdGhpcy5nZXRWZXJldGVub1JvbGxEYXRhKCk7XHJcblxyXG4gICAgICAgIGNoYXREYXRhLmNvbnRlbnQgPSBhd2FpdCByZW5kZXJUZW1wbGF0ZSh0ZW1wbGF0ZSwgdmVyZXRlbm9Sb2xsRGF0YSk7XHJcbiAgICAgICAgY2hhdERhdGEucm9sbCA9IHRoaXMucm9sbE9iamVjdDtcclxuXHJcbiAgICAgICAgbGV0IHJvbGxNb2RlID0gZ2FtZS5zZXR0aW5ncy5nZXQoXCJjb3JlXCIsIFwicm9sbE1vZGVcIik7XHJcbiAgICAgICAgaWYgKHJvbGxNb2RlID09ICdibGluZHJvbGwnIHx8IGNoYXREYXRhLmJsaW5kKSB7XHJcbiAgICAgICAgICAgIHZhciBnbVJlY2lwaWVudCA9IENoYXRNZXNzYWdlLmdldFdoaXNwZXJSZWNpcGllbnRzKFwiR01cIik7XHJcbiAgICAgICAgICAgIGNoYXREYXRhLndoaXNwZXIgPSBnbVJlY2lwaWVudDtcclxuICAgICAgICAgICAgcm9sbE1vZGUgPSAnYmxpbmRyb2xsJ1xyXG4gICAgICAgICAgICBjaGF0RGF0YS50eXBlID0gQ09OU1QuQ0hBVF9NRVNTQUdFX1RZUEVTLldISVNQRVI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocm9sbE1vZGUgPT0gJ2dtcm9sbCcpIHtcclxuICAgICAgICAgICAgdmFyIGdtUmVjaXBpZW50ID0gQ2hhdE1lc3NhZ2UuZ2V0V2hpc3BlclJlY2lwaWVudHMoXCJHTVwiKTtcclxuICAgICAgICAgICAgY2hhdERhdGEud2hpc3BlciA9IGdtUmVjaXBpZW50O1xyXG4gICAgICAgICAgICBjaGF0RGF0YS50eXBlID0gQ09OU1QuQ0hBVF9NRVNTQUdFX1RZUEVTLldISVNQRVI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGF0RGF0YS5yb2xsTW9kZSA9IHJvbGxNb2RlO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5yb2xsT2JqZWN0Py50b01lc3NhZ2UoY2hhdERhdGEsIHsgY3JlYXRlOiBmYWxzZSwgcm9sbE1vZGU6IHJvbGxNb2RlIH0pXHJcbiAgICAgICAgLnRoZW4oZSA9PiBDaGF0TWVzc2FnZS5jcmVhdGUoZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFRlbXBsYXRlKHR5cGU6IFZlcmV0ZW5vUm9sbFR5cGUpOiBzdHJpbmcge1xyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFZlcmV0ZW5vUm9sbFR5cGUuUmVndWxhcjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL2NoYXQvcm9sbHMvdmVyZXRlbm8tcm9sbC1jaGF0LW1lc3NhZ2UuaGJzXCI7XHJcbiAgICAgICAgICAgIGNhc2UgVmVyZXRlbm9Sb2xsVHlwZS5Bcm1vckJsb2NrOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvY2hhdC9yb2xscy92ZXJldGVuby1hcm1vci1yb2xsLWNoYXQtbWVzc2FnZS5oYnNcIjtcclxuICAgICAgICAgICAgY2FzZSBWZXJldGVub1JvbGxUeXBlLkluaXRpYXRpdmU6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9jaGF0L3JvbGxzL3ZlcmV0ZW5vLWluaXRpYXRpdmUtcm9sbC1jaGF0LW1lc3NhZ2UuaGJzXCI7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9jaGF0L3JvbGxzL3ZlcmV0ZW5vLXJvbGwtY2hhdC1tZXNzYWdlLmhic1wiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRWZXJldGVub1JvbGxEYXRhKCk6IFZlcmV0ZW5vUm9sbFJlc3VsdCB7XHJcbiAgICAgICAgbGV0IHJvbGxEYXRhID0ge1xyXG4gICAgICAgICAgICBmb3JtdWxhOiB0aGlzLnJvbGxPYmplY3QhLl9mb3JtdWxhLFxyXG4gICAgICAgICAgICB0b3RhbDogdGhpcy5yb2xsT2JqZWN0IS50b3RhbCEsXHJcbiAgICAgICAgICAgIHZlcmV0ZW5vVG90YWw6IHRoaXMudmVyZXRlbm9SZXN1bHQudG90YWwsXHJcbiAgICAgICAgICAgIHZlcmV0ZW5vU3VjY2Vzc2VzOiB0aGlzLnZlcmV0ZW5vUmVzdWx0LnN1Y2Nlc3NlcyxcclxuICAgICAgICAgICAgdmVyZXRlbm9Dcml0RmFpbHM6IHRoaXMudmVyZXRlbm9SZXN1bHQuY3JpdEZhaWxzLFxyXG4gICAgICAgICAgICByb2xsczogdGhpcy52ZXJldGVub1JvbGxzXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcm9sbERhdGE7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBEaWVSZXN1bHQge1xyXG4gICAgYWN0aXZlOiBib29sZWFuO1xyXG4gICAgcmVzdWx0OiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0RpZVJlc3VsdCB7XHJcbiAgICByZXN1bHQ6IG51bWJlcjtcclxuICAgIGNsYXNzZXM6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgVmVyZXRlbm9SZXN1bHQge1xyXG4gICAgdG90YWw6IG51bWJlciA9IDA7XHJcbiAgICBzdWNjZXNzZXM6IG51bWJlciA9IDA7XHJcbiAgICBjcml0RmFpbHM6IG51bWJlciA9IDA7XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub1JvbGxSZXN1bHQge1xyXG4gICAgZm9ybXVsYTogc3RyaW5nO1xyXG4gICAgdG90YWw6IG51bWJlcjtcclxuICAgIHZlcmV0ZW5vVG90YWw6IG51bWJlcjtcclxuICAgIHZlcmV0ZW5vU3VjY2Vzc2VzOiBudW1iZXI7XHJcbiAgICB2ZXJldGVub0NyaXRGYWlsczogbnVtYmVyO1xyXG4gICAgcm9sbHM6IFZlcmV0ZW5vRGllUmVzdWx0W107XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vUm9sbGVyIH0iLCAiZXhwb3J0IGNsYXNzIFZlcmV0ZW5vUm9sbERpYWxvZyB7XHJcbiAgICB0ZW1wbGF0ZTogc3RyaW5nID0gJ3N5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL2NoYXQvZGlhbG9nL3JvbGwtZGlhbG9nLmhicyc7XHJcblxyXG4gICAgYXN5bmMgZ2V0VGFza0NoZWNrT3B0aW9ucygpOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50PiB7XHJcbiAgICAgICAgY29uc3QgaHRtbCA9IGF3YWl0IHJlbmRlclRlbXBsYXRlKHRoaXMudGVtcGxhdGUsIHt9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiXHUwNDFDXHUwNDNFXHUwNDM0XHUwNDM4XHUwNDQ0XHUwNDM4XHUwNDNBXHUwNDMwXHUwNDQyXHUwNDNFXHUwNDQwXHUwNDRCIFx1MDQzMVx1MDQ0MFx1MDQzRVx1MDQ0MVx1MDQzQVx1MDQzMFwiLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogaHRtbCxcclxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBub3JtYWw6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiXHUwNDE0XHUwNDMwXHUwNDNCXHUwNDM1XHUwNDM1XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBodG1sID0+IHJlc29sdmUodGhpcy5fcHJvY2Vzc1Rhc2tDaGVja09wdGlvbnMoKGh0bWxbMF0gYXMgdW5rbm93biBhcyBIVE1MQW5jaG9yRWxlbWVudCkucXVlcnlTZWxlY3RvcihcImZvcm1cIikpKVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIlx1MDQxRVx1MDQ0Mlx1MDQzQ1x1MDQzNVx1MDQzRFx1MDQzMFwiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IFwibm9ybWFsXCIsXHJcbiAgICAgICAgICAgICAgICBjbG9zZTogKCkgPT4gcmVzb2x2ZSh7IG1vZGlmaWVyOiAwLCBibGluZFJvbGw6IGZhbHNlLCBjYW5jZWxsZWQ6IHRydWUgfSlcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIG5ldyBEaWFsb2coZGF0YSkucmVuZGVyKHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIF9wcm9jZXNzVGFza0NoZWNrT3B0aW9ucyhmb3JtOiBKUXVlcnkpOiBWZXJldGVub1JvbGxEaWFsb2dBcmd1bWVudCB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbW9kaWZpZXI6IHBhcnNlSW50KGZvcm0ubW9kaWZpZXIudmFsdWUpLFxyXG4gICAgICAgICAgICBibGluZFJvbGw6IGZvcm0uYmxpbmRSb2xsLmNoZWNrZWQsXHJcbiAgICAgICAgICAgIGNhbmNlbGxlZDogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQge1xyXG4gICAgbW9kaWZpZXI6IG51bWJlciA9IDA7XHJcbiAgICBibGluZFJvbGw6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIGNhbmNlbGxlZDogYm9vbGVhbiA9IHRydWU7XHJcbn0iLCAiaW1wb3J0IHsgVmVyZXRlbm9DcmVhdHVyZSB9IGZyb20gXCIuLi9pbmRleFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FjdG9yU2hlZXQsIFZlcmV0ZW5vQWN0b3JTaGVldERhdGEgfSBmcm9tIFwiLi4vYmFzZS9zaGVldFwiO1xyXG5pbXBvcnQgeyBBdHRyaWJ1dGVXaXRoU2tpbGxzLCBBdHRyaWJ1dGVzQmxvY2ssIEl0ZW1BY3Rpb25JbmZvLCBTa2lsbCwgU2tpbGxzQmxvY2ssIFN0YXQsIFN0YXRzQmxvY2ssIFdlYXBvbkF0dGFja0luZm8gfSBmcm9tIFwiLi9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ2hhdE9wdGlvbnMsIFZlcmV0ZW5vTWVzc2FnZURhdGEsIFZlcmV0ZW5vUm9sbERhdGEsIFZlcmV0ZW5vUm9sbE9wdGlvbnMsIFZlcmV0ZW5vUm9sbFR5cGUgfSBmcm9tIFwiJG1vZHVsZS9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vUm9sbGVyIH0gZnJvbSBcIiRtb2R1bGUvdXRpbHMvdmVyZXRlbm8tcm9sbGVyXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vV2VhcG9uIH0gZnJvbSBcIiRtb2R1bGUvaXRlbS93ZWFwb24vZG9jdW1lbnRcIjtcclxuaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0sIFZlcmV0ZW5vQXJtb3IsIFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIkbW9kdWxlL2l0ZW1cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtVHlwZSB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vYmFzZS9kYXRhXCI7XHJcbmltcG9ydCB7IEF0dGFja1R5cGUsIFdlYXBvblR5cGUgfSBmcm9tIFwiJG1vZHVsZS9pdGVtL3dlYXBvbi9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vUm9sbERpYWxvZywgVmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQgfSBmcm9tIFwiJG1vZHVsZS9kaWFsb2dcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9FcXVpcG1lbnQgfSBmcm9tIFwiJG1vZHVsZS9pdGVtL2VxdWlwbWVudC9kb2N1bWVudFwiO1xyXG5cclxuYWJzdHJhY3QgY2xhc3MgVmVyZXRlbm9DcmVhdHVyZVNoZWV0PFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU+IGV4dGVuZHMgVmVyZXRlbm9BY3RvclNoZWV0PFRBY3Rvcj4ge1xyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zOiBQYXJ0aWFsPERvY3VtZW50U2hlZXRPcHRpb25zPiA9IHt9KTogUHJvbWlzZTxWZXJldGVub0NyZWF0dXJlU2hlZXREYXRhPFRBY3Rvcj4+IHtcclxuICAgICAgICBjb25zdCBzaGVldERhdGEgPSBhd2FpdCBzdXBlci5nZXREYXRhKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoYWN0b3IuU3RhdHMpKSB7XHJcbiAgICAgICAgICAgICh2IGFzIFN0YXQpLmxhYmVsID0gZ2FtZS5pMThuLmxvY2FsaXplKGB2ZXJldGVuby5zdGF0LiR7a31gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhhY3Rvci5BdHRyaWJ1dGVzKSkge1xyXG4gICAgICAgICAgICAodiBhcyBBdHRyaWJ1dGVXaXRoU2tpbGxzKS5sYWJlbCA9IGdhbWUuaTE4bi5sb2NhbGl6ZShgdmVyZXRlbm8uYXR0cmlidXRlLiR7a31gKTtcclxuICAgICAgICAgICAgKHYgYXMgQXR0cmlidXRlV2l0aFNraWxscykuc2tpbGxzID0ge307XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBbazEsIHYxXSBvZiBPYmplY3QuZW50cmllcyhhY3Rvci5Ta2lsbHMpLmZpbHRlcih4ID0+IHhbMV0uYXR0cmlidXRlID09PSBrKSkge1xyXG4gICAgICAgICAgICAgICAgKHYxIGFzIFNraWxsKS5sYWJlbCA9IGdhbWUuaTE4bi5sb2NhbGl6ZShgdmVyZXRlbm8uc2tpbGwuJHtrMX1gKTtcclxuICAgICAgICAgICAgICAgICh2IGFzIEF0dHJpYnV0ZVdpdGhTa2lsbHMpLnNraWxsc1trMV0gPSB2MTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZXF1aXBwZWRXZWFwb25zID0gYWN0b3IuRXF1aXBwZWRXZWFwb25zLm1hcCh4ID0+IHtcclxuICAgICAgICAgICAgc3dpdGNoICh4LldlYXBvblR5cGUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgV2VhcG9uVHlwZS5CcmF3bGluZzpcclxuICAgICAgICAgICAgICAgICAgICB4LnN5c3RlbVtcImlzQnJhd2xpbmdcIl0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgV2VhcG9uVHlwZS5NZWxlZTpcclxuICAgICAgICAgICAgICAgICAgICB4LnN5c3RlbVtcImlzTWVsZWVcIl0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgV2VhcG9uVHlwZS5SYW5nZWQ6XHJcbiAgICAgICAgICAgICAgICAgICAgeC5zeXN0ZW1bXCJpc1JhbmdlZFwiXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB4O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAuLi5zaGVldERhdGEsXHJcbiAgICAgICAgICAgIHN0YXRzOiBhY3Rvci5TdGF0cyxcclxuICAgICAgICAgICAgYXR0cmlidXRlczogYWN0b3IuQXR0cmlidXRlcyxcclxuICAgICAgICAgICAgc2tpbGxzOiBhY3Rvci5Ta2lsbHMsXHJcbiAgICAgICAgICAgIG1heEhwOiBhY3Rvci5NYXhIcCxcclxuICAgICAgICAgICAgbWF4V3A6IGFjdG9yLk1heFdwLFxyXG4gICAgICAgICAgICB3ZWFwb25zOiBhY3Rvci5XZWFwb25zLFxyXG4gICAgICAgICAgICBlcXVpcHBlZFdlYXBvbnM6IGVxdWlwcGVkV2VhcG9ucyxcclxuICAgICAgICAgICAgYXJtb3JzOiBhY3Rvci5Bcm1vcnMsXHJcbiAgICAgICAgICAgIGVxdWlwcGVkQXJtb3I6IGFjdG9yLkVxdWlwcGVkQXJtb3IsXHJcbiAgICAgICAgICAgIGVxdWlwbWVudDogYWN0b3IuSXRlbXMsXHJcbiAgICAgICAgICAgIGVxdWlwcGVkRXF1aXBtZW50OiBhY3Rvci5FcXVpcHBlZEl0ZW1zXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG92ZXJyaWRlIGFjdGl2YXRlTGlzdGVuZXJzKCRodG1sOiBKUXVlcnkpOiB2b2lkIHtcclxuICAgICAgICBzdXBlci5hY3RpdmF0ZUxpc3RlbmVycygkaHRtbCk7XHJcbiAgICAgICAgY29uc3QgaHRtbCA9ICRodG1sWzBdO1xyXG5cclxuICAgICAgICAkaHRtbC5vbignY2xpY2snLCAnLnNraWxsLWNoZWNrJywgdGhpcy4jb25Ta2lsbENoZWNrUm9sbC5iaW5kKHRoaXMpKTtcclxuICAgICAgICAkaHRtbC5vbignY2xpY2snLCAnLml0ZW0tYWN0aW9uJywgdGhpcy4jb25JdGVtQWN0aW9uLmJpbmQodGhpcykpO1xyXG4gICAgICAgICRodG1sLm9uKCdjbGljaycsICcuYXJtb3ItYWN0aW9uJywgdGhpcy4jb25Bcm1vckFjdGlvbi5iaW5kKHRoaXMpKTtcclxuICAgICAgICAkaHRtbC5vbignY2xpY2snLCAnLndlYXBvbi1hY3Rpb24nLCB0aGlzLiNvbldlYXBvbkFjdGlvbi5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgLy8gaHRtbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICcuaXRlbS1hY3Rpb24nLCB0aGlzLiNvbkl0ZW1BY3Rpb24uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgLy8gaHRtbC5vbignY2xpY2snLCAnLndlYXBvbi1hY3Rpb24nLCB0aGlzLiNvbldlYXBvbkFjdGlvbi5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyAjb25Ta2lsbENoZWNrUm9sbChldmVudDogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcbiAgICAgICAgY29uc3QgZGF0YXNldCA9IChlbGVtZW50IGFzIEhUTUxBbmNob3JFbGVtZW50KT8uZGF0YXNldDtcclxuXHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgY29uc3Qgc2hvd0RpYWxvZyA9IChDT05GSUcuU0VUVElOR1MuU2hvd1Rhc2tDaGVja09wdGlvbnMgIT09IGV2ZW50LmN0cmxLZXkpO1xyXG4gICAgICAgIGxldCBkaWFsb2dSZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQoKTtcclxuICAgICAgICBpZiAoc2hvd0RpYWxvZykge1xyXG4gICAgICAgICAgICBkaWFsb2dSZXN1bHQgPSBhd2FpdCAobmV3IFZlcmV0ZW5vUm9sbERpYWxvZygpKS5nZXRUYXNrQ2hlY2tPcHRpb25zKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlhbG9nUmVzdWx0LmNhbmNlbGxlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgeyBsYWJlbCwgcm9sbEtleSwgcm9sbFR5cGUgfSA9IGRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGlmIChyb2xsS2V5ID09IG51bGwgfHwgcm9sbFR5cGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcm9sbERhdGEgPSBuZXcgVmVyZXRlbm9Sb2xsRGF0YSgpO1xyXG4gICAgICAgIGlmIChyb2xsVHlwZSA9PSBcImF0dHJpYnV0ZVwiKSB7XHJcbiAgICAgICAgICAgIHJvbGxEYXRhID0gYXdhaXQgYWN0b3IuZ2V0QXR0cmlidXRlUm9sbERhdGEocm9sbEtleSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcm9sbERhdGEgPSBhd2FpdCBhY3Rvci5nZXRTa2lsbFJvbGxEYXRhKHJvbGxLZXkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcm9sbERhdGEucG9vbCArPSBkaWFsb2dSZXN1bHQubW9kaWZpZXI7XHJcblxyXG5cclxuICAgICAgICBsZXQgbWVzc2FnZURhdGEgPSB7XHJcbiAgICAgICAgICAgIHVzZXJJZDogZ2FtZS51c2VyLl9pZCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIHNwZWFrZXI6IENoYXRNZXNzYWdlLmdldFNwZWFrZXIoKSxcclxuICAgICAgICAgICAgZmxhdm9yOiBsYWJlbCB8fCAnJyxcclxuICAgICAgICAgICAgc291bmQ6IENPTkZJRy5zb3VuZHMuZGljZSxcclxuICAgICAgICAgICAgYmxpbmQ6IGZhbHNlIHx8IGRpYWxvZ1Jlc3VsdC5ibGluZFJvbGwgfHwgZXZlbnQuc2hpZnRLZXlcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCByb2xsT3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgdHlwZTogVmVyZXRlbm9Sb2xsVHlwZS5SZWd1bGFyLFxyXG4gICAgICAgICAgICBtZXNzYWdlRGF0YTogbWVzc2FnZURhdGEsXHJcbiAgICAgICAgICAgIHJvbGxEYXRhOiByb2xsRGF0YVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgcm9sbGVyID0gbmV3IFZlcmV0ZW5vUm9sbGVyKCk7XHJcbiAgICAgICAgYXdhaXQgcm9sbGVyLnJvbGwocm9sbE9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jICNvbldlYXBvbkFjdGlvbihldmVudDogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcbiAgICAgICAgY29uc3QgZGF0YXNldCA9IChlbGVtZW50IGFzIEhUTUxBbmNob3JFbGVtZW50KT8uZGF0YXNldDtcclxuXHJcbiAgICAgICAgY29uc3QgeyBpdGVtVHlwZSwgYWN0aW9uVHlwZSwgaXRlbUlkLCB3ZWFwb25UeXBlLCBhdHRhY2tUeXBlIH0gPSBkYXRhc2V0O1xyXG5cclxuICAgICAgICBpZiAoaXRlbUlkID09IG51bGwgfHwgaXRlbUlkID09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjaGF0T3B0aW9uczogVmVyZXRlbm9DaGF0T3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgaXNCbGluZDogZmFsc2UgfHwgZXZlbnQuc2hpZnRLZXksXHJcbiAgICAgICAgICAgIHNob3dEaWFsb2c6IChDT05GSUcuU0VUVElOR1MuU2hvd1Rhc2tDaGVja09wdGlvbnMgIT09IGV2ZW50LmN0cmxLZXkpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYWN0aW9uVHlwZSA9PT0gJ2luaXRpYXRpdmUnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJvbGxXZWFwb25Jbml0aWF0aXZlKGl0ZW1JZCwgY2hhdE9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChhY3Rpb25UeXBlID09PSAnYXR0YWNrJykge1xyXG4gICAgICAgICAgICBsZXQgd2VhcG9uRGF0YTogV2VhcG9uQXR0YWNrSW5mbyA9IHtcclxuICAgICAgICAgICAgICAgIGlkOiBpdGVtSWQsXHJcbiAgICAgICAgICAgICAgICB3ZWFwb25UeXBlOiB3ZWFwb25UeXBlIGFzIFdlYXBvblR5cGUsXHJcbiAgICAgICAgICAgICAgICBhdHRhY2tUeXBlOiBhdHRhY2tUeXBlIGFzIEF0dGFja1R5cGVcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJvbGxXZWFwb25BdHRhY2sod2VhcG9uRGF0YSwgY2hhdE9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByb2xsV2VhcG9uSW5pdGlhdGl2ZSh3ZWFwb25JZDogc3RyaW5nLCBjaGF0T3B0aW9uczogVmVyZXRlbm9DaGF0T3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBkaWFsb2dSZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQoKTtcclxuICAgICAgICBpZiAoY2hhdE9wdGlvbnMuc2hvd0RpYWxvZykge1xyXG4gICAgICAgICAgICBkaWFsb2dSZXN1bHQgPSBhd2FpdCAobmV3IFZlcmV0ZW5vUm9sbERpYWxvZygpKS5nZXRUYXNrQ2hlY2tPcHRpb25zKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlhbG9nUmVzdWx0LmNhbmNlbGxlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBtZXNzYWdlRGF0YTogVmVyZXRlbm9NZXNzYWdlRGF0YSA9IHtcclxuICAgICAgICAgICAgdXNlcklkOiBnYW1lLnVzZXIuX2lkIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgc3BlYWtlcjogQ2hhdE1lc3NhZ2UuZ2V0U3BlYWtlcigpLFxyXG4gICAgICAgICAgICBmbGF2b3I6ICdcdTA0MThcdTA0M0RcdTA0MzhcdTA0NDZcdTA0MzhcdTA0MzBcdTA0NDJcdTA0MzhcdTA0MzJcdTA0MzAnLFxyXG4gICAgICAgICAgICBzb3VuZDogQ09ORklHLnNvdW5kcy5kaWNlLFxyXG4gICAgICAgICAgICBibGluZDogY2hhdE9wdGlvbnMuaXNCbGluZCB8fCBkaWFsb2dSZXN1bHQuYmxpbmRSb2xsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbGV0IGluaXRpYXRpdmVSb2xsRGF0YSA9IGF3YWl0IGFjdG9yLmdldEluaXRpYXRpdmVSb2xsRGF0YSh3ZWFwb25JZCk7XHJcbiAgICAgICAgaWYgKGluaXRpYXRpdmVSb2xsRGF0YSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluaXRpYXRpdmVSb2xsRGF0YS5ib251cyArPSBkaWFsb2dSZXN1bHQubW9kaWZpZXI7XHJcblxyXG4gICAgICAgIGNvbnN0IHJvbGxPcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBWZXJldGVub1JvbGxUeXBlLkluaXRpYXRpdmUsXHJcbiAgICAgICAgICAgIG1lc3NhZ2VEYXRhLFxyXG4gICAgICAgICAgICByb2xsRGF0YTogaW5pdGlhdGl2ZVJvbGxEYXRhXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB2ZXJldGVub1JvbGxIYW5kbGVyID0gbmV3IFZlcmV0ZW5vUm9sbGVyKCk7XHJcbiAgICAgICAgYXdhaXQgdmVyZXRlbm9Sb2xsSGFuZGxlci5yb2xsSW5pdGlhdGl2ZShyb2xsT3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcm9sbFdlYXBvbkF0dGFjayh3ZWFwb25EYXRhOiBXZWFwb25BdHRhY2tJbmZvLCBjaGF0T3B0aW9uczogVmVyZXRlbm9DaGF0T3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBkaWFsb2dSZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQoKTtcclxuICAgICAgICBpZiAoY2hhdE9wdGlvbnMuc2hvd0RpYWxvZykge1xyXG4gICAgICAgICAgICBkaWFsb2dSZXN1bHQgPSBhd2FpdCAobmV3IFZlcmV0ZW5vUm9sbERpYWxvZygpKS5nZXRUYXNrQ2hlY2tPcHRpb25zKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlhbG9nUmVzdWx0LmNhbmNlbGxlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBtZXNzYWdlRGF0YTogVmVyZXRlbm9NZXNzYWdlRGF0YSA9IHtcclxuICAgICAgICAgICAgdXNlcklkOiBnYW1lLnVzZXIuX2lkIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgc3BlYWtlcjogQ2hhdE1lc3NhZ2UuZ2V0U3BlYWtlcigpLFxyXG4gICAgICAgICAgICBmbGF2b3I6IHdlYXBvbkRhdGEud2VhcG9uVHlwZSxcclxuICAgICAgICAgICAgc291bmQ6IENPTkZJRy5zb3VuZHMuZGljZSxcclxuICAgICAgICAgICAgYmxpbmQ6IGNoYXRPcHRpb25zLmlzQmxpbmQgfHwgZGlhbG9nUmVzdWx0LmJsaW5kUm9sbFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCB3ZWFwb25Sb2xsRGF0YSA9IGF3YWl0IGFjdG9yLmdldFdlYXBvblJvbGxEYXRhKHdlYXBvbkRhdGEpO1xyXG4gICAgICAgIHdlYXBvblJvbGxEYXRhLnBvb2wgKz0gZGlhbG9nUmVzdWx0Lm1vZGlmaWVyO1xyXG5cclxuICAgICAgICBjb25zdCByb2xsT3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgdHlwZTogVmVyZXRlbm9Sb2xsVHlwZS5BdHRhY2ssXHJcbiAgICAgICAgICAgIG1lc3NhZ2VEYXRhLFxyXG4gICAgICAgICAgICByb2xsRGF0YTogd2VhcG9uUm9sbERhdGFcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHZlcmV0ZW5vUm9sbEhhbmRsZXIgPSBuZXcgVmVyZXRlbm9Sb2xsZXIoKTtcclxuICAgICAgICBhd2FpdCB2ZXJldGVub1JvbGxIYW5kbGVyLnJvbGwocm9sbE9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jICNvbkl0ZW1BY3Rpb24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG4gICAgICAgIGNvbnN0IGRhdGFzZXQgPSAoZWxlbWVudCBhcyBIVE1MQW5jaG9yRWxlbWVudCk/LmRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgaXRlbVR5cGUsIGFjdGlvblR5cGUsIGl0ZW1JZCB9ID0gZGF0YXNldDtcclxuICAgICAgICBjb25zdCBpdGVtSW5mbzogSXRlbUFjdGlvbkluZm8gPSB7IHR5cGU6IChpdGVtVHlwZSEgYXMgVmVyZXRlbm9JdGVtVHlwZSksIGlkOiBpdGVtSWQhIH07XHJcblxyXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uVHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlICdyZW1vdmUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVtb3ZlSXRlbShpdGVtSW5mbyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2VxdWlwJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmVxdWlwSXRlbShpdGVtSW5mbyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3VuZXF1aXAnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudW5lcXVpcEl0ZW0oaXRlbUluZm8pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdzaGVldCc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5U2hlZXQoaXRlbUluZm8pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZW1vdmVJdGVtKGl0ZW1JbmZvOiBJdGVtQWN0aW9uSW5mbyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmFjdG9yLml0ZW1zLmdldChpdGVtSW5mby5pZCk7XHJcbiAgICAgICAgaWYgKCFpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYWN0b3IuZGVsZXRlRW1iZWRkZWREb2N1bWVudHMoXCJJdGVtXCIsIFtpdGVtLl9pZCFdKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBlcXVpcEl0ZW0oaXRlbUluZm86IEl0ZW1BY3Rpb25JbmZvKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgc3dpdGNoIChpdGVtSW5mby50eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3dlYXBvbic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5lcXVpcFdlYXBvbihpdGVtSW5mby5pZCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2FybW9yJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmVxdWlwQXJtb3IoaXRlbUluZm8uaWQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBlcXVpcFdlYXBvbihpdGVtSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmFjdG9yLml0ZW1zLmZpbmQoeCA9PiB4Ll9pZCA9PT0gaXRlbUlkKTtcclxuICAgICAgICBpZiAoIWl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDQzXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM2XHUwNDM0XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1LCBcdTA0MzVcdTA0NDFcdTA0M0JcdTA0MzggXHUwNDREXHUwNDNBXHUwNDM4XHUwNDNGXHUwNDM4XHUwNDQwXHUwNDNFXHUwNDMyXHUwNDMwXHUwNDNEXHUwNDNFIFx1MDQzMVx1MDQzRVx1MDQzQlx1MDQ0Q1x1MDQ0OFx1MDQzNSAyIFx1MDQ0RFx1MDQzQlx1MDQzNVx1MDQzQ1x1MDQzNVx1MDQzRFx1MDQ0Mlx1MDQzRVx1MDQzMiBcdTA0M0VcdTA0NDBcdTA0NDNcdTA0MzZcdTA0MzhcdTA0NEYuXHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMuYWN0b3IudXBkYXRlRW1iZWRkZWREb2N1bWVudHMoXCJJdGVtXCIsIFtcclxuICAgICAgICAgICAgeyBfaWQ6IGl0ZW0uX2lkISwgXCJzeXN0ZW0uaXNFcXVpcHBlZFwiOiB0cnVlIH0sXHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXF1aXBBcm1vcihpdGVtSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGVxdWlwcGVkQXJtb3IgPSB0aGlzLmFjdG9yLml0ZW1zLmZpbmQoeCA9PiAoeCBhcyB1bmtub3duIGFzIFZlcmV0ZW5vQXJtb3IpLnN5c3RlbS5pc0VxdWlwcGVkICYmIHgudHlwZSA9PT0gVmVyZXRlbm9JdGVtVHlwZS5Bcm1vcik7XHJcbiAgICAgICAgaWYgKGVxdWlwcGVkQXJtb3IpIHtcclxuICAgICAgICAgICAgLy8gXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDQzXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM2XHUwNDM0XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1LCBcdTA0MzVcdTA0NDFcdTA0M0JcdTA0MzggXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDNEXHUwNDRGIFx1MDQ0M1x1MDQzNlx1MDQzNSBcdTA0NERcdTA0M0FcdTA0MzhcdTA0M0ZcdTA0MzhcdTA0NDBcdTA0M0VcdTA0MzJcdTA0MzBcdTA0M0RcdTA0MzAuXHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5hY3Rvci5pdGVtcy5maW5kKHggPT4geC5faWQgPT09IGl0ZW1JZCk7XHJcbiAgICAgICAgaWYgKCFpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMuYWN0b3IudXBkYXRlRW1iZWRkZWREb2N1bWVudHMoXCJJdGVtXCIsIFtcclxuICAgICAgICAgICAgeyBfaWQ6IGl0ZW0uX2lkISwgXCJzeXN0ZW0uaXNFcXVpcHBlZFwiOiB0cnVlIH0sXHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgdW5lcXVpcEl0ZW0oaXRlbUluZm86IEl0ZW1BY3Rpb25JbmZvKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuYWN0b3IuaXRlbXMuZmluZCh4ID0+IHguX2lkID09PSBpdGVtSW5mby5pZFxyXG4gICAgICAgICAgICAmJiAoeCBhcyB1bmtub3duIGFzIFBoeXNpY2FsVmVyZXRlbm9JdGVtKS5zeXN0ZW1cclxuICAgICAgICAgICAgJiYgKHggYXMgdW5rbm93biBhcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSkuc3lzdGVtLmlzRXF1aXBwZWRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoIWl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5hY3Rvci51cGRhdGVFbWJlZGRlZERvY3VtZW50cyhcIkl0ZW1cIiwgW1xyXG4gICAgICAgICAgICB7IF9pZDogaXRlbS5faWQhLCBcInN5c3RlbS5pc0VxdWlwcGVkXCI6IGZhbHNlIH0sXHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcGxheVNoZWV0KGl0ZW1JbmZvOiBJdGVtQWN0aW9uSW5mbyk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmFjdG9yLml0ZW1zLmdldChpdGVtSW5mby5pZCk7XHJcbiAgICAgICAgaWYgKCFpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGl0ZW0uc2hlZXQucmVuZGVyKHRydWUsIHsgZWRpdGFibGU6IHRydWUgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgI29uQXJtb3JBY3Rpb24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG4gICAgICAgIGNvbnN0IGRhdGFzZXQgPSAoZWxlbWVudCBhcyBIVE1MQW5jaG9yRWxlbWVudCk/LmRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgaXRlbVR5cGUsIGFjdGlvblR5cGUsIGl0ZW1JZCB9ID0gZGF0YXNldDtcclxuXHJcbiAgICAgICAgY29uc3QgY2hhdE9wdGlvbnM6IFZlcmV0ZW5vQ2hhdE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGlzQmxpbmQ6IGZhbHNlIHx8IGV2ZW50LnNoaWZ0S2V5LFxyXG4gICAgICAgICAgICBzaG93RGlhbG9nOiAoQ09ORklHLlNFVFRJTkdTLlNob3dUYXNrQ2hlY2tPcHRpb25zICE9PSBldmVudC5jdHJsS2V5KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGl0ZW1JZCA9PSBudWxsIHx8IGl0ZW1JZCA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbWVzc2FnZURhdGEgPSB7XHJcbiAgICAgICAgICAgIHVzZXJJZDogZ2FtZS51c2VyLl9pZCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIHNwZWFrZXI6IENoYXRNZXNzYWdlLmdldFNwZWFrZXIoKSxcclxuICAgICAgICAgICAgZmxhdm9yOiAnJyxcclxuICAgICAgICAgICAgc291bmQ6IENPTkZJRy5zb3VuZHMuZGljZSxcclxuICAgICAgICAgICAgYmxpbmQ6IGZhbHNlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc3dpdGNoIChhY3Rpb25UeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Jsb2NrJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJvbGxBcm1vckJsb2NrKGl0ZW1JZCwgY2hhdE9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2FibGF0ZSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5hYmxhdGVBcm1vcihpdGVtSWQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3JlcGFpcic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yZXBhaXJBcm1vcihpdGVtSWQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJvbGxBcm1vckJsb2NrKGFybW9ySWQ6IHN0cmluZywgY2hhdE9wdGlvbnM6IFZlcmV0ZW5vQ2hhdE9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgZGlhbG9nUmVzdWx0ID0gbmV3IFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50KCk7XHJcbiAgICAgICAgaWYgKGNoYXRPcHRpb25zLnNob3dEaWFsb2cpIHtcclxuICAgICAgICAgICAgZGlhbG9nUmVzdWx0ID0gYXdhaXQgKG5ldyBWZXJldGVub1JvbGxEaWFsb2coKSkuZ2V0VGFza0NoZWNrT3B0aW9ucygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRpYWxvZ1Jlc3VsdC5jYW5jZWxsZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbWVzc2FnZURhdGE6IFZlcmV0ZW5vTWVzc2FnZURhdGEgPSB7XHJcbiAgICAgICAgICAgIHVzZXJJZDogZ2FtZS51c2VyLl9pZCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIHNwZWFrZXI6IENoYXRNZXNzYWdlLmdldFNwZWFrZXIoKSxcclxuICAgICAgICAgICAgZmxhdm9yOiAnXHUwNDE3XHUwNDMwXHUwNDQ5XHUwNDM4XHUwNDQyXHUwNDMwJyxcclxuICAgICAgICAgICAgc291bmQ6IENPTkZJRy5zb3VuZHMuZGljZSxcclxuICAgICAgICAgICAgYmxpbmQ6IGNoYXRPcHRpb25zLmlzQmxpbmQgfHwgZGlhbG9nUmVzdWx0LmJsaW5kUm9sbFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCBhcm1vclJvbGxEYXRhID0gYXdhaXQgYWN0b3IuZ2V0QXJtb3JSb2xsRGF0YShhcm1vcklkKTtcclxuICAgICAgICBpZiAoYXJtb3JSb2xsRGF0YSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFybW9yUm9sbERhdGEucG9vbCArPSBkaWFsb2dSZXN1bHQubW9kaWZpZXI7XHJcblxyXG4gICAgICAgIGNvbnN0IHJvbGxPcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBWZXJldGVub1JvbGxUeXBlLkFybW9yQmxvY2ssXHJcbiAgICAgICAgICAgIG1lc3NhZ2VEYXRhLFxyXG4gICAgICAgICAgICByb2xsRGF0YTogYXJtb3JSb2xsRGF0YVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJvbGxPcHRpb25zLnJvbGxEYXRhLnBvb2wgPT0gMCkge1xyXG4gICAgICAgICAgICAvLyBcdTA0NDFcdTA0M0VcdTA0M0VcdTA0MzFcdTA0NDlcdTA0MzVcdTA0M0RcdTA0MzhcdTA0MzUgXHUwNDNFIFx1MDQ0MFx1MDQzMFx1MDQzN1x1MDQzMVx1MDQzOFx1MDQ0Mlx1MDQzRVx1MDQzOSBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0MzUuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHZlcmV0ZW5vUm9sbEhhbmRsZXIgPSBuZXcgVmVyZXRlbm9Sb2xsZXIoKTtcclxuICAgICAgICBhd2FpdCB2ZXJldGVub1JvbGxIYW5kbGVyLnJvbGwocm9sbE9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGFibGF0ZUFybW9yKGFybW9ySWQ6IHN0cmluZywgdmFsdWU6IG51bWJlciA9IDEpIHtcclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAodmFsdWUgPCAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGFybW9yID0gKHRoaXMuYWN0b3IuaXRlbXMuZmluZCh4ID0+IHguX2lkID09PSBhcm1vcklkKSBhcyB1bmtub3duIGFzIFZlcmV0ZW5vQXJtb3IpO1xyXG4gICAgICAgIGlmICghYXJtb3IpIHtcclxuICAgICAgICAgICAgLy8gXHUwNDQxXHUwNDNFXHUwNDNFXHUwNDMxXHUwNDQ5XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1IFx1MDQzRVx1MDQzMSBcdTA0M0VcdTA0NDFcdTA0NDJcdTA0NDNcdTA0NDJcdTA0NDFcdTA0NDJcdTA0MzJcdTA0NDNcdTA0NEVcdTA0NDlcdTA0MzVcdTA0M0MgXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDNDXHUwNDM1XHUwNDQyXHUwNDM1LlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgPT09IDApIHtcclxuICAgICAgICAgICAgLy8gXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDQzXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM2XHUwNDM0XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1IFx1MDQzRSBcdTA0NDBcdTA0MzBcdTA0MzdcdTA0MzFcdTA0MzhcdTA0NDJcdTA0M0VcdTA0MzkgXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDNEXHUwNDM1LlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcm1vci5zeXN0ZW0uZHVyYWJpbGl0eSAtPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgaWYgKGFybW9yLnN5c3RlbS5kdXJhYmlsaXR5IDwgMCkge1xyXG4gICAgICAgICAgICBhcm1vci5zeXN0ZW0uZHVyYWJpbGl0eSA9IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgPT09IDApIHtcclxuICAgICAgICAgICAgLy8gXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDQzXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM2XHUwNDM0XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1IFx1MDQzRSBcdTA0NDBcdTA0MzBcdTA0MzdcdTA0MzFcdTA0MzhcdTA0NDJcdTA0M0VcdTA0MzkgXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDNEXHUwNDM1LlxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5hY3Rvci51cGRhdGVFbWJlZGRlZERvY3VtZW50cyhcIkl0ZW1cIiwgW1xyXG4gICAgICAgICAgICB7IF9pZDogYXJtb3IuX2lkISwgXCJzeXN0ZW0uZHVyYWJpbGl0eVwiOiBhcm1vci5zeXN0ZW0uZHVyYWJpbGl0eSB9LFxyXG4gICAgICAgIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlcGFpckFybW9yKGFybW9ySWQ6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IGFybW9yID0gKHRoaXMuYWN0b3IuaXRlbXMuZmluZCh4ID0+IHguX2lkID09PSBhcm1vcklkKSBhcyB1bmtub3duIGFzIFZlcmV0ZW5vQXJtb3IpO1xyXG4gICAgICAgIGlmICghYXJtb3IpIHtcclxuICAgICAgICAgICAgLy8gXHUwNDQxXHUwNDNFXHUwNDNFXHUwNDMxXHUwNDQ5XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1IFx1MDQzRVx1MDQzMSBcdTA0M0VcdTA0NDFcdTA0NDJcdTA0NDNcdTA0NDJcdTA0NDFcdTA0NDJcdTA0MzJcdTA0NDNcdTA0NEVcdTA0NDlcdTA0MzVcdTA0M0MgXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDNDXHUwNDM1XHUwNDQyXHUwNDM1XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBtYXhEdXJhYmlsaXR5ID0gYXJtb3Iuc3lzdGVtLmFybW9yQ2xhc3MgKyBhcm1vci5zeXN0ZW0ucXVhbGl0eVxyXG4gICAgICAgIGlmIChhcm1vci5zeXN0ZW0uZHVyYWJpbGl0eSA9PT0gbWF4RHVyYWJpbGl0eSkge1xyXG4gICAgICAgICAgICAvLyBcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzRcdTA0NDNcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzZcdTA0MzRcdTA0MzVcdTA0M0RcdTA0MzhcdTA0MzUgXHUwNDNFIFx1MDQ0Nlx1MDQzNVx1MDQzQlx1MDQzRVx1MDQzOSBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0MzUuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLmFjdG9yLnVwZGF0ZUVtYmVkZGVkRG9jdW1lbnRzKFwiSXRlbVwiLCBbXHJcbiAgICAgICAgICAgIHsgX2lkOiBhcm1vci5faWQhLCBcInN5c3RlbS5kdXJhYmlsaXR5XCI6IG1heER1cmFiaWxpdHkgfSxcclxuICAgICAgICBdKTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQ3JlYXR1cmVTaGVldERhdGE8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZT4gZXh0ZW5kcyBWZXJldGVub0FjdG9yU2hlZXREYXRhPFRBY3Rvcj4ge1xyXG4gICAgc3RhdHM6IFN0YXRzQmxvY2s7XHJcbiAgICBhdHRyaWJ1dGVzOiBBdHRyaWJ1dGVzQmxvY2s7XHJcbiAgICBza2lsbHM6IFNraWxsc0Jsb2NrO1xyXG4gICAgbWF4SHA6IG51bWJlcjtcclxuICAgIG1heFdwOiBudW1iZXI7XHJcbiAgICB3ZWFwb25zOiBWZXJldGVub1dlYXBvbltdO1xyXG4gICAgZXF1aXBwZWRXZWFwb25zOiBWZXJldGVub1dlYXBvbltdO1xyXG4gICAgYXJtb3JzOiBWZXJldGVub0FybW9yW107XHJcbiAgICBlcXVpcHBlZEFybW9yOiBWZXJldGVub0FybW9yO1xyXG4gICAgZXF1aXBtZW50OiBWZXJldGVub0VxdWlwbWVudFtdO1xyXG4gICAgZXF1aXBwZWRFcXVpcG1lbnQ6IFZlcmV0ZW5vRXF1aXBtZW50W107XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmVTaGVldCB9XHJcbmV4cG9ydCB0eXBlIHsgVmVyZXRlbm9DcmVhdHVyZVNoZWV0RGF0YSB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQ2hhcmFjdGVyIH0gZnJvbSBcIi4uXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmVTaGVldCwgVmVyZXRlbm9DcmVhdHVyZVNoZWV0RGF0YSB9IGZyb20gXCIuLi9jcmVhdHVyZS9zaGVldFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9DaGFyYWN0ZXJTaGVldDxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub0NoYXJhY3Rlcj4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlU2hlZXQ8VEFjdG9yPntcclxuICAgIHN0YXRpYyBvdmVycmlkZSBnZXQgZGVmYXVsdE9wdGlvbnMoKTogQWN0b3JTaGVldE9wdGlvbnMge1xyXG4gICAgICAgIGNvbnN0IHN1cGVyT3B0aW9ucyA9IHN1cGVyLmRlZmF1bHRPcHRpb25zO1xyXG4gICAgICAgIGNvbnN0IG1lcmdlZE9iamVjdCA9IG1lcmdlT2JqZWN0KHN1cGVyT3B0aW9ucywge1xyXG4gICAgICAgICAgICB3aWR0aDogNTYwLFxyXG4gICAgICAgICAgICBjbGFzc2VzOiBbLi4uc3VwZXJPcHRpb25zLmNsYXNzZXMsICdjaGFyYWN0ZXItc2hlZXQnXSxcclxuICAgICAgICAgICAgdGFiczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hdlNlbGVjdG9yOiBcIi5zaGVldC10YWJzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFNlbGVjdG9yOiBcIi5zaGVldC1ib2R5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5pdGlhbDogXCJtYWluXCIsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBtZXJnZWRPYmplY3Q7XHJcbiAgICB9XHJcblxyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zOiBQYXJ0aWFsPERvY3VtZW50U2hlZXRPcHRpb25zPiA9IHt9KTogUHJvbWlzZTxWZXJldGVub0NoYXJhY3RlclNoZWV0RGF0YTxUQWN0b3I+PiB7XHJcbiAgICAgICAgY29uc3Qgc2hlZXREYXRhID0gYXdhaXQgc3VwZXIuZ2V0RGF0YShvcHRpb25zKTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgLi4uc2hlZXREYXRhLFxyXG4gICAgICAgICAgICBtb25leTogYWN0b3IuTW9uZXksXHJcbiAgICAgICAgICAgIHJlcHV0YXRpb246IGFjdG9yLlJlcHV0YXRpb24sXHJcbiAgICAgICAgICAgIGV4cDogYWN0b3IuRXhwXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgdGVtcGxhdGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIGBzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvYWN0b3JzL2NoYXJhY3Rlci1zaGVldC5oYnNgO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9DaGFyYWN0ZXJTaGVldERhdGE8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9DaGFyYWN0ZXI+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZVNoZWV0RGF0YTxUQWN0b3I+IHtcclxuICAgIG1vbmV5OiBudW1iZXI7XHJcbiAgICByZXB1dGF0aW9uOiBudW1iZXI7XHJcbiAgICBleHA6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9DaGFyYWN0ZXJTaGVldCB9IiwgImltcG9ydCB7IFZlcmV0ZW5vTW9uc3RlciB9IGZyb20gXCIuLlwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0NyZWF0dXJlU2hlZXQgfSBmcm9tIFwiLi4vY3JlYXR1cmUvc2hlZXRcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vTW9uc3RlclNoZWV0PFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vTW9uc3Rlcj4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlU2hlZXQ8VEFjdG9yPntcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vTW9uc3RlclNoZWV0IH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9OcGMgfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9DcmVhdHVyZVNoZWV0IH0gZnJvbSBcIi4uL2NyZWF0dXJlL3NoZWV0XCI7XHJcblxyXG5jbGFzcyBWZXJldGVub05wY1NoZWV0PFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vTnBjPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmVTaGVldDxUQWN0b3I+e1xyXG5cclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9OcGNTaGVldCB9IiwgImV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclNldHRpbmdzKCk6IHZvaWQge1xyXG4gICAgZ2FtZS5zZXR0aW5ncy5yZWdpc3RlcihcInZlcmV0ZW5vXCIsIFwidmlzaWJpbGl0eS5zaG93VGFza0NoZWNrT3B0aW9uc1wiLCB7XHJcbiAgICAgICAgbmFtZTogXCJ2ZXJldGVuby5zZXR0aW5ncy5zaG93VGFza0NoZWNrT3B0aW9ucy5uYW1lXCIsXHJcbiAgICAgICAgaGludDogXCJ2ZXJldGVuby5zZXR0aW5ncy5zaG93VGFza0NoZWNrT3B0aW9ucy5oaW50XCIsXHJcbiAgICAgICAgc2NvcGU6IFwiY2xpZW50XCIsXHJcbiAgICAgICAgY29uZmlnOiB0cnVlLFxyXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXHJcbiAgICAgICAgdHlwZTogQm9vbGVhblxyXG4gICAgfSk7XHJcbn0iLCAiY2xhc3MgVmVyZXRlbm9DbGllbnRTZXR0aW5ncyB7XHJcbiAgICBnZXQgU2hvd1Rhc2tDaGVja09wdGlvbnMoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIGdhbWUuc2V0dGluZ3MuZ2V0KFwidmVyZXRlbm9cIiwgXCJ2aXNpYmlsaXR5LnNob3dUYXNrQ2hlY2tPcHRpb25zXCIpIGFzIGJvb2xlYW47XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0NsaWVudFNldHRpbmdzIHtcclxuICAgIFNob3dUYXNrQ2hlY2tPcHRpb25zOiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0NsaWVudFNldHRpbmdzIH07IiwgImltcG9ydCB7IFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldCwgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YSB9IGZyb20gXCIuLi9waHlzaWNhbC1pdGVtL3NoZWV0XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vRXF1aXBtZW50IH0gZnJvbSBcIi4vZG9jdW1lbnRcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vRXF1aXBtZW50U2hlZXQgZXh0ZW5kcyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQ8VmVyZXRlbm9FcXVpcG1lbnQ+IHtcclxuICAgIG92ZXJyaWRlIGFzeW5jIGdldERhdGEob3B0aW9ucz86IFBhcnRpYWw8RG9jdW1lbnRTaGVldE9wdGlvbnM+KTogUHJvbWlzZTxWZXJldGVub0VxdWlwbWVudFNoZWV0RGF0YT4ge1xyXG4gICAgICAgIGNvbnN0IHNoZWV0RGF0YSA9IGF3YWl0IHN1cGVyLmdldERhdGEob3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgaXRlbSB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0OiBWZXJldGVub0VxdWlwbWVudFNoZWV0RGF0YSA9IHtcclxuICAgICAgICAgICAgLi4uc2hlZXREYXRhLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRlbXBsYXRlKCkge1xyXG4gICAgICAgIHJldHVybiBgc3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL2l0ZW1zL2VxdWlwbWVudC1zaGVldC5oYnNgO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9FcXVpcG1lbnRTaGVldERhdGEgZXh0ZW5kcyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXREYXRhPFZlcmV0ZW5vRXF1aXBtZW50PiB7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vRXF1aXBtZW50U2hlZXQgfTtcclxuZXhwb3J0IHR5cGUgeyBWZXJldGVub0VxdWlwbWVudFNoZWV0RGF0YSB9OyIsICJpbXBvcnQgeyBWZXJldGVub0FybW9yU2hlZXQgfSBmcm9tICckbW9kdWxlL2l0ZW0vYXJtb3Ivc2hlZXQnO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW1TaGVldCB9IGZyb20gJyRtb2R1bGUvaXRlbS9iYXNlL3NoZWV0JztcclxuaW1wb3J0IHsgVkVSRVRFTk9DT05GSUcgfSBmcm9tICcuLi8uLi92ZXJldGVub0NvbmZpZyc7XHJcbmltcG9ydCB7IFZFUkVURU5PX1BBUlRJQUxTIH0gZnJvbSAnLi4vLi4vcGFydGlhbHMnO1xyXG5pbXBvcnQgeyBWZXJldGVub1dlYXBvblNoZWV0IH0gZnJvbSAnJG1vZHVsZS9pdGVtL3dlYXBvbi9zaGVldCc7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ2hhcmFjdGVyU2hlZXQgfSBmcm9tICckbW9kdWxlL2FjdG9yL2NoYXJhY3Rlci9zaGVldCc7XHJcbmltcG9ydCB7IFZlcmV0ZW5vTW9uc3RlclNoZWV0IH0gZnJvbSAnJG1vZHVsZS9hY3Rvci9tb25zdGVyL3NoZWV0JztcclxuaW1wb3J0IHsgVmVyZXRlbm9OcGNTaGVldCB9IGZyb20gJyRtb2R1bGUvYWN0b3IvbnBjL3NoZWV0JztcclxuaW1wb3J0IHsgcmVnaXN0ZXJTZXR0aW5ncyB9IGZyb20gJyRtb2R1bGUvc3lzdGVtL3NldHRpbmdzJztcclxuaW1wb3J0IHsgVmVyZXRlbm9DbGllbnRTZXR0aW5ncyB9IGZyb20gJyRtb2R1bGUvc3lzdGVtL3NldHRpbmdzL2NsaWVudC1zZXR0aW5ncyc7XHJcbmltcG9ydCB7IFZlcmV0ZW5vRXF1aXBtZW50U2hlZXQgfSBmcm9tICckbW9kdWxlL2l0ZW0vZXF1aXBtZW50L3NoZWV0JztcclxuXHJcbmZ1bmN0aW9uIHByZWxvYWRIYW5kbGViYXJzVGVtcGxhdGVzKCkge1xyXG4gICAgcmV0dXJuIGxvYWRUZW1wbGF0ZXMoVkVSRVRFTk9fUEFSVElBTFMpO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgSW5pdCA9IHtcclxuICAgIGxpc3RlbigpOiB2b2lkIHtcclxuICAgICAgICBIb29rcy5vbmNlKCdpbml0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlZlcmV0ZW5vIHwgU3lzdGVtIGluaXQgYmVnaW4uXCIpO1xyXG5cclxuICAgICAgICAgICAgQ09ORklHLlZFUkVURU5PID0gVkVSRVRFTk9DT05GSUc7XHJcbiAgICAgICAgICAgIENPTkZJRy5TRVRUSU5HUyA9IG5ldyBWZXJldGVub0NsaWVudFNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgICAgICBBY3RvcnMudW5yZWdpc3RlclNoZWV0KCdjb3JlJywgQWN0b3JTaGVldCk7XHJcbiAgICAgICAgICAgIEFjdG9ycy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vQ2hhcmFjdGVyU2hlZXQsIHtcclxuICAgICAgICAgICAgICAgIHR5cGVzOiBbJ2NoYXJhY3RlciddLFxyXG4gICAgICAgICAgICAgICAgbWFrZURlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIEFjdG9ycy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vTW9uc3RlclNoZWV0LCB7XHJcbiAgICAgICAgICAgICAgICB0eXBlczogWydtb25zdGVyJ10sXHJcbiAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgQWN0b3JzLnJlZ2lzdGVyU2hlZXQoJ3ZlcmV0ZW5vJywgVmVyZXRlbm9OcGNTaGVldCwge1xyXG4gICAgICAgICAgICAgICAgdHlwZXM6IFsnbnBjJ10sXHJcbiAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIEl0ZW1zLnVucmVnaXN0ZXJTaGVldCgnY29yZScsIEl0ZW1TaGVldCk7XHJcbiAgICAgICAgICAgIEl0ZW1zLnJlZ2lzdGVyU2hlZXQoJ3ZlcmV0ZW5vJywgVmVyZXRlbm9JdGVtU2hlZXQsIHtcclxuICAgICAgICAgICAgICAgIG1ha2VEZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBJdGVtcy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vQXJtb3JTaGVldCwge1xyXG4gICAgICAgICAgICAgICAgdHlwZXM6IFsnYXJtb3InXSxcclxuICAgICAgICAgICAgICAgIG1ha2VEZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBJdGVtcy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vV2VhcG9uU2hlZXQsIHtcclxuICAgICAgICAgICAgICAgIHR5cGVzOiBbJ3dlYXBvbiddLFxyXG4gICAgICAgICAgICAgICAgbWFrZURlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIEl0ZW1zLnJlZ2lzdGVyU2hlZXQoJ3ZlcmV0ZW5vJywgVmVyZXRlbm9FcXVpcG1lbnRTaGVldCwge1xyXG4gICAgICAgICAgICAgICAgdHlwZXM6IFsnZXF1aXBtZW50J10sXHJcbiAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHByZWxvYWRIYW5kbGViYXJzVGVtcGxhdGVzKCk7XHJcblxyXG4gICAgICAgICAgICByZWdpc3RlclNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlZlcmV0ZW5vIHwgU3lzdGVtIGluaXQgZG9uZS5cIik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbiIsICJpbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIiRtb2R1bGUvYWN0b3JcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBWZXJldGVub0FjdG9yczxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub0FjdG9yPG51bGw+PiBleHRlbmRzIEFjdG9yczxUQWN0b3I+IHtcclxuXHJcbn0iLCAiaW1wb3J0IHsgVmVyZXRlbm9BY3RvclByb3h5IH0gZnJvbSBcIiRtb2R1bGUvYWN0b3IvYmFzZS9kb2N1bWVudFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FjdG9ycyB9IGZyb20gXCIkbW9kdWxlL2NvbGxlY3Rpb25cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtUHJveHkgfSBmcm9tIFwiJG1vZHVsZS9pdGVtL2Jhc2UvZG9jdW1lbnRcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9Sb2xsIH0gZnJvbSBcIiRtb2R1bGUvc3lzdGVtL3JvbGxcIjtcclxuXHJcbmV4cG9ydCBjb25zdCBMb2FkID0ge1xyXG4gICAgbGlzdGVuKCk6IHZvaWQge1xyXG4gICAgICAgIENPTkZJRy5BY3Rvci5jb2xsZWN0aW9uID0gVmVyZXRlbm9BY3RvcnM7XHJcbiAgICAgICAgQ09ORklHLkFjdG9yLmRvY3VtZW50Q2xhc3MgPSBWZXJldGVub0FjdG9yUHJveHk7XHJcbiAgICAgICAgQ09ORklHLkl0ZW0uZG9jdW1lbnRDbGFzcyA9IFZlcmV0ZW5vSXRlbVByb3h5O1xyXG5cclxuICAgICAgICBDT05GSUcuRGljZS5yb2xscy5wdXNoKFZlcmV0ZW5vUm9sbCk7XHJcbiAgICB9XHJcbn0iLCAiaW1wb3J0IHsgSW5pdCB9IGZyb20gJy4vaW5pdCc7XHJcbmltcG9ydCB7IExvYWQgfSBmcm9tICcuL2xvYWQnO1xyXG5cclxuZXhwb3J0IGNvbnN0IEhvb2tzVmVyZXRlbm8gPSB7XHJcbiAgICBsaXN0ZW4oKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgbGlzdGVuZXJzOiB7IGxpc3RlbigpOiB2b2lkIH1bXSA9IFtcclxuICAgICAgICAgICAgSW5pdCxcclxuICAgICAgICAgICAgTG9hZCxcclxuICAgICAgICBdO1xyXG4gICAgICAgIGZvciAoY29uc3QgTGlzdGVuZXIgb2YgbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgIExpc3RlbmVyLmxpc3RlbigpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbn07XHJcbiIsICJpbXBvcnQgeyBIb29rc1ZlcmV0ZW5vIH0gZnJvbSAnLi9zY3JpcHRzL2hvb2tzL2luZGV4JztcclxuXHJcbkhvb2tzVmVyZXRlbm8ubGlzdGVuKCk7Il0sCiAgIm1hcHBpbmdzIjogIjs7O0FBRUEsTUFBTSxvQkFBTixjQUE0RCxVQUFpQjtBQUFBLElBQ3pFLElBQUksV0FBVztBQUNYLGFBQU8sS0FBSyxLQUFLO0FBQUEsSUFDckI7QUFBQSxJQUVBLElBQUksaUJBQWlCO0FBQ2pCLGFBQU8sS0FBSyxLQUFLO0FBQUEsSUFDckI7QUFBQSxJQUVBLFdBQVcsaUJBQWlCO0FBQ3hCLFlBQU0sb0JBQW9CLEtBQUssU0FBUyxJQUFJLFFBQVEsVUFBVSxLQUFLO0FBRW5FLFlBQU0sVUFBVSxZQUFZLE1BQU0sZ0JBQWdCO0FBQUEsUUFDOUMsT0FBTztBQUFBLFFBQ1AsU0FBUyxDQUFDLFlBQVksUUFBUSxPQUFPO0FBQUEsTUFDekMsQ0FBQztBQUNELFVBQUcsbUJBQWtCO0FBQ2pCLGdCQUFRLFFBQVEsS0FBSyxTQUFTO0FBQUEsTUFDbEM7QUFFQSxhQUFPO0FBQUEsSUFDWDtBQUFBLElBRUEsSUFBSSxXQUFXO0FBQ1gsYUFBTywyQ0FBMkMsS0FBSyxLQUFLLElBQUk7QUFBQSxJQUNwRTtBQUFBLElBRUEsTUFBZSxRQUFRLFVBQXlDLENBQUMsR0FBMEM7QUFDdkcsY0FBUSxLQUFLLEtBQUs7QUFDbEIsY0FBUSxXQUFXLEtBQUs7QUFFeEIsWUFBTSxFQUFFLEtBQUssSUFBSTtBQUdqQixZQUFNLGtCQUEwQyxDQUFDO0FBQ2pELFlBQU0sV0FBVyxFQUFFLEdBQUcsS0FBSyxLQUFLLFlBQVksR0FBRyxHQUFHLEtBQUssT0FBTyxZQUFZLEVBQUU7QUFFNUUsYUFBTztBQUFBLFFBQ0gsVUFBVTtBQUFBLFFBQ1Y7QUFBQSxRQUNBLE1BQU0sS0FBSztBQUFBLFFBQ1gsWUFBWTtBQUFBLFFB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QUNQQSxXQUFTLDZCQUE2QjtBQUNsQyxXQUFPLGNBQWMsaUJBQWlCO0FBQUEsRUFDMUM7QUFFTyxNQUFNLE9BQU87QUFBQSxJQUNoQixTQUFlO0FBQ1gsWUFBTSxLQUFLLFFBQVEsaUJBQWtCO0FBQ2pDLGdCQUFRLElBQUksK0JBQStCO0FBRTNDLGVBQU8sV0FBVztBQUNsQixlQUFPLFdBQVcsSUFBSSx1QkFBdUI7QUFFN0MsZUFBTyxnQkFBZ0IsUUFBUSxVQUFVO0FBQ3pDLGVBQU8sY0FBYyxZQUFZLHdCQUF3QjtBQUFBLFVBQ3JELE9BQU8sQ0FBQyxXQUFXO0FBQUEsVUFDbkIsYUFBYTtBQUFBLFFBQ2pCLENBQUM7QUFDRCxlQUFPLGNBQWMsWUFBWSxzQkFBc0I7QUFBQSxVQUNuRCxPQUFPLENBQUMsU0FBUztBQUFBLFVBQ2pCLGFBQWE7QUFBQSxRQUNqQixDQUFDO0FBQ0QsZUFBTyxjQUFjLFlBQVksa0JBQWtCO0FBQUEsVUFDL0MsT0FBTyxDQUFDLEtBQUs7QUFBQSxVQUNiLGFBQWE7QUFBQSxRQUNqQixDQUFDO0FBRUQsY0FBTSxnQkFBZ0IsUUFBUSxTQUFTO0FBQ3ZDLGNBQU0sY0FBYyxZQUFZLG1CQUFtQjtBQUFBLFVBQy9DLGFBQWE7QUFBQSxRQUNqQixDQUFDO0FBQ0QsY0FBTSxjQUFjLFlBQVksb0JBQW9CO0FBQUEsVUFDaEQsT0FBTyxDQUFDLE9BQU87QUFBQSxVQUNmLGFBQWE7QUFBQSxRQUNqQixDQUFDO0FBQ0QsY0FBTSxjQUFjLFlBQVkscUJBQXFCO0FBQUEsVUFDakQsT0FBTyxDQUFDLFFBQVE7QUFBQSxVQUNoQixhQUFhO0FBQUEsUUFDakIsQ0FBQztBQUNELGNBQU0sY0FBYyxZQUFZLHdCQUF3QjtBQUFBLFVBQ3BELE9BQU8sQ0FBQyxXQUFXO0FBQUEsVUFDbkIsYUFBYTtBQUFBLFFBQ2pCLENBQUM7QUFFRCxtQ0FBMkI7QUFFM0IseUJBQWlCO0FBRWpCLGdCQUFRLElBQUksOEJBQThCO0FBQUEsTUFDOUMsQ0FBQztBQUFBLElBQ0w7QUFBQSxFQUNKOzs7QUM1RE8sTUFBTSxpQkFBTixjQUFpRSxPQUFlO0FBQUEsRUFFdkY7OztBQ0NPLE1BQU0sT0FBTztBQUFBLElBQ2hCLFNBQWU7QUFDWCxhQUFPLE1BQU0sYUFBYTtBQUMxQixhQUFPLE1BQU0sZ0JBQWdCO0FBQzdCLGFBQU8sS0FBSyxnQkFBZ0I7QUFFNUIsYUFBTyxLQUFLLE1BQU0sS0FBSyxZQUFZO0FBQUEsSUFDdkM7QUFBQSxFQUNKOzs7QUNWTyxNQUFNLGdCQUFnQjtBQUFBLElBQ3pCLFNBQWU7QUFDWCxZQUFNLFlBQWtDO0FBQUEsUUFDcEM7QUFBQSxRQUNBO0FBQUEsTUFDSjtBQUNBLGlCQUFXLFlBQVksV0FBVztBQUM5QixpQkFBUyxPQUFPO0FBQUEsTUFDcEI7QUFBQSxJQUNKO0FBQUEsRUFDSjs7O0FDWEEsZ0JBQWMsT0FBTzsiLAogICJuYW1lcyI6IFsiV2VhcG9uVHlwZSIsICJSYW5nZVR5cGUiLCAiU2tpbGxUeXBlIiwgImh0bWwiXQp9Cg==
