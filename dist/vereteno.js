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
      return ChatMessage.create(chatData);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL21vZHVsZS9pdGVtL2Jhc2Uvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL3BoeXNpY2FsLWl0ZW0vc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL2FybW9yL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvYmFzZS9kb2N1bWVudC50cyIsICIuLi9zcmMvbW9kdWxlL2RhdGEudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL3dlYXBvbi9kYXRhLnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvY3JlYXR1cmUvZG9jdW1lbnQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9jaGFyYWN0ZXIvZG9jdW1lbnQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9tb25zdGVyL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvbnBjL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9iYXNlL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9waHlzaWNhbC1pdGVtL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9hcm1vci9kb2N1bWVudC50cyIsICIuLi9zcmMvY29tbW9uLnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS93ZWFwb24vZG9jdW1lbnQudHMiLCAiLi4vc3JjL3ZlcmV0ZW5vQ29uZmlnLnRzIiwgIi4uL3NyYy9wYXJ0aWFscy50cyIsICIuLi9zcmMvbW9kdWxlL2l0ZW0vd2VhcG9uL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvYmFzZS9zaGVldC50cyIsICIuLi9zcmMvbW9kdWxlL3N5c3RlbS9yb2xsLnRzIiwgIi4uL3NyYy9tb2R1bGUvdXRpbHMvdmVyZXRlbm8tcm9sbGVyLnRzIiwgIi4uL3NyYy9tb2R1bGUvZGlhbG9nL3JvbGwtZGlhbG9nLnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvY3JlYXR1cmUvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9jaGFyYWN0ZXIvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9tb25zdGVyL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvbnBjL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvc3lzdGVtL3NldHRpbmdzL2luZGV4LnRzIiwgIi4uL3NyYy9tb2R1bGUvc3lzdGVtL3NldHRpbmdzL2NsaWVudC1zZXR0aW5ncy50cyIsICIuLi9zcmMvbW9kdWxlL2l0ZW0vZXF1aXBtZW50L3NoZWV0LnRzIiwgIi4uL3NyYy9zY3JpcHRzL2hvb2tzL2luaXQudHMiLCAiLi4vc3JjL21vZHVsZS9jb2xsZWN0aW9uL2FjdG9ycy50cyIsICIuLi9zcmMvc2NyaXB0cy9ob29rcy9sb2FkLnRzIiwgIi4uL3NyYy9zY3JpcHRzL2hvb2tzL2luZGV4LnRzIiwgIi4uL3NyYy92ZXJldGVuby50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0sIFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIuLi9pbmRleFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9JdGVtU2hlZXQ8VEl0ZW0gZXh0ZW5kcyBWZXJldGVub0l0ZW0+IGV4dGVuZHMgSXRlbVNoZWV0PFRJdGVtPiB7XHJcbiAgICBnZXQgaXRlbURhdGEoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbS5kYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBpdGVtUHJvcGVydGllcygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pdGVtLnN5c3RlbTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0IGRlZmF1bHRPcHRpb25zKCkge1xyXG4gICAgICAgIGNvbnN0IGlzUnVzc2lhbkxhbmd1YWdlID0gZ2FtZS5zZXR0aW5ncy5nZXQoXCJjb3JlXCIsIFwibGFuZ3VhZ2VcIikgPT0gJ3J1JztcclxuXHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IG1lcmdlT2JqZWN0KHN1cGVyLmRlZmF1bHRPcHRpb25zLCB7XHJcbiAgICAgICAgICAgIHdpZHRoOiA1NjAsXHJcbiAgICAgICAgICAgIGNsYXNzZXM6IFsndmVyZXRlbm8nLCAnaXRlbScsICdzaGVldCddXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYoaXNSdXNzaWFuTGFuZ3VhZ2Upe1xyXG4gICAgICAgICAgICBvcHRpb25zLmNsYXNzZXMucHVzaChcImxhbmctcnVcIilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvcHRpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB0ZW1wbGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gYHN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9pdGVtcy8ke3RoaXMuaXRlbS50eXBlfS1zaGVldC5oYnNgO1xyXG4gICAgfVxyXG5cclxuICAgIG92ZXJyaWRlIGFzeW5jIGdldERhdGEob3B0aW9uczogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4gPSB7fSk6IFByb21pc2U8VmVyZXRlbm9JdGVtU2hlZXREYXRhPFRJdGVtPj4ge1xyXG4gICAgICAgIG9wdGlvbnMuaWQgPSB0aGlzLmlkO1xyXG4gICAgICAgIG9wdGlvbnMuZWRpdGFibGUgPSB0aGlzLmlzRWRpdGFibGU7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgaXRlbSB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgLy8gRW5yaWNoIGNvbnRlbnRcclxuICAgICAgICBjb25zdCBlbnJpY2hlZENvbnRlbnQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcclxuICAgICAgICBjb25zdCByb2xsRGF0YSA9IHsgLi4udGhpcy5pdGVtLmdldFJvbGxEYXRhKCksIC4uLnRoaXMuYWN0b3I/LmdldFJvbGxEYXRhKCkgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgaXRlbVR5cGU6IG51bGwsXHJcbiAgICAgICAgICAgIGl0ZW06IGl0ZW0sXHJcbiAgICAgICAgICAgIGRhdGE6IGl0ZW0uc3lzdGVtLFxyXG4gICAgICAgICAgICBpc1BoeXNpY2FsOiBmYWxzZSxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uRGVzY3JpcHRpb24sXHJcbiAgICAgICAgICAgIGNzc0NsYXNzOiB0aGlzLmlzRWRpdGFibGUgPyBcImVkaXRhYmxlXCIgOiBcImxvY2tlZFwiLFxyXG4gICAgICAgICAgICBlZGl0YWJsZTogdGhpcy5pc0VkaXRhYmxlLFxyXG4gICAgICAgICAgICBkb2N1bWVudDogaXRlbSxcclxuICAgICAgICAgICAgbGltaXRlZDogdGhpcy5pdGVtLmxpbWl0ZWQsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHRoaXMub3B0aW9ucyxcclxuICAgICAgICAgICAgb3duZXI6IHRoaXMuaXRlbS5pc093bmVyLFxyXG4gICAgICAgICAgICB0aXRsZTogdGhpcy50aXRsZSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBvdmVycmlkZSBhc3luYyBfdXBkYXRlT2JqZWN0KGV2ZW50OiBFdmVudCwgZm9ybURhdGE6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIHN1cGVyLl91cGRhdGVPYmplY3QoZXZlbnQsIGZvcm1EYXRhKTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vSXRlbVNoZWV0RGF0YTxUSXRlbSBleHRlbmRzIFZlcmV0ZW5vSXRlbT4gZXh0ZW5kcyBJdGVtU2hlZXREYXRhPFRJdGVtPiB7XHJcbiAgICBpdGVtVHlwZTogc3RyaW5nIHwgbnVsbDtcclxuICAgIGl0ZW06IFRJdGVtO1xyXG4gICAgZGF0YTogVEl0ZW1bXCJzeXN0ZW1cIl07XHJcbiAgICBpc1BoeXNpY2FsOiBib29sZWFuO1xyXG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcclxuICAgIC8vIHN5c3RlbTogVmVyZXRlbm9JdGVtU3lzdGVtRGF0YTtcclxufVxyXG5cclxuaW50ZXJmYWNlIEl0ZW1TaGVldE9wdGlvbnMgZXh0ZW5kcyBEb2N1bWVudFNoZWV0T3B0aW9ucyB7XHJcbiAgICBoYXNTaWRlYmFyOiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0l0ZW1TaGVldCB9O1xyXG5leHBvcnQgdHlwZSB7IFZlcmV0ZW5vSXRlbVNoZWV0RGF0YSwgSXRlbVNoZWV0T3B0aW9ucyB9OyIsICJpbXBvcnQgeyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIuLi9pbmRleFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW1TaGVldCwgVmVyZXRlbm9JdGVtU2hlZXREYXRhIH0gZnJvbSBcIi4uL2Jhc2Uvc2hlZXRcIjtcclxuXHJcbmNsYXNzIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldDxUSXRlbSBleHRlbmRzIFBoeXNpY2FsVmVyZXRlbm9JdGVtPiBleHRlbmRzIFZlcmV0ZW5vSXRlbVNoZWV0PFRJdGVtPiB7XHJcbiAgICBvdmVycmlkZSBhc3luYyBnZXREYXRhKG9wdGlvbnM/OiBQYXJ0aWFsPERvY3VtZW50U2hlZXRPcHRpb25zPik6IFByb21pc2U8UGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YTxUSXRlbT4+IHtcclxuICAgICAgICBjb25zdCBzaGVldERhdGEgPSBhd2FpdCBzdXBlci5nZXREYXRhKG9wdGlvbnMpO1xyXG4gICAgICAgIGNvbnN0IHsgaXRlbSB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgLi4uc2hlZXREYXRhLFxyXG4gICAgICAgICAgICBpc1BoeXNpY2FsOiB0cnVlLFxyXG4gICAgICAgICAgICB3ZWlnaHQ6IGl0ZW0ud2VpZ2h0LFxyXG4gICAgICAgICAgICBwcmljZTogaXRlbS5wcmljZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGE8VEl0ZW0gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbT4gZXh0ZW5kcyBWZXJldGVub0l0ZW1TaGVldERhdGE8VEl0ZW0+IHtcclxuICAgIGlzUGh5c2ljYWw6IHRydWU7XHJcbiAgICB3ZWlnaHQ6IG51bWJlcjtcclxuICAgIHByaWNlOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldCB9O1xyXG5leHBvcnQgdHlwZSB7IFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGEgfTsiLCAiaW1wb3J0IHsgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0LCBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXREYXRhIH0gZnJvbSBcIi4uL3BoeXNpY2FsLWl0ZW0vc2hlZXRcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9Bcm1vciB9IGZyb20gXCIuL2RvY3VtZW50XCI7XHJcblxyXG5jbGFzcyBWZXJldGVub0FybW9yU2hlZXQgZXh0ZW5kcyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQ8VmVyZXRlbm9Bcm1vcj4ge1xyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zPzogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4pOiBQcm9taXNlPFZlcmV0ZW5vQXJtb3JTaGVldERhdGE+IHtcclxuICAgICAgICBjb25zdCBzaGVldERhdGEgPSBhd2FpdCBzdXBlci5nZXREYXRhKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW0gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogVmVyZXRlbm9Bcm1vclNoZWV0RGF0YSA9IHtcclxuICAgICAgICAgICAgLi4uc2hlZXREYXRhLFxyXG4gICAgICAgICAgICBhcm1vckNsYXNzOiBpdGVtLmFybW9yQ2xhc3MsXHJcbiAgICAgICAgICAgIHF1YWxpdHk6IGl0ZW0ucXVhbGl0eSxcclxuICAgICAgICAgICAgZHVyYWJpbGl0eTogaXRlbS5kdXJhYmlsaXR5LFxyXG4gICAgICAgICAgICBtYXhEdXJhYmlsaXR5OiBpdGVtLm1heER1YXJhYmlsaXR5LFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRlbXBsYXRlKCkge1xyXG4gICAgICAgIHJldHVybiBgc3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL2l0ZW1zL2FybW9yLXNoZWV0Lmhic2A7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0FybW9yU2hlZXREYXRhIGV4dGVuZHMgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YTxWZXJldGVub0FybW9yPiB7XHJcbiAgICBhcm1vckNsYXNzOiBudW1iZXI7XHJcbiAgICBxdWFsaXR5OiBudW1iZXI7XHJcbiAgICBkdXJhYmlsaXR5OiBudW1iZXI7XHJcbiAgICBtYXhEdXJhYmlsaXR5OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQXJtb3JTaGVldCB9O1xyXG5leHBvcnQgdHlwZSB7IFZlcmV0ZW5vQXJtb3JTaGVldERhdGEgfTsiLCAiaW1wb3J0IHsgVmVyZXRlbm9BY3RvclNvdXJjZSwgVmVyZXRlbm9BY3RvclN5c3RlbURhdGEgfSBmcm9tIFwiLi9kYXRhXCI7XHJcblxyXG5jbGFzcyBWZXJldGVub0FjdG9yPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIEFjdG9yPFRQYXJlbnQ+e1xyXG4gICAgZ2V0IERlc2NyaXB0aW9uKCk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnN5c3RlbS5kZXNjcmlwdGlvbiB8fCAnJykudHJpbSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9BY3RvcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBBY3RvcjxUUGFyZW50PiB7XHJcbiAgICBjb25zdHJ1Y3RvcjogdHlwZW9mIFZlcmV0ZW5vQWN0b3I7XHJcbiAgICBzeXN0ZW06IFZlcmV0ZW5vQWN0b3JTeXN0ZW1EYXRhO1xyXG5cclxuICAgIERlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IFZlcmV0ZW5vQWN0b3JQcm94eSA9IG5ldyBQcm94eShWZXJldGVub0FjdG9yLCB7XHJcbiAgICBjb25zdHJ1Y3QoXHJcbiAgICAgICAgX3RhcmdldCxcclxuICAgICAgICBhcmdzOiBbc291cmNlOiBQcmVDcmVhdGU8VmVyZXRlbm9BY3RvclNvdXJjZT4sIGNvbnRleHQ/OiBEb2N1bWVudENvbnN0cnVjdGlvbkNvbnRleHQ8VmVyZXRlbm9BY3RvcltcInBhcmVudFwiXT5dLFxyXG4gICAgKSB7XHJcbiAgICAgICAgY29uc3Qgc291cmNlID0gYXJnc1swXTtcclxuICAgICAgICBjb25zdCB0eXBlID0gc291cmNlPy50eXBlO1xyXG4gICAgICAgIHJldHVybiBuZXcgQ09ORklHLlZFUkVURU5PLkFjdG9yLmRvY3VtZW50Q2xhc3Nlc1t0eXBlXSguLi5hcmdzKTtcclxuICAgIH0sXHJcbn0pO1xyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9BY3RvciwgVmVyZXRlbm9BY3RvclByb3h5IH07IiwgImludGVyZmFjZSBJZExhYmVsVHlwZTxUPiB7XHJcbiAgICBpZDogbnVtYmVyO1xyXG4gICAgbGFiZWw6IHN0cmluZztcclxuICAgIHR5cGU6IFQ7XHJcbn1cclxuXHJcbmNsYXNzIFZlcmV0ZW5vUm9sbE9wdGlvbnMge1xyXG4gICAgdHlwZTogVmVyZXRlbm9Sb2xsVHlwZSA9IFZlcmV0ZW5vUm9sbFR5cGUuUmVndWxhcjtcclxuICAgIG1lc3NhZ2VEYXRhOiBWZXJldGVub01lc3NhZ2VEYXRhID0gbmV3IFZlcmV0ZW5vTWVzc2FnZURhdGEoKTtcclxuICAgIHJvbGxEYXRhOiBWZXJldGVub1JvbGxEYXRhID0gbmV3IFZlcmV0ZW5vUm9sbERhdGEoKTtcclxufVxyXG5lbnVtIFZlcmV0ZW5vUm9sbFR5cGUge1xyXG4gICAgTm9uZSA9ICdub25lJyxcclxuICAgIFJlZ3VsYXIgPSAncmVndWxhcicsXHJcbiAgICBBcm1vckJsb2NrID0gJ2FybW9yLWJsb2NrJyxcclxuICAgIEF0dGFjayA9ICdhdHRhY2snLFxyXG4gICAgSW5pdGlhdGl2ZSA9ICdpbml0aWF0aXZlJyxcclxuICAgIERlc3BlcmF0aW9uID0gJ2Rlc3BlcmF0aW9uJ1xyXG59XHJcblxyXG5jbGFzcyBWZXJldGVub01lc3NhZ2VEYXRhIGltcGxlbWVudHMgUm9sbE9wdGlvbnMge1xyXG4gICAgW2luZGV4OiBzdHJpbmddOiBhbnk7XHJcbiAgICB1c2VySWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcclxuICAgIHNwZWFrZXI6IGFueSA9IHt9O1xyXG4gICAgZmxhdm9yOiBzdHJpbmcgPSAnJztcclxuICAgIHNvdW5kOiBhbnkgfCBudWxsID0gbnVsbDtcclxuICAgIGJsaW5kOiBib29sZWFuID0gZmFsc2VcclxufVxyXG5cclxuY2xhc3MgVmVyZXRlbm9Sb2xsRGF0YSB7XHJcbiAgICBkaWNlOiBzdHJpbmcgPSAnZDIwJztcclxuICAgIHBvb2w6IG51bWJlciA9IDE7XHJcbiAgICBib251czogbnVtYmVyID0gMDtcclxuICAgIGlzU2VyaWFsOiBib29sZWFuID0gZmFsc2U7XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub1JvbGxEYXRhIHtcclxuICAgIGRpY2U6IHN0cmluZztcclxuICAgIHBvb2w6IG51bWJlcjtcclxuICAgIGJvbnVzOiBudW1iZXI7XHJcbiAgICBpc1NlcmlhbDogYm9vbGVhbjtcclxufVxyXG5cclxuY2xhc3MgVmVyZXRlbm9DaGF0T3B0aW9ucyB7XHJcbiAgICBpc0JsaW5kOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBzaG93RGlhbG9nOiBib29sZWFuID0gZmFsc2U7XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0NoYXRPcHRpb25zIHtcclxuICAgIGlzQmxpbmQ6IGJvb2xlYW47XHJcbiAgICBzaG93RGlhbG9nOiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSB7IElkTGFiZWxUeXBlIH1cclxuZXhwb3J0IHR5cGUgeyBWZXJldGVub1JvbGxPcHRpb25zLCBWZXJldGVub01lc3NhZ2VEYXRhIH1cclxuZXhwb3J0IHsgVmVyZXRlbm9Sb2xsVHlwZSwgVmVyZXRlbm9Sb2xsRGF0YSwgVmVyZXRlbm9DaGF0T3B0aW9ucyB9IiwgImltcG9ydCB7IFNraWxsVHlwZSB9IGZyb20gXCIkY29tbW9uXCI7XHJcbmltcG9ydCB7IEJhc2VQaHlzaWNhbEl0ZW1Tb3VyY2UsIFBoeXNpY2FsU3lzdGVtU291cmNlLCBQaHlzaWNhbFZlcmV0ZW5vSXRlbVN5c3RlbURhdGEgfSBmcm9tIFwiLi4vcGh5c2ljYWwtaXRlbS9kYXRhXCI7XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9XZWFwb25TeXN0ZW1EYXRhIGV4dGVuZHMgUGh5c2ljYWxWZXJldGVub0l0ZW1TeXN0ZW1EYXRhIHtcclxuICAgIG1vZGlmaWVyOiBudW1iZXI7XHJcbiAgICBkYW1hZ2U6IG51bWJlcjtcclxuICAgIGluaXRpYXRpdmU6IG51bWJlcjtcclxuICAgIGNyaXQ6IG51bWJlcjtcclxuICAgIHdlYXBvblR5cGU6IFdlYXBvblR5cGUsXHJcbiAgICBhdHRhY2tXaXRoOiBTa2lsbFR5cGUsXHJcbiAgICByYW5nZTogUmFuZ2VUeXBlLFxyXG4gICAgaGFzQnVyc3Q6IGJvb2xlYW5cclxufVxyXG5cclxudHlwZSBXZWFwb25Tb3VyY2UgPSBCYXNlUGh5c2ljYWxJdGVtU291cmNlPFwid2VhcG9uXCIsIFdlYXBvblN5c3RlbVNvdXJjZT47XHJcblxyXG5pbnRlcmZhY2UgV2VhcG9uU3lzdGVtU291cmNlIGV4dGVuZHMgUGh5c2ljYWxTeXN0ZW1Tb3VyY2Uge1xyXG4gICAgbW9kaWZpZXI6IG51bWJlcjtcclxuICAgIGRhbWFnZTogbnVtYmVyO1xyXG4gICAgaW5pdGlhdGl2ZTogbnVtYmVyO1xyXG4gICAgY3JpdDogbnVtYmVyO1xyXG4gICAgd2VhcG9uVHlwZTogV2VhcG9uVHlwZSxcclxuICAgIGF0dGFja1dpdGg6IFNraWxsVHlwZSxcclxuICAgIHJhbmdlOiBSYW5nZVR5cGUsXHJcbiAgICBoYXNCdXJzdDogYm9vbGVhblxyXG59XHJcblxyXG5lbnVtIFdlYXBvblR5cGUge1xyXG4gICAgTm9uZSA9IFwibm9uZVwiLFxyXG4gICAgQnJhd2xpbmcgPSBcImJyYXdsaW5nXCIsXHJcbiAgICBNZWxlZSA9IFwibWVsZWVcIixcclxuICAgIFJhbmdlZCA9IFwicmFuZ2VkXCJcclxufVxyXG5cclxuZW51bSBSYW5nZVR5cGUge1xyXG4gICAgTm9uZSA9IFwibm9uZVwiLFxyXG4gICAgUG9pbnRCbGFuayA9IFwicG9pbnRCbGFua1wiLFxyXG4gICAgQ2xvc2UgPSBcImNsb3NlXCIsXHJcbiAgICBNZWRpdW0gPSBcIm1lZGl1bVwiLFxyXG4gICAgTG9uZyA9IFwibG9uZ1wiLFxyXG4gICAgVXRtb3N0ID0gXCJ1dG1vc3RcIlxyXG59XHJcblxyXG5lbnVtIEF0dGFja1R5cGUge1xyXG4gICAgTm9uZSA9IFwibm9uZVwiLFxyXG4gICAgUmVndWxhciA9IFwicmVndWxhclwiLFxyXG4gICAgUG93ZXIgPSBcInBvd2VyXCIsXHJcbiAgICBMaWdodCA9IFwibGlnaHRcIixcclxuICAgIEFpbWVkID0gXCJhaW1lZFwiLFxyXG4gICAgSGlwID0gXCJoaXBcIixcclxuICAgIEJ1cnN0ID0gXCJidXJzdFwiXHJcbn1cclxuXHJcbmV4cG9ydCB7IFdlYXBvblR5cGUsIFJhbmdlVHlwZSwgQXR0YWNrVHlwZSB9XHJcbmV4cG9ydCB7IFZlcmV0ZW5vV2VhcG9uU3lzdGVtRGF0YSwgV2VhcG9uU291cmNlIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9Sb2xsRGF0YSB9IGZyb20gXCIkbW9kdWxlL2RhdGFcIjtcclxuaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0sIFZlcmV0ZW5vQXJtb3IsIFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIkbW9kdWxlL2l0ZW1cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtVHlwZSB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vYmFzZS9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vRXF1aXBtZW50IH0gZnJvbSBcIiRtb2R1bGUvaXRlbS9lcXVpcG1lbnQvZG9jdW1lbnRcIjtcclxuaW1wb3J0IHsgQXR0YWNrVHlwZSwgV2VhcG9uVHlwZSB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vd2VhcG9uL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9XZWFwb24gfSBmcm9tIFwiJG1vZHVsZS9pdGVtL3dlYXBvbi9kb2N1bWVudFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcbmltcG9ydCB7IEF0dHJpYnV0ZXNCbG9jaywgU2tpbGxzQmxvY2ssIFN0YXRzQmxvY2ssIFZlcmV0ZW5vQ3JlYXR1cmVTeXN0ZW1EYXRhLCBXZWFwb25BdHRhY2tJbmZvIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9DcmVhdHVyZTxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0FjdG9yPFRQYXJlbnQ+e1xyXG4gICAgZ2V0IFN0YXRzKCk6IFN0YXRzQmxvY2sge1xyXG4gICAgICAgIGNvbnN0IGhwID0gdGhpcy5zeXN0ZW0uc3RhdHMuaGl0UG9pbnRzLnZhbHVlO1xyXG4gICAgICAgIGlmIChocCA+IHRoaXMuTWF4SHApIHtcclxuICAgICAgICAgICAgdGhpcy5zeXN0ZW0uc3RhdHMuaGl0UG9pbnRzLnZhbHVlID0gdGhpcy5NYXhIcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHdwID0gdGhpcy5zeXN0ZW0uc3RhdHMud2lsbFBvaW50cy52YWx1ZTtcclxuICAgICAgICBpZiAod3AgPiB0aGlzLk1heFdwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3lzdGVtLnN0YXRzLndpbGxQb2ludHMudmFsdWUgPSB0aGlzLk1heFdwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLnN0YXRzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBBdHRyaWJ1dGVzKCk6IEF0dHJpYnV0ZXNCbG9jayB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmF0dHJpYnV0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IFNraWxscygpOiBTa2lsbHNCbG9jayB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLnNraWxscztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgTWF4SHAoKTogbnVtYmVyIHtcclxuICAgICAgICBjb25zdCBjb25zdGl0dXRpb25WYWx1ZSA9IHRoaXMuQXR0cmlidXRlcy5jb25zdGl0dXRpb24udmFsdWU7XHJcbiAgICAgICAgY29uc3QgZGV4dGVyaXR5VmFsdWUgPSB0aGlzLkF0dHJpYnV0ZXMuZGV4dGVyaXR5LnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IGJvbnVzZXMgPSAwO1xyXG5cclxuICAgICAgICByZXR1cm4gY29uc3RpdHV0aW9uVmFsdWUgKyBkZXh0ZXJpdHlWYWx1ZSArIGJvbnVzZXM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IE1heFdwKCk6IG51bWJlciB7XHJcbiAgICAgICAgY29uc3QgaW50ZWxsaWdlbmNlVmFsdWUgPSB0aGlzLkF0dHJpYnV0ZXMuaW50ZWxsaWdlbmNlLnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IGVtcGF0aHlWYWx1ZSA9IHRoaXMuQXR0cmlidXRlcy5lbXBhdGh5LnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IGJvbnVzZXMgPSAwO1xyXG5cclxuICAgICAgICByZXR1cm4gaW50ZWxsaWdlbmNlVmFsdWUgKyBlbXBhdGh5VmFsdWUgKyBib251c2VzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHUwNDE4XHUwNDNDXHUwNDM1XHUwNDRFXHUwNDQ5XHUwNDM1XHUwNDM1XHUwNDQxXHUwNDRGIFx1MDQzRVx1MDQ0MFx1MDQ0M1x1MDQzNlx1MDQzOFx1MDQzNS5cclxuICAgICAqL1xyXG4gICAgZ2V0IFdlYXBvbnMoKTogVmVyZXRlbm9XZWFwb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXMubWFwKHggPT4geCBhcyB1bmtub3duIGFzIFZlcmV0ZW5vSXRlbSkuZmlsdGVyKHggPT4geC50eXBlID09IFZlcmV0ZW5vSXRlbVR5cGUuV2VhcG9uKS5tYXAoeCA9PiB4IGFzIFZlcmV0ZW5vV2VhcG9uKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFx1MDQyRFx1MDQzQVx1MDQzOFx1MDQzRlx1MDQzOFx1MDQ0MFx1MDQzRVx1MDQzMlx1MDQzMFx1MDQzRFx1MDQzRFx1MDQzRVx1MDQzNSBcdTA0M0VcdTA0NDBcdTA0NDNcdTA0MzZcdTA0MzhcdTA0MzUuXHJcbiAgICAgKi9cclxuICAgIGdldCBFcXVpcHBlZFdlYXBvbnMoKTogVmVyZXRlbm9XZWFwb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuV2VhcG9ucy5maWx0ZXIoeCA9PiB4LnN5c3RlbS5pc0VxdWlwcGVkKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFx1MDQxOFx1MDQzQ1x1MDQzNVx1MDQ0RVx1MDQ0OVx1MDQzMFx1MDQ0Rlx1MDQ0MVx1MDQ0RiBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0NEYuXHJcbiAgICAgKi9cclxuICAgIGdldCBBcm1vcnMoKTogVmVyZXRlbm9Bcm1vcltdIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pdGVtcy5tYXAoeCA9PiB4IGFzIHVua25vd24gYXMgVmVyZXRlbm9JdGVtKS5maWx0ZXIoeCA9PiB4LnR5cGUgPT0gVmVyZXRlbm9JdGVtVHlwZS5Bcm1vcikubWFwKHggPT4geCBhcyBWZXJldGVub0FybW9yKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFx1MDQyRFx1MDQzQVx1MDQzOFx1MDQzRlx1MDQzOFx1MDQ0MFx1MDQzRVx1MDQzMlx1MDQzMFx1MDQzRFx1MDQzRFx1MDQzMFx1MDQ0RiBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0NEYuXHJcbiAgICAgKi9cclxuICAgIGdldCBFcXVpcHBlZEFybW9yKCk6IFZlcmV0ZW5vQXJtb3Ige1xyXG4gICAgICAgIHJldHVybiB0aGlzLkFybW9ycy5maWx0ZXIoeCA9PiB4LnN5c3RlbS5pc0VxdWlwcGVkKVswXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBJdGVtcygpOiBWZXJldGVub0VxdWlwbWVudFtdIHtcclxuICAgICAgICBsZXQgaXRlbXMgPSB0aGlzLml0ZW1zLm1hcCh4ID0+IHggYXMgdW5rbm93biBhcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSk7XHJcblxyXG4gICAgICAgIGl0ZW1zID0gaXRlbXNcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICF0aGlzLkFybW9ycy5maW5kKGEgPT4gYS5pZCA9PSB4LmlkKSlcclxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICF0aGlzLldlYXBvbnMuZmluZCh3ID0+IHcuaWQgPT0geC5pZCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gaXRlbXM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IEVxdWlwcGVkSXRlbXMoKTogVmVyZXRlbm9FcXVpcG1lbnRbXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuSXRlbXMuZmlsdGVyKHggPT4geC5zeXN0ZW0uaXNFcXVpcHBlZCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2V0QXR0cmlidXRlUm9sbERhdGEoa2V5OiBzdHJpbmcpOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERhdGE+IHtcclxuICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSB0aGlzLkF0dHJpYnV0ZXNba2V5XTtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGF0YSgpO1xyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGUudmFsdWU7XHJcbiAgICAgICAgY29uc3QgYm9udXNlcyA9IDA7XHJcbiAgICAgICAgcmVzdWx0LnBvb2wgPSB2YWx1ZSArIGJvbnVzZXM7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2V0U2tpbGxSb2xsRGF0YShrZXk6IHN0cmluZyk6IFByb21pc2U8VmVyZXRlbm9Sb2xsRGF0YT4ge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNraWxsID0gdGhpcy5Ta2lsbHNba2V5XTtcclxuICAgICAgICBpZiAoc2tpbGwgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgYXR0cmlidXRlUm9sbERhdGEgPSBhd2FpdCB0aGlzLmdldEF0dHJpYnV0ZVJvbGxEYXRhKHNraWxsLmF0dHJpYnV0ZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gc2tpbGwudmFsdWU7XHJcbiAgICAgICAgY29uc3QgYm9udXNlcyA9IDA7XHJcbiAgICAgICAgcmVzdWx0LnBvb2wgPSBhdHRyaWJ1dGVSb2xsRGF0YS5wb29sICsgdmFsdWUgKyBib251c2VzO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGdldFdlYXBvblJvbGxEYXRhKHdlYXBvbkRhdGE6IFdlYXBvbkF0dGFja0luZm8pOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERhdGE+IHtcclxuICAgICAgICBsZXQgaXRlbSA9IHRoaXMuaXRlbXMuZ2V0KHdlYXBvbkRhdGEuaWQpIGFzIHVua25vd24gYXMgVmVyZXRlbm9XZWFwb247XHJcblxyXG4gICAgICAgIGxldCBpdGVtU2tpbGwgPSBpdGVtLnN5c3RlbS5hdHRhY2tXaXRoO1xyXG4gICAgICAgIGxldCBza2lsbFJvbGxEYXRhID0gYXdhaXQgdGhpcy5nZXRTa2lsbFJvbGxEYXRhKGl0ZW1Ta2lsbCk7XHJcblxyXG4gICAgICAgIGxldCB3ZWFwb25BdHRhY2tUeXBlTW9kaWZpZXIgPSB0aGlzLmdldFdlYXBvbkF0dGFja1R5cGVNb2RpZmllcih3ZWFwb25EYXRhKTtcclxuXHJcbiAgICAgICAgbGV0IHdlYXBvbkF0dGFja01vZGlmaWVyID0gaXRlbS5zeXN0ZW0ubW9kaWZpZXI7XHJcblxyXG4gICAgICAgIGxldCB3ZWFwb25EYW1hZ2UgPSBpdGVtLnN5c3RlbS5kYW1hZ2U7XHJcblxyXG4gICAgICAgIGNvbnN0IHJvbGxEYXRhOiBWZXJldGVub1JvbGxEYXRhID0gbWVyZ2VPYmplY3Qoc2tpbGxSb2xsRGF0YSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcG9vbDogc2tpbGxSb2xsRGF0YS5wb29sICsgd2VhcG9uQXR0YWNrVHlwZU1vZGlmaWVyICsgd2VhcG9uQXR0YWNrTW9kaWZpZXIsXHJcbiAgICAgICAgICAgICAgICB3ZWFwb25EYW1hZ2UsXHJcbiAgICAgICAgICAgICAgICB3ZWFwb25BdHRhY2tNb2RpZmllclxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHdlYXBvbkRhdGEuYXR0YWNrVHlwZSA9PSBBdHRhY2tUeXBlLkJ1cnN0KSB7XHJcbiAgICAgICAgICAgIHJvbGxEYXRhLmlzU2VyaWFsID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByb2xsRGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRXZWFwb25BdHRhY2tUeXBlTW9kaWZpZXIod2VhcG9uRGF0YTogV2VhcG9uQXR0YWNrSW5mbyk6IG51bWJlciB7XHJcbiAgICAgICAgaWYgKHdlYXBvbkRhdGEud2VhcG9uVHlwZSA9PSBXZWFwb25UeXBlLk1lbGVlIHx8IHdlYXBvbkRhdGEud2VhcG9uVHlwZSA9PSBXZWFwb25UeXBlLkJyYXdsaW5nKSB7XHJcbiAgICAgICAgICAgIGlmICh3ZWFwb25EYXRhLmF0dGFja1R5cGUgPT0gQXR0YWNrVHlwZS5Qb3dlcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh3ZWFwb25EYXRhLmF0dGFja1R5cGUgPT0gQXR0YWNrVHlwZS5MaWdodCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0yO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh3ZWFwb25EYXRhLndlYXBvblR5cGUgPT0gV2VhcG9uVHlwZS5SYW5nZWQpIHtcclxuICAgICAgICAgICAgaWYgKHdlYXBvbkRhdGEuYXR0YWNrVHlwZSA9PSBBdHRhY2tUeXBlLkFpbWVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHdlYXBvbkRhdGEuYXR0YWNrVHlwZSA9PSBBdHRhY2tUeXBlLkhpcCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0yO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAod2VhcG9uRGF0YS5hdHRhY2tUeXBlID09IEF0dGFja1R5cGUuQnVyc3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBnZXRBcm1vclJvbGxEYXRhKGl0ZW1JZDogc3RyaW5nKTogUHJvbWlzZTxWZXJldGVub1JvbGxEYXRhIHwgbnVsbD4ge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcbiAgICAgICAgbGV0IGl0ZW0gPSAodGhpcy5pdGVtcy5nZXQoaXRlbUlkKSBhcyB1bmtub3duIGFzIFZlcmV0ZW5vQXJtb3IpO1xyXG5cclxuICAgICAgICBpZiAoIWl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXN1bHQucG9vbCA9IGl0ZW0uc3lzdGVtLmR1cmFiaWxpdHlcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBnZXRJbml0aWF0aXZlUm9sbERhdGEoaXRlbUlkOiBzdHJpbmcpOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERhdGE+IHtcclxuICAgICAgICBsZXQgaXRlbSA9ICh0aGlzLml0ZW1zLmdldChpdGVtSWQpIGFzIHVua25vd24gYXMgVmVyZXRlbm9XZWFwb24pO1xyXG5cclxuICAgICAgICBsZXQgc2tpbGwgPSB0aGlzLlNraWxscy5hZ2lsaXR5O1xyXG5cclxuICAgICAgICBsZXQgYm9udXNlcyA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcbiAgICAgICAgcmVzdWx0LnBvb2wgPSAxO1xyXG4gICAgICAgIHJlc3VsdC5ib251cyA9IHNraWxsLnZhbHVlICsgaXRlbS5zeXN0ZW0ubW9kaWZpZXIgKyBib251c2VzO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGVxdWlwV2VhcG9uKCkgeyB9XHJcblxyXG4gICAgYXN5bmMgZXF1aXBBcm1vcigpIHsgfVxyXG5cclxuICAgIGFzeW5jIHVuZXF1aXBJdGVtKCkgeyB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQWN0b3I8VFBhcmVudD4ge1xyXG4gICAgc3lzdGVtOiBWZXJldGVub0NyZWF0dXJlU3lzdGVtRGF0YSxcclxuICAgIFN0YXRzOiBTdGF0c0Jsb2NrO1xyXG4gICAgQXR0cmlidXRlczogQXR0cmlidXRlc0Jsb2NrO1xyXG4gICAgU2tpbGxzOiBTa2lsbHNCbG9jaztcclxuICAgIE1heEhwOiBudW1iZXI7XHJcbiAgICBNYXhXcDogbnVtYmVyO1xyXG4gICAgV2VhcG9uczogVmVyZXRlbm9XZWFwb25bXTtcclxuICAgIEFybW9yczogVmVyZXRlbm9Bcm1vcltdO1xyXG4gICAgSXRlbXM6IFZlcmV0ZW5vRXF1aXBtZW50W107XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmUgfSIsICJpbXBvcnQgeyBWZXJldGVub0NyZWF0dXJlIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ2hhcmFjdGVyU3lzdGVtRGF0YSB9IGZyb20gXCIuL2RhdGFcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vQ2hhcmFjdGVyPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudD57XHJcbiAgICBnZXQgTW9uZXkoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ubW9uZXkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgUmVwdXRhdGlvbigpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5yZXB1dGF0aW9uIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IEV4cCgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5leHAgfHwgMDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQ2hhcmFjdGVyPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudD4ge1xyXG4gICAgc3lzdGVtOiBWZXJldGVub0NoYXJhY3RlclN5c3RlbURhdGE7XHJcblxyXG4gICAgTW9uZXk6IG51bWJlcjtcclxuICAgIFJlcHV0YXRpb246IG51bWJlcjtcclxuICAgIEV4cDogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0NoYXJhY3RlciB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmUgfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vTW9uc3RlcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQ+e1xyXG5cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vTW9uc3RlcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQ+IHtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vTW9uc3RlciB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmUgfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vTnBjPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudD57XHJcblxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9OcGM8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZTxUUGFyZW50PiB7XHJcblxyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub05wYyB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3IgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW1Tb3VyY2UsIFZlcmV0ZW5vSXRlbVN5c3RlbURhdGEgfSBmcm9tIFwiLi9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vSXRlbVNoZWV0IH0gZnJvbSBcIi4vc2hlZXRcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vSXRlbTxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBJdGVtPFRQYXJlbnQ+e1xyXG4gICAgZ2V0IGRhdGEoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucHJlcGFyZURhdGEoKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgRGVzY3JpcHRpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnN5c3RlbS5kZXNjcmlwdGlvbiB8fCAnJykudHJpbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBLZWVwIGBUZXh0RWRpdG9yYCBhbmQgYW55dGhpbmcgZWxzZSB1cCB0byBubyBnb29kIGZyb20gc2V0dGluZyB0aGlzIGl0ZW0ncyBkZXNjcmlwdGlvbiB0byBgbnVsbGAgKi9cclxuICAgIHByb3RlY3RlZCBvdmVycmlkZSBhc3luYyBfcHJlVXBkYXRlKFxyXG4gICAgICAgIGNoYW5nZWQ6IERlZXBQYXJ0aWFsPHRoaXNbXCJfc291cmNlXCJdPixcclxuICAgICAgICBvcHRpb25zOiBEb2N1bWVudFVwZGF0ZUNvbnRleHQ8VFBhcmVudD4sXHJcbiAgICAgICAgdXNlcjogVXNlcixcclxuICAgICk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcclxuICAgICAgICByZXR1cm4gc3VwZXIuX3ByZVVwZGF0ZShjaGFuZ2VkLCBvcHRpb25zLCB1c2VyKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqIFJlZnJlc2ggdGhlIEl0ZW0gRGlyZWN0b3J5IGlmIHRoaXMgaXRlbSBpc24ndCBlbWJlZGRlZCAqL1xyXG4gICAgcHJvdGVjdGVkIG92ZXJyaWRlIF9vblVwZGF0ZShcclxuICAgICAgICBkYXRhOiBEZWVwUGFydGlhbDx0aGlzW1wiX3NvdXJjZVwiXT4sXHJcbiAgICAgICAgb3B0aW9uczogRG9jdW1lbnRNb2RpZmljYXRpb25Db250ZXh0PFRQYXJlbnQ+LFxyXG4gICAgICAgIHVzZXJJZDogc3RyaW5nLFxyXG4gICAgKTogdm9pZCB7XHJcbiAgICAgICAgc3VwZXIuX29uVXBkYXRlKGRhdGEsIG9wdGlvbnMsIHVzZXJJZCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0l0ZW08VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgSXRlbTxUUGFyZW50PiB7XHJcbiAgICBjb25zdHJ1Y3RvcjogdHlwZW9mIFZlcmV0ZW5vSXRlbTtcclxuICAgIHN5c3RlbTogVmVyZXRlbm9JdGVtU3lzdGVtRGF0YTtcclxuXHJcbiAgICBEZXNjcmlwdGlvbjogc3RyaW5nO1xyXG5cclxuICAgIF9zaGVldDogVmVyZXRlbm9JdGVtU2hlZXQ8dGhpcz4gfCBudWxsO1xyXG5cclxuICAgIGdldCBzaGVldCgpOiBWZXJldGVub0l0ZW1TaGVldDx0aGlzPjtcclxuXHJcbiAgICBwcmVwYXJlU2libGluZ0RhdGE/KHRoaXM6IFZlcmV0ZW5vSXRlbTxWZXJldGVub0FjdG9yPik6IHZvaWQ7XHJcbiAgICBwcmVwYXJlQWN0b3JEYXRhPyh0aGlzOiBWZXJldGVub0l0ZW08VmVyZXRlbm9BY3Rvcj4pOiB2b2lkO1xyXG4gICAgLyoqIE9wdGlvbmFsIGRhdGEtcHJlcGFyYXRpb24gY2FsbGJhY2sgZXhlY3V0ZWQgYWZ0ZXIgcnVsZS1lbGVtZW50IHN5bnRoZXRpY3MgYXJlIHByZXBhcmVkICovXHJcbiAgICBvblByZXBhcmVTeW50aGV0aWNzPyh0aGlzOiBWZXJldGVub0l0ZW08VmVyZXRlbm9BY3Rvcj4pOiB2b2lkO1xyXG5cclxuICAgIC8qKiBSZXR1cm5zIGl0ZW1zIHRoYXQgc2hvdWxkIGFsc28gYmUgYWRkZWQgd2hlbiB0aGlzIGl0ZW0gaXMgY3JlYXRlZCAqL1xyXG4gICAgY3JlYXRlR3JhbnRlZEl0ZW1zPyhvcHRpb25zPzogb2JqZWN0KTogUHJvbWlzZTxWZXJldGVub0l0ZW1bXT47XHJcblxyXG4gICAgLyoqIFJldHVybnMgaXRlbXMgdGhhdCBzaG91bGQgYWxzbyBiZSBkZWxldGVkIHNob3VsZCB0aGlzIGl0ZW0gYmUgZGVsZXRlZCAqL1xyXG4gICAgZ2V0TGlua2VkSXRlbXM/KCk6IFZlcmV0ZW5vSXRlbTxWZXJldGVub0FjdG9yPltdO1xyXG59XHJcblxyXG5jb25zdCBWZXJldGVub0l0ZW1Qcm94eSA9IG5ldyBQcm94eShWZXJldGVub0l0ZW0sIHtcclxuICAgIGNvbnN0cnVjdChcclxuICAgICAgICBfdGFyZ2V0LFxyXG4gICAgICAgIGFyZ3M6IFtzb3VyY2U6IFByZUNyZWF0ZTxWZXJldGVub0l0ZW1Tb3VyY2U+LCBjb250ZXh0PzogRG9jdW1lbnRDb25zdHJ1Y3Rpb25Db250ZXh0PFZlcmV0ZW5vQWN0b3IgfCBudWxsPl0sXHJcbiAgICApIHtcclxuICAgICAgICBjb25zdCBzb3VyY2UgPSBhcmdzWzBdO1xyXG4gICAgICAgIGNvbnN0IHR5cGUgPSBzb3VyY2U/LnR5cGU7XHJcbiAgICAgICAgY29uc3QgSXRlbUNsYXNzOiB0eXBlb2YgVmVyZXRlbm9JdGVtID0gQ09ORklHLlZFUkVURU5PLkl0ZW0uZG9jdW1lbnRDbGFzc2VzW3R5cGVdID8/IFZlcmV0ZW5vSXRlbTtcclxuICAgICAgICByZXR1cm4gbmV3IEl0ZW1DbGFzcyguLi5hcmdzKTtcclxuICAgIH0sXHJcbn0pO1xyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9JdGVtLCBWZXJldGVub0l0ZW1Qcm94eSB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3IgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW1TeXN0ZW1EYXRhIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgUGh5c2ljYWxWZXJldGVub0l0ZW08VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9JdGVtPFRQYXJlbnQ+IHtcclxuICAgIGdldCB3ZWlnaHQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLndlaWdodCB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBwcmljZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ucHJpY2UgfHwgMDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFBoeXNpY2FsVmVyZXRlbm9JdGVtPFRQYXJlbnQgZXh0ZW5kcyBWZXJldGVub0FjdG9yIHwgbnVsbCA9IFZlcmV0ZW5vQWN0b3IgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBzeXN0ZW06IFBoeXNpY2FsVmVyZXRlbm9JdGVtU3lzdGVtRGF0YTtcclxufVxyXG5cclxuZXhwb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0gfTsiLCAiaW1wb3J0IHsgVmVyZXRlbm9BY3RvciB9IGZyb20gXCIkbW9kdWxlL2FjdG9yXCI7XHJcbmltcG9ydCB7IFBoeXNpY2FsVmVyZXRlbm9JdGVtIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQXJtb3JTeXN0ZW1EYXRhIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9Bcm1vcjxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBnZXQgYXJtb3JDbGFzcygpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5hcm1vckNsYXNzIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHF1YWxpdHkoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ucXVhbGl0eSB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBtYXhEdWFyYWJpbGl0eSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFybW9yQ2xhc3MgKyB0aGlzLnF1YWxpdHk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGR1cmFiaWxpdHkoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uZHVyYWJpbGl0eSB8fCB0aGlzLm1heER1YXJhYmlsaXR5O1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Bcm1vcjxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBzeXN0ZW06IFZlcmV0ZW5vQXJtb3JTeXN0ZW1EYXRhO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0FybW9yIH0iLCAiZW51bSBTa2lsbFR5cGUge1xyXG4gICAgTm9uZSA9IFwibm9uZVwiLFxyXG4gICAgTWVsZWUgPSBcIm1lbGVlXCIsXHJcbiAgICBTdHJlbmd0aCA9IFwic3RyZW5ndGhcIixcclxuICAgIEFnaWxpdHkgPSBcImFnaWxpdHlcIixcclxuICAgIFBpbG90aW5nID0gXCJwaWxvdGluZ1wiLFxyXG4gICAgU3RlYWx0aCA9IFwic3RlYWx0aFwiLFxyXG4gICAgUmFuZ2VkID0gXCJyYW5nZWRcIixcclxuICAgIEN5YmVyc2hhbWFuaXNtID0gXCJjeWJlcnNoYW1hbmlzbVwiLFxyXG4gICAgU3Vydml2YWwgPSBcInN1cnZpdmFsXCIsXHJcbiAgICBNZWRpY2luZSA9IFwibWVkaWNpbmVcIixcclxuICAgIE9ic2VydmF0aW9uID0gXCJvYnNlcnZhdGlvblwiLFxyXG4gICAgU2NpZW5jZSA9IFwic2NpZW5jZVwiLFxyXG4gICAgTWVjaGFuaWNzID0gXCJtZWNoYW5pY3NcIixcclxuICAgIE1hbmlwdWxhdGlvbiA9IFwibWFuaXB1bGF0aW9uXCIsXHJcbiAgICBMZWFkZXJzaGlwID0gXCJsZWFkZXJzaGlwXCIsXHJcbiAgICBXaXRjaGNyYWZ0ID0gXCJ3aXRjaGNyYWZ0XCIsXHJcbiAgICBDdWx0dXJlID0gXCJjdWx0dXJlXCIsXHJcbn07XHJcblxyXG5pbnRlcmZhY2UgSURpY3Rpb25hcnk8VD4ge1xyXG4gICAgW2luZGV4OiBzdHJpbmddOiBUXHJcbn1cclxuXHJcbmV4cG9ydCB7IFNraWxsVHlwZSB9XHJcbmV4cG9ydCB0eXBlIHsgSURpY3Rpb25hcnkgfSIsICJpbXBvcnQgeyBTa2lsbFR5cGUgfSBmcm9tIFwiJGNvbW1vblwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIiRtb2R1bGUvYWN0b3JcIjtcclxuaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuaW1wb3J0IHsgV2VhcG9uVHlwZSwgUmFuZ2VUeXBlLCBWZXJldGVub1dlYXBvblN5c3RlbURhdGEgfSBmcm9tIFwiLi9kYXRhXCI7XHJcblxyXG5jbGFzcyBWZXJldGVub1dlYXBvbjxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBnZXQgTW9kaWZpZXIoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ubW9kaWZpZXI7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IERhbWFnZSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5kYW1hZ2U7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IEluaXRpYXRpdmUoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uaW5pdGlhdGl2ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgQ3JpdCgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5jcml0O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBXZWFwb25UeXBlKCk6IFdlYXBvblR5cGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS53ZWFwb25UeXBlIHx8IFdlYXBvblR5cGUuTm9uZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgQXR0YWNrV2l0aCgpOiBTa2lsbFR5cGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5hdHRhY2tXaXRoIHx8IFNraWxsVHlwZS5Ob25lO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBSYW5nZSgpOiBSYW5nZVR5cGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5yYW5nZSB8fCBSYW5nZVR5cGUuTm9uZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgSGFzQnVyc3QoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmhhc0J1cnN0IHx8IGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9XZWFwb248VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgUGh5c2ljYWxWZXJldGVub0l0ZW08VFBhcmVudD4ge1xyXG4gICAgc3lzdGVtOiBWZXJldGVub1dlYXBvblN5c3RlbURhdGE7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vV2VhcG9uIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9DaGFyYWN0ZXIsIFZlcmV0ZW5vTW9uc3RlciwgVmVyZXRlbm9OcGMgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FybW9yIH0gZnJvbSBcIiRtb2R1bGUvaXRlbVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub1dlYXBvbiB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vd2VhcG9uL2RvY3VtZW50XCI7XHJcblxyXG5leHBvcnQgY29uc3QgVkVSRVRFTk9DT05GSUcgPSB7XHJcbiAgICBjb21tb246IHtcclxuICAgICAgICBwcmljZTogXCJ2ZXJldGVuby5jb21tb24ucHJpY2VcIixcclxuICAgIH0sXHJcbiAgICB0YWJzOiB7XHJcbiAgICAgICAgc3RhdDogXCJ2ZXJldGVuby50YWIuc3RhdFwiLFxyXG4gICAgICAgIGVxdWlwbWVudDogXCJ2ZXJldGVuby50YWIuZXF1aXBtZW50XCIsXHJcbiAgICAgICAgZmlnaHQ6IFwidmVyZXRlbm8udGFiLmZpZ2h0XCIsXHJcbiAgICAgICAgYmlvOiBcInZlcmV0ZW5vLnRhYi5iaW9cIlxyXG4gICAgfSxcclxuICAgIHdlYXBvblR5cGVzOiB7XHJcbiAgICAgICAgbm9uZTogXCJ2ZXJldGVuby53ZWFwb25UeXBlLm5vbmVcIixcclxuICAgICAgICBicmF3bGluZzogXCJ2ZXJldGVuby53ZWFwb25UeXBlLmJyYXdsaW5nXCIsXHJcbiAgICAgICAgbWVsZWU6IFwidmVyZXRlbm8ud2VhcG9uVHlwZS5tZWxlZVwiLFxyXG4gICAgICAgIHJhbmdlZDogXCJ2ZXJldGVuby53ZWFwb25UeXBlLnJhbmdlZFwiLFxyXG4gICAgfSxcclxuICAgIHJhbmdlVHlwZXM6IHtcclxuICAgICAgICBwb2ludEJsYW5rOiBcInZlcmV0ZW5vLnJhbmdlLnBvaW50QmxhbmtcIixcclxuICAgICAgICBjbG9zZTogXCJ2ZXJldGVuby5yYW5nZS5jbG9zZVwiLFxyXG4gICAgICAgIG1lZGl1bTogXCJ2ZXJldGVuby5yYW5nZS5tZWRpdW1cIixcclxuICAgICAgICBsb25nOiBcInZlcmV0ZW5vLnJhbmdlLmxvbmdcIixcclxuICAgICAgICB1dG1vc3Q6IFwidmVyZXRlbm8ucmFuZ2UudXRtb3N0XCJcclxuICAgIH0sXHJcbiAgICBzdGF0czoge1xyXG4gICAgICAgIGhpdFBvaW50czogXCJ2ZXJldGVuby5zdGF0LmhpdFBvaW50XCIsXHJcbiAgICAgICAgd2lsbFBvaW50czogXCJ2ZXJldGVuby5zdGF0LndpbGxQb2ludFwiLFxyXG4gICAgICAgIHJlcHV0YXRpb246IFwidmVyZXRlbm8uc3RhdC5yZXB1dGF0aW9uXCJcclxuICAgIH0sXHJcbiAgICBhdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgY29uc3RpdHV0aW9uOiBcInZlcmV0ZW5vLmF0dHJpYnV0ZS5jb25zdGl0dXRpb25cIixcclxuICAgICAgICBpbnRlbGxpZ2VuY2U6IFwidmVyZXRlbm8uYXR0cmlidXRlLmludGVsbGlnZW5jZVwiLFxyXG4gICAgICAgIGRleHRlcml0eTogXCJ2ZXJldGVuby5hdHRyaWJ1dGUuZGV4dGVyaXR5XCIsXHJcbiAgICAgICAgZW1wYXRoeTogXCJ2ZXJldGVuby5hdHRyaWJ1dGUuZW1wYXRoeVwiXHJcbiAgICB9LFxyXG4gICAgc2tpbGxzOiB7XHJcbiAgICAgICAgbWVsZWU6IFwidmVyZXRlbm8uc2tpbGwubWVsZWVcIixcclxuICAgICAgICBzdHJlbmd0aDogXCJ2ZXJldGVuby5za2lsbC5zdHJlbmd0aFwiLFxyXG4gICAgICAgIGFnaWxpdHk6IFwidmVyZXRlbm8uc2tpbGwuYWdpbGl0eVwiLFxyXG4gICAgICAgIHBpbG90aW5nOiBcInZlcmV0ZW5vLnNraWxsLnBpbG90aW5nXCIsXHJcbiAgICAgICAgc3RlYWx0aDogXCJ2ZXJldGVuby5za2lsbC5zdGVhbHRoXCIsXHJcbiAgICAgICAgcmFuZ2VkOiBcInZlcmV0ZW5vLnNraWxsLnJhbmdlZFwiLFxyXG4gICAgICAgIGN5YmVyc2hhbWFuaXNtOiBcInZlcmV0ZW5vLnNraWxsLmN5YmVyc2hhbWFuaXNtXCIsXHJcbiAgICAgICAgc3Vydml2YWw6IFwidmVyZXRlbm8uc2tpbGwuc3Vydml2YWxcIixcclxuICAgICAgICBtZWRpY2luZTogXCJ2ZXJldGVuby5za2lsbC5tZWRpY2luZVwiLFxyXG4gICAgICAgIG9ic2VydmF0aW9uOiBcInZlcmV0ZW5vLnNraWxsLm9ic2VydmF0aW9uXCIsXHJcbiAgICAgICAgc2NpZW5jZTogXCJ2ZXJldGVuby5za2lsbC5zY2llbmNlXCIsXHJcbiAgICAgICAgbWVjaGFuaWNzOiBcInZlcmV0ZW5vLnNraWxsLm1lY2hhbmljc1wiLFxyXG4gICAgICAgIG1hbmlwdWxhdGlvbjogXCJ2ZXJldGVuby5za2lsbC5tYW5pcHVsYXRpb25cIixcclxuICAgICAgICBsZWFkZXJzaGlwOiBcInZlcmV0ZW5vLnNraWxsLmxlYWRlcnNoaXBcIixcclxuICAgICAgICB3aXRjaGNyYWZ0OiBcInZlcmV0ZW5vLnNraWxsLndpdGNoY3JhZnRcIixcclxuICAgICAgICBjdWx0dXJlOiBcInZlcmV0ZW5vLnNraWxsLmN1bHR1cmVcIlxyXG4gICAgfSxcclxuXHJcbiAgICBJdGVtOiB7XHJcbiAgICAgICAgZG9jdW1lbnRDbGFzc2VzOiB7XHJcbiAgICAgICAgICAgIGFybW9yOiBWZXJldGVub0FybW9yLFxyXG4gICAgICAgICAgICB3ZWFwb246IFZlcmV0ZW5vV2VhcG9uXHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcblxyXG4gICAgQWN0b3I6IHtcclxuICAgICAgICBkb2N1bWVudENsYXNzZXM6IHtcclxuICAgICAgICAgICAgY2hhcmFjdGVyOiBWZXJldGVub0NoYXJhY3RlcixcclxuICAgICAgICAgICAgbnBjOiBWZXJldGVub05wYyxcclxuICAgICAgICAgICAgbW9uc3RlcjogVmVyZXRlbm9Nb25zdGVyXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwgImV4cG9ydCBjb25zdCBWRVJFVEVOT19QQVJUSUFMUyA9IFtcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL3N0YXRzLXRhYi5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL3N0YXRzLWJsb2NrLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3Ivc2tpbGxzLWJsb2NrLmhic1wiLFxyXG5cclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2VxdWlwbWVudC10YWIuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9pdGVtL3dlYXBvbi1wbGF0ZS5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2l0ZW0vYXJtb3ItcGxhdGUuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9pdGVtL2VxdWlwbWVudC1wbGF0ZS5oYnNcIixcclxuXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9maWdodC10YWIuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9maWdodC9icmF3bGluZy13ZWFwb24tcGxhdGUuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9maWdodC9tZWxlZS13ZWFwb24tcGxhdGUuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9maWdodC9yYW5nZWQtd2VhcG9uLXBsYXRlLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvZmlnaHQvYXJtb3ItcGxhdGUuaGJzXCIsXHJcblxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvYmlvLXRhYi5oYnNcIixcclxuXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9pdGVtL2Jhc2UtaXRlbS1ibG9jay5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2l0ZW0vcGh5c2ljYWwtaXRlbS1ibG9jay5oYnNcIixcclxuXTsiLCAiaW1wb3J0IHsgU2tpbGxUeXBlIH0gZnJvbSBcIiRjb21tb25cIjtcclxuaW1wb3J0IHsgSWRMYWJlbFR5cGUgfSBmcm9tIFwiJG1vZHVsZS9kYXRhXCI7XHJcbmltcG9ydCB7IFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldCwgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YSB9IGZyb20gXCIuLi9waHlzaWNhbC1pdGVtL3NoZWV0XCI7XHJcbmltcG9ydCB7IFdlYXBvblR5cGUsIFJhbmdlVHlwZSB9IGZyb20gXCIuL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9XZWFwb24gfSBmcm9tIFwiLi9kb2N1bWVudFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9XZWFwb25TaGVldCBleHRlbmRzIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldDxWZXJldGVub1dlYXBvbj57XHJcbiAgICBvdmVycmlkZSBhc3luYyBnZXREYXRhKG9wdGlvbnM/OiBQYXJ0aWFsPERvY3VtZW50U2hlZXRPcHRpb25zPik6IFByb21pc2U8VmVyZXRlbm9XZWFwb25TaGVldERhdGE+IHtcclxuICAgICAgICBjb25zdCBzaGVldERhdGEgPSBhd2FpdCBzdXBlci5nZXREYXRhKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW0gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciB3ZWFwb25UeXBlcyA9IE9iamVjdC52YWx1ZXMoV2VhcG9uVHlwZSkubWFwKChlLCBpKSA9PiB7IHJldHVybiB7IGlkOiBpLCBsYWJlbDogZ2FtZS5pMThuLmxvY2FsaXplKGB2ZXJldGVuby53ZWFwb25UeXBlLiR7ZX1gKSwgdHlwZTogZSB9IH0pXHJcbiAgICAgICAgdmFyIHJhbmdlVHlwZXMgPSBPYmplY3QudmFsdWVzKFJhbmdlVHlwZSkubWFwKChlLCBpKSA9PiB7IHJldHVybiB7IGlkOiBpLCBsYWJlbDogZ2FtZS5pMThuLmxvY2FsaXplKGB2ZXJldGVuby5yYW5nZS4ke2V9YCksIHR5cGU6IGUgfSB9KVxyXG4gICAgICAgIHZhciBza2lsbFR5cGVzID0gT2JqZWN0LnZhbHVlcyhTa2lsbFR5cGUpLm1hcCgoZSwgaSkgPT4geyByZXR1cm4geyBpZDogaSwgbGFiZWw6IGdhbWUuaTE4bi5sb2NhbGl6ZShgdmVyZXRlbm8uc2tpbGwuJHtlfWApLCB0eXBlOiBlIH0gfSlcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0OiBWZXJldGVub1dlYXBvblNoZWV0RGF0YSA9IHtcclxuICAgICAgICAgICAgLi4uc2hlZXREYXRhLFxyXG4gICAgICAgICAgICBtb2RpZmllcjogaXRlbS5Nb2RpZmllcixcclxuICAgICAgICAgICAgd2VhcG9uVHlwZTogaXRlbS5XZWFwb25UeXBlLFxyXG4gICAgICAgICAgICBhdHRhY2tXaXRoOiBpdGVtLkF0dGFja1dpdGgsXHJcbiAgICAgICAgICAgIGNyaXQ6IGl0ZW0uQ3JpdCxcclxuICAgICAgICAgICAgZGFtYWdlOiBpdGVtLkRhbWFnZSxcclxuICAgICAgICAgICAgaW5pdGlhdGl2ZTogaXRlbS5Jbml0aWF0aXZlLFxyXG4gICAgICAgICAgICByYW5nZTogaXRlbS5SYW5nZSxcclxuICAgICAgICAgICAgd2VhcG9uVHlwZXM6IHdlYXBvblR5cGVzLFxyXG4gICAgICAgICAgICByYW5nZXM6IHJhbmdlVHlwZXMsXHJcbiAgICAgICAgICAgIHNraWxsczogc2tpbGxUeXBlcyxcclxuICAgICAgICAgICAgaXNSYW5nZWQ6IGl0ZW0uUmFuZ2UgPiBSYW5nZVR5cGUuTWVkaXVtLFxyXG4gICAgICAgICAgICBoYXNCdXJzdDogaXRlbS5IYXNCdXJzdFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRlbXBsYXRlKCkge1xyXG4gICAgICAgIHJldHVybiBgc3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL2l0ZW1zL3dlYXBvbi1zaGVldC5oYnNgO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9XZWFwb25TaGVldERhdGEgZXh0ZW5kcyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXREYXRhPFZlcmV0ZW5vV2VhcG9uPiB7XHJcbiAgICBtb2RpZmllcjogbnVtYmVyO1xyXG4gICAgZGFtYWdlOiBudW1iZXI7XHJcbiAgICBpbml0aWF0aXZlOiBudW1iZXI7XHJcbiAgICBjcml0OiBudW1iZXI7XHJcbiAgICB3ZWFwb25UeXBlOiBXZWFwb25UeXBlLFxyXG4gICAgd2VhcG9uVHlwZXM6IElkTGFiZWxUeXBlPFdlYXBvblR5cGU+W10sXHJcbiAgICBhdHRhY2tXaXRoOiBTa2lsbFR5cGUsXHJcbiAgICBza2lsbHM6IElkTGFiZWxUeXBlPFNraWxsVHlwZT5bXTtcclxuICAgIHJhbmdlOiBSYW5nZVR5cGVcclxuICAgIHJhbmdlczogSWRMYWJlbFR5cGU8UmFuZ2VUeXBlPltdO1xyXG4gICAgaXNSYW5nZWQ6IGJvb2xlYW47XHJcbiAgICBoYXNCdXJzdDogYm9vbGVhblxyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub1dlYXBvblNoZWV0IH07XHJcbmV4cG9ydCB0eXBlIHsgVmVyZXRlbm9XZWFwb25TaGVldERhdGEgfSIsICJpbXBvcnQgeyBWZXJldGVub0l0ZW0gfSBmcm9tIFwiJG1vZHVsZS9pdGVtXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQWN0b3IgfSBmcm9tIFwiLi5cIjtcclxuXHJcbmFic3RyYWN0IGNsYXNzIFZlcmV0ZW5vQWN0b3JTaGVldDxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub0FjdG9yPiBleHRlbmRzIEFjdG9yU2hlZXQ8VEFjdG9yLCBWZXJldGVub0l0ZW0+IHtcclxuICAgIHN0YXRpYyBvdmVycmlkZSBnZXQgZGVmYXVsdE9wdGlvbnMoKTogQWN0b3JTaGVldE9wdGlvbnMge1xyXG4gICAgICAgIGNvbnN0IGlzUnVzc2lhbkxhbmd1YWdlID0gZ2FtZS5zZXR0aW5ncy5nZXQoXCJjb3JlXCIsIFwibGFuZ3VhZ2VcIikgPT0gJ3J1JztcclxuXHJcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IG1lcmdlT2JqZWN0KHN1cGVyLmRlZmF1bHRPcHRpb25zLCB7XHJcbiAgICAgICAgICAgIHdpZHRoOiA1NjAsXHJcbiAgICAgICAgICAgIGNsYXNzZXM6IFsndmVyZXRlbm8nLCAnYWN0b3InLCAnc2hlZXQnXVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmKGlzUnVzc2lhbkxhbmd1YWdlKXtcclxuICAgICAgICAgICAgb3B0aW9ucy5jbGFzc2VzLnB1c2goXCJsYW5nLXJ1XCIpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb3B0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICBvdmVycmlkZSBhc3luYyBnZXREYXRhKG9wdGlvbnM6IFBhcnRpYWw8RG9jdW1lbnRTaGVldE9wdGlvbnM+ID0ge30pOiBQcm9taXNlPFZlcmV0ZW5vQWN0b3JTaGVldERhdGE8VEFjdG9yPj4ge1xyXG4gICAgICAgIG9wdGlvbnMuaWQgPSB0aGlzLmlkO1xyXG4gICAgICAgIG9wdGlvbnMuZWRpdGFibGUgPSB0aGlzLmlzRWRpdGFibGU7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGFjdG9yOiBhY3RvcixcclxuICAgICAgICAgICAgY3NzQ2xhc3M6IHRoaXMuYWN0b3IuaXNPd25lciA/IFwiZWRpdGFibGVcIiA6IFwibG9ja2VkXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IGFjdG9yLnN5c3RlbSxcclxuICAgICAgICAgICAgZG9jdW1lbnQ6IHRoaXMuYWN0b3IsXHJcbiAgICAgICAgICAgIGVkaXRhYmxlOiB0aGlzLmlzRWRpdGFibGUsXHJcbiAgICAgICAgICAgIGVmZmVjdHM6IFtdLFxyXG4gICAgICAgICAgICBsaW1pdGVkOiB0aGlzLmFjdG9yLmxpbWl0ZWQsXHJcbiAgICAgICAgICAgIG9wdGlvbnMsXHJcbiAgICAgICAgICAgIG93bmVyOiB0aGlzLmFjdG9yLmlzT3duZXIsXHJcbiAgICAgICAgICAgIHRpdGxlOiB0aGlzLnRpdGxlLFxyXG4gICAgICAgICAgICBpdGVtczogYWN0b3IuaXRlbXMsXHJcbiAgICAgICAgICAgIGFjdG9yVHlwZTogYWN0b3IudHlwZSxcclxuXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBhY3Rvci5EZXNjcmlwdGlvblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvdmVycmlkZSBhY3RpdmF0ZUxpc3RlbmVycygkaHRtbDogSlF1ZXJ5KTogdm9pZCB7XHJcbiAgICAgICAgc3VwZXIuYWN0aXZhdGVMaXN0ZW5lcnMoJGh0bWwpO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9BY3RvclNoZWV0RGF0YTxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub0FjdG9yPiBleHRlbmRzIEFjdG9yU2hlZXREYXRhPFRBY3Rvcj4ge1xyXG4gICAgYWN0b3JUeXBlOiBzdHJpbmcgfCBudWxsO1xyXG4gICAgYWN0b3I6IFRBY3RvcjtcclxuICAgIGRhdGE6IFRBY3RvcltcInN5c3RlbVwiXTtcclxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQWN0b3JTaGVldCB9XHJcbmV4cG9ydCB0eXBlIHsgVmVyZXRlbm9BY3RvclNoZWV0RGF0YSB9XHJcbiIsICJpbXBvcnQgeyBWZXJldGVub1JvbGxEYXRhLCBWZXJldGVub1JvbGxPcHRpb25zIH0gZnJvbSBcIiRtb2R1bGUvZGF0YVwiO1xyXG5pbXBvcnQgeyBDaGF0TWVzc2FnZVNjaGVtYSB9IGZyb20gXCIuLi8uLi8uLi90eXBlcy9mb3VuZHJ5L2NvbW1vbi9kb2N1bWVudHMvY2hhdC1tZXNzYWdlXCI7XHJcblxyXG5jbGFzcyBWZXJldGVub1JvbGwgZXh0ZW5kcyBSb2xsIHtcclxuICAgIHN0YXRpYyBvdmVycmlkZSBDSEFUX1RFTVBMQVRFID0gXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9jaGF0L3JvbGxzL3ZlcmV0ZW5vLXJvbGwtY2hhdC1tZXNzYWdlLmhic1wiO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGZvcm11bGE6IHN0cmluZywgZGF0YT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBvcHRpb25zPzogUm9sbE9wdGlvbnMpIHtcclxuICAgICAgICBzdXBlcihmb3JtdWxhLCBkYXRhLCBvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb3ZlcnJpZGUgYXN5bmMgX2V2YWx1YXRlKHsgbWluaW1pemUsIG1heGltaXplLCB9OiBPbWl0PEV2YWx1YXRlUm9sbFBhcmFtcywgXCJhc3luY1wiPik6IFByb21pc2U8Um9sbGVkPHRoaXM+PiB7XHJcbiAgICAgICAgY29uc3Qgc3VwZXJFdmFsdWF0ZSA9IGF3YWl0IHN1cGVyLl9ldmFsdWF0ZSh7IG1pbmltaXplLCBtYXhpbWl6ZSB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHN1cGVyRXZhbHVhdGU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub1JvbGwgZXh0ZW5kcyBSb2xsIHsgfVxyXG5cclxuY2xhc3MgVmVyZXRlbm9Ta2lsbFJvbGwgZXh0ZW5kcyBWZXJldGVub1JvbGwge1xyXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IHJvbGxEYXRhID0gb3B0aW9ucy5yb2xsRGF0YTtcclxuICAgICAgICBjb25zdCBmb3JtdWxhID0gYCR7cm9sbERhdGEucG9vbH0ke3JvbGxEYXRhLmRpY2V9YDtcclxuXHJcbiAgICAgICAgc3VwZXIoZm9ybXVsYSwgKHJvbGxEYXRhIGFzIFJlY29yZDxzdHJpbmcsIGFueT4pLCBvcHRpb25zLm1lc3NhZ2VEYXRhKTtcclxuICAgIH1cclxufVxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Ta2lsbFJvbGwgZXh0ZW5kcyBWZXJldGVub1JvbGwgeyB9XHJcblxyXG5leHBvcnQgeyBWZXJldGVub1JvbGwsIFZlcmV0ZW5vU2tpbGxSb2xsIH1cclxuIiwgImltcG9ydCB7IFZlcmV0ZW5vUm9sbE9wdGlvbnMsIFZlcmV0ZW5vUm9sbFR5cGUgfSBmcm9tIFwiJG1vZHVsZS9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vUm9sbCB9IGZyb20gXCIkbW9kdWxlL3N5c3RlbS9yb2xsXCI7XHJcblxyXG5jbGFzcyBWZXJldGVub1JvbGxlciB7XHJcbiAgICByb2xsT2JqZWN0OiBWZXJldGVub1JvbGwgfCBudWxsID0gbnVsbDtcclxuICAgIG9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMgfCBudWxsID0gbnVsbDtcclxuICAgIHZlcmV0ZW5vUmVzdWx0OiBWZXJldGVub1Jlc3VsdCA9IG5ldyBWZXJldGVub1Jlc3VsdCgpO1xyXG4gICAgdmVyZXRlbm9Sb2xsczogVmVyZXRlbm9EaWVSZXN1bHRbXSA9IFtdO1xyXG5cclxuICAgIGFzeW5jIHJvbGwocm9sbE9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSByb2xsT3B0aW9ucztcclxuICAgICAgICBpZiAocm9sbE9wdGlvbnMucm9sbERhdGEucG9vbCA8PSAwICYmIHJvbGxPcHRpb25zLnR5cGUgIT0gVmVyZXRlbm9Sb2xsVHlwZS5Bcm1vckJsb2NrKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJvbGxEZXNwZXJhdGlvbihyb2xsT3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcm9sbEZvcm11bGEgPSBgJHtyb2xsT3B0aW9ucy5yb2xsRGF0YS5wb29sfSR7cm9sbE9wdGlvbnMucm9sbERhdGEuZGljZX1gO1xyXG5cclxuICAgICAgICBsZXQgcm9sbCA9IG5ldyBWZXJldGVub1JvbGwocm9sbEZvcm11bGEpO1xyXG4gICAgICAgIHRoaXMucm9sbE9iamVjdCA9IHJvbGw7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5yb2xsT2JqZWN0Ll9ldmFsdWF0ZWQpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5yb2xsT2JqZWN0LmV2YWx1YXRlKHt9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVldmFsdWF0ZVRvdGFsKCk7XHJcbiAgICAgICAgdGhpcy50b01lc3NhZ2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByb2xsRGVzcGVyYXRpb24ocm9sbE9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBsZXQgcm9sbEZvcm11bGEgPSAnMGQyMCc7XHJcbiAgICAgICAgaWYgKHJvbGxPcHRpb25zLnJvbGxEYXRhLnBvb2wgPT0gMCkge1xyXG4gICAgICAgICAgICByb2xsRm9ybXVsYSA9ICcxZDIwJztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByb2xsRm9ybXVsYSA9ICcyZDIwJ1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJvbGwgPSBuZXcgVmVyZXRlbm9Sb2xsKHJvbGxGb3JtdWxhKTtcclxuICAgICAgICB0aGlzLnJvbGxPYmplY3QgPSByb2xsO1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyEudHlwZSA9IFZlcmV0ZW5vUm9sbFR5cGUuRGVzcGVyYXRpb247XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVldmFsdWF0ZURlc3BlcmF0aW9uVG90YWwoKTtcclxuICAgICAgICB0aGlzLnRvTWVzc2FnZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJvbGxJbml0aWF0aXZlKHJvbGxPcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gcm9sbE9wdGlvbnM7XHJcblxyXG4gICAgICAgIGxldCByb2xsRm9ybXVsYSA9IGAke3JvbGxPcHRpb25zLnJvbGxEYXRhLnBvb2x9JHtyb2xsT3B0aW9ucy5yb2xsRGF0YS5kaWNlfWA7XHJcblxyXG4gICAgICAgIGNvbnN0IGJvbnVzID0gcm9sbE9wdGlvbnMucm9sbERhdGEuYm9udXM7XHJcbiAgICAgICAgaWYgKGJvbnVzICE9PSBudWxsICYmIGJvbnVzICE9PSAwKSB7XHJcbiAgICAgICAgICAgIGlmIChib251cyA+IDApIHtcclxuICAgICAgICAgICAgICAgIHJvbGxGb3JtdWxhID0gcm9sbEZvcm11bGEgKyBgKyR7Ym9udXN9YFxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcm9sbEZvcm11bGEgPSByb2xsRm9ybXVsYSArIGAke2JvbnVzfWBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJvbGwgPSBuZXcgVmVyZXRlbm9Sb2xsKHJvbGxGb3JtdWxhKTtcclxuICAgICAgICB0aGlzLnJvbGxPYmplY3QgPSByb2xsO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMucm9sbE9iamVjdC5fZXZhbHVhdGVkKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucm9sbE9iamVjdC5ldmFsdWF0ZSh7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLnJlZXZhbHVhdGVUb3RhbCgpO1xyXG4gICAgICAgIHRoaXMudG9NZXNzYWdlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVldmFsdWF0ZVRvdGFsKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGlmICghdGhpcy5yb2xsT2JqZWN0IHx8ICF0aGlzLm9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnJvbGxPYmplY3QhLl9ldmFsdWF0ZWQpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5yb2xsT2JqZWN0IS5ldmFsdWF0ZSh7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJvbGxEYXRhLmlzU2VyaWFsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucm9sbE9iamVjdC5fZm9ybXVsYSArPSAnKydcclxuICAgICAgICAgICAgbGV0IGlzSW50ZXJydXB0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgd2hpbGUgKCFpc0ludGVycnVwdGVkKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWRkaXRpb25hbFJvbGwgPSBuZXcgUm9sbCgnMWQyMCcpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgYWRkaXRpb25hbFJvbGwuZXZhbHVhdGUoe30pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYWRkaXRpb25hbFJvbGxSZXN1bHQ6IERpZVJlc3VsdCA9IChhZGRpdGlvbmFsUm9sbC50ZXJtc1swXSBhcyBhbnkpLnJlc3VsdHNbMF07XHJcbiAgICAgICAgICAgICAgICAodGhpcy5yb2xsT2JqZWN0LnRlcm1zWzBdIGFzIGFueSkucmVzdWx0cy5wdXNoKGFkZGl0aW9uYWxSb2xsUmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIGlmIChhZGRpdGlvbmFsUm9sbFJlc3VsdC5yZXN1bHQgPD0gNCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlzSW50ZXJydXB0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcm9sbERpY2VzUmVzdWx0cyA9ICh0aGlzLnJvbGxPYmplY3QudGVybXNbMF0gYXMgYW55KS5yZXN1bHRzIGFzIERpZVJlc3VsdFtdO1xyXG4gICAgICAgIGxldCByb2xsUmVzdWx0ID0gdGhpcy5jYWxjdWxhdGVEaWNlc1RvdGFsKHJvbGxEaWNlc1Jlc3VsdHMpO1xyXG5cclxuICAgICAgICB0aGlzLnZlcmV0ZW5vUmVzdWx0ID0gcm9sbFJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWV2YWx1YXRlRGVzcGVyYXRpb25Ub3RhbCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMucm9sbE9iamVjdCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMucm9sbE9iamVjdC5fZXZhbHVhdGVkKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucm9sbE9iamVjdC5ldmFsdWF0ZSh7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcm9sbERpY2VzUmVzdWx0cyA9ICh0aGlzLnJvbGxPYmplY3QudGVybXNbMF0gYXMgYW55KS5yZXN1bHRzO1xyXG4gICAgICAgIGxldCByb2xsUmVzdWx0ID0gdGhpcy5jYWxjdWxhdGVEZXNwZXJhdGlvbkRpY2VzVG90YWwocm9sbERpY2VzUmVzdWx0cyk7XHJcblxyXG4gICAgICAgIHRoaXMudmVyZXRlbm9SZXN1bHQgPSByb2xsUmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGNhbGN1bGF0ZURpY2VzVG90YWwoZGljZXM6IERpZVJlc3VsdFtdKTogVmVyZXRlbm9SZXN1bHQge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogVmVyZXRlbm9SZXN1bHQgPSB7XHJcbiAgICAgICAgICAgIHRvdGFsOiAwLFxyXG4gICAgICAgICAgICBzdWNjZXNzZXM6IDAsXHJcbiAgICAgICAgICAgIGNyaXRGYWlsczogMFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGljZXMuZm9yRWFjaChyID0+IHtcclxuICAgICAgICAgICAgbGV0IHJvbGxSZXN1bHQ6IFZlcmV0ZW5vRGllUmVzdWx0ID0ge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0OiByLnJlc3VsdCxcclxuICAgICAgICAgICAgICAgIGNsYXNzZXM6ICdkMjAnXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAoci5yZXN1bHQgPT09IDIwKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQudG90YWwgKz0gMjtcclxuICAgICAgICAgICAgICAgIHJvbGxSZXN1bHQuY2xhc3NlcyArPSAnIG1heCc7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuc3VjY2Vzc2VzICs9IDI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyLnJlc3VsdCA+PSAxNyAmJiByLnJlc3VsdCA8PSAxOSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRvdGFsKys7XHJcbiAgICAgICAgICAgICAgICByb2xsUmVzdWx0LmNsYXNzZXMgKz0gJyBnb29kJztcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5zdWNjZXNzZXMrKztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHIucmVzdWx0ID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQudG90YWwtLTtcclxuICAgICAgICAgICAgICAgIHJvbGxSZXN1bHQuY2xhc3NlcyArPSAnIG1pbic7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuY3JpdEZhaWxzKys7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudmVyZXRlbm9Sb2xscy5wdXNoKHJvbGxSZXN1bHQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGNhbGN1bGF0ZURlc3BlcmF0aW9uRGljZXNUb3RhbChkaWNlczogRGllUmVzdWx0W10pOiBWZXJldGVub1Jlc3VsdCB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0OiBWZXJldGVub1Jlc3VsdCA9IHtcclxuICAgICAgICAgICAgdG90YWw6IDAsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NlczogMCxcclxuICAgICAgICAgICAgY3JpdEZhaWxzOiAwXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaWNlcy5mb3JFYWNoKHIgPT4ge1xyXG4gICAgICAgICAgICBsZXQgcm9sbFJlc3VsdCA9IHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdDogci5yZXN1bHQsXHJcbiAgICAgICAgICAgICAgICBjbGFzc2VzOiAnZDIwJ1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKHIucmVzdWx0ID09PSAyMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRvdGFsKys7XHJcbiAgICAgICAgICAgICAgICByb2xsUmVzdWx0LmNsYXNzZXMgKz0gJyBtYXgnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoci5yZXN1bHQgPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC50b3RhbC0tO1xyXG4gICAgICAgICAgICAgICAgcm9sbFJlc3VsdC5jbGFzc2VzICs9ICcgbWluJztcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5jcml0RmFpbHMrKztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy52ZXJldGVub1JvbGxzLnB1c2gocm9sbFJlc3VsdCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRpY2VzQ291bnQgPSBkaWNlcy5sZW5ndGg7XHJcbiAgICAgICAgaWYgKHJlc3VsdC50b3RhbCA9PSBkaWNlc0NvdW50KSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC50b3RhbCA9IDE7XHJcbiAgICAgICAgICAgIHJlc3VsdC5zdWNjZXNzZXMgPSAxO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQudG90YWwgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQudG90YWwgPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHRvTWVzc2FnZSgpOiBQcm9taXNlPENoYXRNZXNzYWdlIHwgdW5kZWZpbmVkPiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY2hhdERhdGEgPSB0aGlzLm9wdGlvbnMubWVzc2FnZURhdGE7XHJcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSB0aGlzLmdldFRlbXBsYXRlKHRoaXMub3B0aW9ucy50eXBlKTtcclxuICAgICAgICBjb25zdCB2ZXJldGVub1JvbGxEYXRhID0gdGhpcy5nZXRWZXJldGVub1JvbGxEYXRhKCk7XHJcblxyXG4gICAgICAgIGNoYXREYXRhLmNvbnRlbnQgPSBhd2FpdCByZW5kZXJUZW1wbGF0ZSh0ZW1wbGF0ZSwgdmVyZXRlbm9Sb2xsRGF0YSk7XHJcbiAgICAgICAgY2hhdERhdGEucm9sbCA9IHRoaXMucm9sbE9iamVjdDtcclxuXHJcbiAgICAgICAgcmV0dXJuIENoYXRNZXNzYWdlLmNyZWF0ZShjaGF0RGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VGVtcGxhdGUodHlwZTogVmVyZXRlbm9Sb2xsVHlwZSk6IHN0cmluZyB7XHJcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgVmVyZXRlbm9Sb2xsVHlwZS5SZWd1bGFyOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvY2hhdC9yb2xscy92ZXJldGVuby1yb2xsLWNoYXQtbWVzc2FnZS5oYnNcIjtcclxuICAgICAgICAgICAgY2FzZSBWZXJldGVub1JvbGxUeXBlLkFybW9yQmxvY2s6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9jaGF0L3JvbGxzL3ZlcmV0ZW5vLWFybW9yLXJvbGwtY2hhdC1tZXNzYWdlLmhic1wiO1xyXG4gICAgICAgICAgICBjYXNlIFZlcmV0ZW5vUm9sbFR5cGUuSW5pdGlhdGl2ZTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL2NoYXQvcm9sbHMvdmVyZXRlbm8taW5pdGlhdGl2ZS1yb2xsLWNoYXQtbWVzc2FnZS5oYnNcIjtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL2NoYXQvcm9sbHMvdmVyZXRlbm8tcm9sbC1jaGF0LW1lc3NhZ2UuaGJzXCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldFZlcmV0ZW5vUm9sbERhdGEoKTogVmVyZXRlbm9Sb2xsUmVzdWx0IHtcclxuICAgICAgICBsZXQgcm9sbERhdGEgPSB7XHJcbiAgICAgICAgICAgIGZvcm11bGE6IHRoaXMucm9sbE9iamVjdCEuX2Zvcm11bGEsXHJcbiAgICAgICAgICAgIHRvdGFsOiB0aGlzLnJvbGxPYmplY3QhLnRvdGFsISxcclxuICAgICAgICAgICAgdmVyZXRlbm9Ub3RhbDogdGhpcy52ZXJldGVub1Jlc3VsdC50b3RhbCxcclxuICAgICAgICAgICAgdmVyZXRlbm9TdWNjZXNzZXM6IHRoaXMudmVyZXRlbm9SZXN1bHQuc3VjY2Vzc2VzLFxyXG4gICAgICAgICAgICB2ZXJldGVub0NyaXRGYWlsczogdGhpcy52ZXJldGVub1Jlc3VsdC5jcml0RmFpbHMsXHJcbiAgICAgICAgICAgIHJvbGxzOiB0aGlzLnZlcmV0ZW5vUm9sbHNcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByb2xsRGF0YTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIERpZVJlc3VsdCB7XHJcbiAgICBhY3RpdmU6IGJvb2xlYW47XHJcbiAgICByZXN1bHQ6IG51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vRGllUmVzdWx0IHtcclxuICAgIHJlc3VsdDogbnVtYmVyO1xyXG4gICAgY2xhc3Nlczogc3RyaW5nO1xyXG59XHJcblxyXG5jbGFzcyBWZXJldGVub1Jlc3VsdCB7XHJcbiAgICB0b3RhbDogbnVtYmVyID0gMDtcclxuICAgIHN1Y2Nlc3NlczogbnVtYmVyID0gMDtcclxuICAgIGNyaXRGYWlsczogbnVtYmVyID0gMDtcclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vUm9sbFJlc3VsdCB7XHJcbiAgICBmb3JtdWxhOiBzdHJpbmc7XHJcbiAgICB0b3RhbDogbnVtYmVyO1xyXG4gICAgdmVyZXRlbm9Ub3RhbDogbnVtYmVyO1xyXG4gICAgdmVyZXRlbm9TdWNjZXNzZXM6IG51bWJlcjtcclxuICAgIHZlcmV0ZW5vQ3JpdEZhaWxzOiBudW1iZXI7XHJcbiAgICByb2xsczogVmVyZXRlbm9EaWVSZXN1bHRbXTtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9Sb2xsZXIgfSIsICJleHBvcnQgY2xhc3MgVmVyZXRlbm9Sb2xsRGlhbG9nIHtcclxuICAgIHRlbXBsYXRlOiBzdHJpbmcgPSAnc3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvY2hhdC9kaWFsb2cvcm9sbC1kaWFsb2cuaGJzJztcclxuXHJcbiAgICBhc3luYyBnZXRUYXNrQ2hlY2tPcHRpb25zKCk6IFByb21pc2U8VmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQ+IHtcclxuICAgICAgICBjb25zdCBodG1sID0gYXdhaXQgcmVuZGVyVGVtcGxhdGUodGhpcy50ZW1wbGF0ZSwge30pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJcdTA0MUNcdTA0M0VcdTA0MzRcdTA0MzhcdTA0NDRcdTA0MzhcdTA0M0FcdTA0MzBcdTA0NDJcdTA0M0VcdTA0NDBcdTA0NEIgXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDQxXHUwNDNBXHUwNDMwXCIsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiBodG1sLFxyXG4gICAgICAgICAgICAgICAgYnV0dG9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJcdTA0MTRcdTA0MzBcdTA0M0JcdTA0MzVcdTA0MzVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGh0bWwgPT4gcmVzb2x2ZSh0aGlzLl9wcm9jZXNzVGFza0NoZWNrT3B0aW9ucygoaHRtbFswXSBhcyB1bmtub3duIGFzIEhUTUxBbmNob3JFbGVtZW50KS5xdWVyeVNlbGVjdG9yKFwiZm9ybVwiKSkpXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiXHUwNDFFXHUwNDQyXHUwNDNDXHUwNDM1XHUwNDNEXHUwNDMwXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogXCJub3JtYWxcIixcclxuICAgICAgICAgICAgICAgIGNsb3NlOiAoKSA9PiByZXNvbHZlKHsgbW9kaWZpZXI6IDAsIGJsaW5kUm9sbDogZmFsc2UsIGNhbmNlbGxlZDogdHJ1ZSB9KVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgbmV3IERpYWxvZyhkYXRhKS5yZW5kZXIodHJ1ZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgX3Byb2Nlc3NUYXNrQ2hlY2tPcHRpb25zKGZvcm06IEpRdWVyeSk6IFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBtb2RpZmllcjogcGFyc2VJbnQoZm9ybS5tb2RpZmllci52YWx1ZSksXHJcbiAgICAgICAgICAgIGJsaW5kUm9sbDogZm9ybS5ibGluZFJvbGwuY2hlY2tlZCxcclxuICAgICAgICAgICAgY2FuY2VsbGVkOiBmYWxzZVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBWZXJldGVub1JvbGxEaWFsb2dBcmd1bWVudCB7XHJcbiAgICBtb2RpZmllcjogbnVtYmVyID0gMDtcclxuICAgIGJsaW5kUm9sbDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgY2FuY2VsbGVkOiBib29sZWFuID0gdHJ1ZTtcclxufSIsICJpbXBvcnQgeyBWZXJldGVub0NyZWF0dXJlIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQWN0b3JTaGVldCwgVmVyZXRlbm9BY3RvclNoZWV0RGF0YSB9IGZyb20gXCIuLi9iYXNlL3NoZWV0XCI7XHJcbmltcG9ydCB7IEF0dHJpYnV0ZVdpdGhTa2lsbHMsIEF0dHJpYnV0ZXNCbG9jaywgSXRlbUFjdGlvbkluZm8sIFNraWxsLCBTa2lsbHNCbG9jaywgU3RhdCwgU3RhdHNCbG9jaywgV2VhcG9uQXR0YWNrSW5mbyB9IGZyb20gXCIuL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9DaGF0T3B0aW9ucywgVmVyZXRlbm9NZXNzYWdlRGF0YSwgVmVyZXRlbm9Sb2xsRGF0YSwgVmVyZXRlbm9Sb2xsT3B0aW9ucywgVmVyZXRlbm9Sb2xsVHlwZSB9IGZyb20gXCIkbW9kdWxlL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9Sb2xsZXIgfSBmcm9tIFwiJG1vZHVsZS91dGlscy92ZXJldGVuby1yb2xsZXJcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9XZWFwb24gfSBmcm9tIFwiJG1vZHVsZS9pdGVtL3dlYXBvbi9kb2N1bWVudFwiO1xyXG5pbXBvcnQgeyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSwgVmVyZXRlbm9Bcm1vciwgVmVyZXRlbm9JdGVtIH0gZnJvbSBcIiRtb2R1bGUvaXRlbVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW1UeXBlIH0gZnJvbSBcIiRtb2R1bGUvaXRlbS9iYXNlL2RhdGFcIjtcclxuaW1wb3J0IHsgQXR0YWNrVHlwZSwgV2VhcG9uVHlwZSB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vd2VhcG9uL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9Sb2xsRGlhbG9nLCBWZXJldGVub1JvbGxEaWFsb2dBcmd1bWVudCB9IGZyb20gXCIkbW9kdWxlL2RpYWxvZ1wiO1xyXG5pbXBvcnQgeyBWZXJldGVub0VxdWlwbWVudCB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vZXF1aXBtZW50L2RvY3VtZW50XCI7XHJcblxyXG5hYnN0cmFjdCBjbGFzcyBWZXJldGVub0NyZWF0dXJlU2hlZXQ8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZT4gZXh0ZW5kcyBWZXJldGVub0FjdG9yU2hlZXQ8VEFjdG9yPntcclxuICAgIG92ZXJyaWRlIGFzeW5jIGdldERhdGEob3B0aW9uczogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4gPSB7fSk6IFByb21pc2U8VmVyZXRlbm9DcmVhdHVyZVNoZWV0RGF0YTxUQWN0b3I+PiB7XHJcbiAgICAgICAgY29uc3Qgc2hlZXREYXRhID0gYXdhaXQgc3VwZXIuZ2V0RGF0YShvcHRpb25zKTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgZm9yIChsZXQgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKGFjdG9yLlN0YXRzKSkge1xyXG4gICAgICAgICAgICAodiBhcyBTdGF0KS5sYWJlbCA9IGdhbWUuaTE4bi5sb2NhbGl6ZShgdmVyZXRlbm8uc3RhdC4ke2t9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoYWN0b3IuQXR0cmlidXRlcykpIHtcclxuICAgICAgICAgICAgKHYgYXMgQXR0cmlidXRlV2l0aFNraWxscykubGFiZWwgPSBnYW1lLmkxOG4ubG9jYWxpemUoYHZlcmV0ZW5vLmF0dHJpYnV0ZS4ke2t9YCk7XHJcbiAgICAgICAgICAgICh2IGFzIEF0dHJpYnV0ZVdpdGhTa2lsbHMpLnNraWxscyA9IHt9O1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgW2sxLCB2MV0gb2YgT2JqZWN0LmVudHJpZXMoYWN0b3IuU2tpbGxzKS5maWx0ZXIoeCA9PiB4WzFdLmF0dHJpYnV0ZSA9PT0gaykpIHtcclxuICAgICAgICAgICAgICAgICh2MSBhcyBTa2lsbCkubGFiZWwgPSBnYW1lLmkxOG4ubG9jYWxpemUoYHZlcmV0ZW5vLnNraWxsLiR7azF9YCk7XHJcbiAgICAgICAgICAgICAgICAodiBhcyBBdHRyaWJ1dGVXaXRoU2tpbGxzKS5za2lsbHNbazFdID0gdjE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGVxdWlwcGVkV2VhcG9ucyA9IGFjdG9yLkVxdWlwcGVkV2VhcG9ucy5tYXAoeCA9PiB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoeC5XZWFwb25UeXBlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFdlYXBvblR5cGUuQnJhd2xpbmc6XHJcbiAgICAgICAgICAgICAgICAgICAgeC5zeXN0ZW1bXCJpc0JyYXdsaW5nXCJdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIFdlYXBvblR5cGUuTWVsZWU6XHJcbiAgICAgICAgICAgICAgICAgICAgeC5zeXN0ZW1bXCJpc01lbGVlXCJdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIFdlYXBvblR5cGUuUmFuZ2VkOlxyXG4gICAgICAgICAgICAgICAgICAgIHguc3lzdGVtW1wiaXNSYW5nZWRcIl0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4geDtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgLi4uc2hlZXREYXRhLFxyXG4gICAgICAgICAgICBzdGF0czogYWN0b3IuU3RhdHMsXHJcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IGFjdG9yLkF0dHJpYnV0ZXMsXHJcbiAgICAgICAgICAgIHNraWxsczogYWN0b3IuU2tpbGxzLFxyXG4gICAgICAgICAgICBtYXhIcDogYWN0b3IuTWF4SHAsXHJcbiAgICAgICAgICAgIG1heFdwOiBhY3Rvci5NYXhXcCxcclxuICAgICAgICAgICAgd2VhcG9uczogYWN0b3IuV2VhcG9ucyxcclxuICAgICAgICAgICAgZXF1aXBwZWRXZWFwb25zOiBlcXVpcHBlZFdlYXBvbnMsXHJcbiAgICAgICAgICAgIGFybW9yczogYWN0b3IuQXJtb3JzLFxyXG4gICAgICAgICAgICBlcXVpcHBlZEFybW9yOiBhY3Rvci5FcXVpcHBlZEFybW9yLFxyXG4gICAgICAgICAgICBlcXVpcG1lbnQ6IGFjdG9yLkl0ZW1zLFxyXG4gICAgICAgICAgICBlcXVpcHBlZEVxdWlwbWVudDogYWN0b3IuRXF1aXBwZWRJdGVtc1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvdmVycmlkZSBhY3RpdmF0ZUxpc3RlbmVycygkaHRtbDogSlF1ZXJ5KTogdm9pZCB7XHJcbiAgICAgICAgc3VwZXIuYWN0aXZhdGVMaXN0ZW5lcnMoJGh0bWwpO1xyXG4gICAgICAgIGNvbnN0IGh0bWwgPSAkaHRtbFswXTtcclxuXHJcbiAgICAgICAgJGh0bWwub24oJ2NsaWNrJywgJy5za2lsbC1jaGVjaycsIHRoaXMuI29uU2tpbGxDaGVja1JvbGwuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgJGh0bWwub24oJ2NsaWNrJywgJy5pdGVtLWFjdGlvbicsIHRoaXMuI29uSXRlbUFjdGlvbi5iaW5kKHRoaXMpKTtcclxuICAgICAgICAkaHRtbC5vbignY2xpY2snLCAnLmFybW9yLWFjdGlvbicsIHRoaXMuI29uQXJtb3JBY3Rpb24uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgJGh0bWwub24oJ2NsaWNrJywgJy53ZWFwb24tYWN0aW9uJywgdGhpcy4jb25XZWFwb25BY3Rpb24uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIGh0bWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAnLml0ZW0tYWN0aW9uJywgdGhpcy4jb25JdGVtQWN0aW9uLmJpbmQodGhpcykpO1xyXG4gICAgICAgIC8vIGh0bWwub24oJ2NsaWNrJywgJy53ZWFwb24tYWN0aW9uJywgdGhpcy4jb25XZWFwb25BY3Rpb24uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgI29uU2tpbGxDaGVja1JvbGwoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG4gICAgICAgIGNvbnN0IGRhdGFzZXQgPSAoZWxlbWVudCBhcyBIVE1MQW5jaG9yRWxlbWVudCk/LmRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGNvbnN0IHNob3dEaWFsb2cgPSAoQ09ORklHLlNFVFRJTkdTLlNob3dUYXNrQ2hlY2tPcHRpb25zICE9PSBldmVudC5jdHJsS2V5KTtcclxuICAgICAgICBsZXQgZGlhbG9nUmVzdWx0ID0gbmV3IFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50KCk7XHJcbiAgICAgICAgaWYgKHNob3dEaWFsb2cpIHtcclxuICAgICAgICAgICAgZGlhbG9nUmVzdWx0ID0gYXdhaXQgKG5ldyBWZXJldGVub1JvbGxEaWFsb2coKSkuZ2V0VGFza0NoZWNrT3B0aW9ucygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRpYWxvZ1Jlc3VsdC5jYW5jZWxsZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHsgbGFiZWwsIHJvbGxLZXksIHJvbGxUeXBlIH0gPSBkYXRhc2V0O1xyXG5cclxuICAgICAgICBpZiAocm9sbEtleSA9PSBudWxsIHx8IHJvbGxUeXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJvbGxEYXRhID0gbmV3IFZlcmV0ZW5vUm9sbERhdGEoKTtcclxuICAgICAgICBpZiAocm9sbFR5cGUgPT0gXCJhdHRyaWJ1dGVcIikge1xyXG4gICAgICAgICAgICByb2xsRGF0YSA9IGF3YWl0IGFjdG9yLmdldEF0dHJpYnV0ZVJvbGxEYXRhKHJvbGxLZXkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJvbGxEYXRhID0gYXdhaXQgYWN0b3IuZ2V0U2tpbGxSb2xsRGF0YShyb2xsS2V5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJvbGxEYXRhLnBvb2wgKz0gZGlhbG9nUmVzdWx0Lm1vZGlmaWVyO1xyXG5cclxuXHJcbiAgICAgICAgbGV0IG1lc3NhZ2VEYXRhID0ge1xyXG4gICAgICAgICAgICB1c2VySWQ6IGdhbWUudXNlci5faWQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBzcGVha2VyOiBDaGF0TWVzc2FnZS5nZXRTcGVha2VyKCksXHJcbiAgICAgICAgICAgIGZsYXZvcjogbGFiZWwgfHwgJycsXHJcbiAgICAgICAgICAgIHNvdW5kOiBDT05GSUcuc291bmRzLmRpY2UsXHJcbiAgICAgICAgICAgIGJsaW5kOiBmYWxzZSB8fCBkaWFsb2dSZXN1bHQuYmxpbmRSb2xsIHx8IGV2ZW50LnNoaWZ0S2V5XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3Qgcm9sbE9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFZlcmV0ZW5vUm9sbFR5cGUuUmVndWxhcixcclxuICAgICAgICAgICAgbWVzc2FnZURhdGE6IG1lc3NhZ2VEYXRhLFxyXG4gICAgICAgICAgICByb2xsRGF0YTogcm9sbERhdGFcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJvbGxlciA9IG5ldyBWZXJldGVub1JvbGxlcigpO1xyXG4gICAgICAgIGF3YWl0IHJvbGxlci5yb2xsKHJvbGxPcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyAjb25XZWFwb25BY3Rpb24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG4gICAgICAgIGNvbnN0IGRhdGFzZXQgPSAoZWxlbWVudCBhcyBIVE1MQW5jaG9yRWxlbWVudCk/LmRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgaXRlbVR5cGUsIGFjdGlvblR5cGUsIGl0ZW1JZCwgd2VhcG9uVHlwZSwgYXR0YWNrVHlwZSB9ID0gZGF0YXNldDtcclxuXHJcbiAgICAgICAgaWYgKGl0ZW1JZCA9PSBudWxsIHx8IGl0ZW1JZCA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY2hhdE9wdGlvbnM6IFZlcmV0ZW5vQ2hhdE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGlzQmxpbmQ6IGZhbHNlIHx8IGV2ZW50LnNoaWZ0S2V5LFxyXG4gICAgICAgICAgICBzaG93RGlhbG9nOiAoQ09ORklHLlNFVFRJTkdTLlNob3dUYXNrQ2hlY2tPcHRpb25zICE9PSBldmVudC5jdHJsS2V5KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFjdGlvblR5cGUgPT09ICdpbml0aWF0aXZlJykge1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yb2xsV2VhcG9uSW5pdGlhdGl2ZShpdGVtSWQsIGNoYXRPcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoYWN0aW9uVHlwZSA9PT0gJ2F0dGFjaycpIHtcclxuICAgICAgICAgICAgbGV0IHdlYXBvbkRhdGE6IFdlYXBvbkF0dGFja0luZm8gPSB7XHJcbiAgICAgICAgICAgICAgICBpZDogaXRlbUlkLFxyXG4gICAgICAgICAgICAgICAgd2VhcG9uVHlwZTogd2VhcG9uVHlwZSBhcyBXZWFwb25UeXBlLFxyXG4gICAgICAgICAgICAgICAgYXR0YWNrVHlwZTogYXR0YWNrVHlwZSBhcyBBdHRhY2tUeXBlXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yb2xsV2VhcG9uQXR0YWNrKHdlYXBvbkRhdGEsIGNoYXRPcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcm9sbFdlYXBvbkluaXRpYXRpdmUod2VhcG9uSWQ6IHN0cmluZywgY2hhdE9wdGlvbnM6IFZlcmV0ZW5vQ2hhdE9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgZGlhbG9nUmVzdWx0ID0gbmV3IFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50KCk7XHJcbiAgICAgICAgaWYgKGNoYXRPcHRpb25zLnNob3dEaWFsb2cpIHtcclxuICAgICAgICAgICAgZGlhbG9nUmVzdWx0ID0gYXdhaXQgKG5ldyBWZXJldGVub1JvbGxEaWFsb2coKSkuZ2V0VGFza0NoZWNrT3B0aW9ucygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRpYWxvZ1Jlc3VsdC5jYW5jZWxsZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbWVzc2FnZURhdGE6IFZlcmV0ZW5vTWVzc2FnZURhdGEgPSB7XHJcbiAgICAgICAgICAgIHVzZXJJZDogZ2FtZS51c2VyLl9pZCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIHNwZWFrZXI6IENoYXRNZXNzYWdlLmdldFNwZWFrZXIoKSxcclxuICAgICAgICAgICAgZmxhdm9yOiAnXHUwNDE4XHUwNDNEXHUwNDM4XHUwNDQ2XHUwNDM4XHUwNDMwXHUwNDQyXHUwNDM4XHUwNDMyXHUwNDMwJyxcclxuICAgICAgICAgICAgc291bmQ6IENPTkZJRy5zb3VuZHMuZGljZSxcclxuICAgICAgICAgICAgYmxpbmQ6IGNoYXRPcHRpb25zLmlzQmxpbmQgfHwgZGlhbG9nUmVzdWx0LmJsaW5kUm9sbFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCBpbml0aWF0aXZlUm9sbERhdGEgPSBhd2FpdCBhY3Rvci5nZXRJbml0aWF0aXZlUm9sbERhdGEod2VhcG9uSWQpO1xyXG4gICAgICAgIGlmIChpbml0aWF0aXZlUm9sbERhdGEgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbml0aWF0aXZlUm9sbERhdGEuYm9udXMgKz0gZGlhbG9nUmVzdWx0Lm1vZGlmaWVyO1xyXG5cclxuICAgICAgICBjb25zdCByb2xsT3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgdHlwZTogVmVyZXRlbm9Sb2xsVHlwZS5Jbml0aWF0aXZlLFxyXG4gICAgICAgICAgICBtZXNzYWdlRGF0YSxcclxuICAgICAgICAgICAgcm9sbERhdGE6IGluaXRpYXRpdmVSb2xsRGF0YVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdmVyZXRlbm9Sb2xsSGFuZGxlciA9IG5ldyBWZXJldGVub1JvbGxlcigpO1xyXG4gICAgICAgIGF3YWl0IHZlcmV0ZW5vUm9sbEhhbmRsZXIucm9sbEluaXRpYXRpdmUocm9sbE9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJvbGxXZWFwb25BdHRhY2sod2VhcG9uRGF0YTogV2VhcG9uQXR0YWNrSW5mbywgY2hhdE9wdGlvbnM6IFZlcmV0ZW5vQ2hhdE9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgZGlhbG9nUmVzdWx0ID0gbmV3IFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50KCk7XHJcbiAgICAgICAgaWYgKGNoYXRPcHRpb25zLnNob3dEaWFsb2cpIHtcclxuICAgICAgICAgICAgZGlhbG9nUmVzdWx0ID0gYXdhaXQgKG5ldyBWZXJldGVub1JvbGxEaWFsb2coKSkuZ2V0VGFza0NoZWNrT3B0aW9ucygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRpYWxvZ1Jlc3VsdC5jYW5jZWxsZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbWVzc2FnZURhdGE6IFZlcmV0ZW5vTWVzc2FnZURhdGEgPSB7XHJcbiAgICAgICAgICAgIHVzZXJJZDogZ2FtZS51c2VyLl9pZCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIHNwZWFrZXI6IENoYXRNZXNzYWdlLmdldFNwZWFrZXIoKSxcclxuICAgICAgICAgICAgZmxhdm9yOiB3ZWFwb25EYXRhLndlYXBvblR5cGUsXHJcbiAgICAgICAgICAgIHNvdW5kOiBDT05GSUcuc291bmRzLmRpY2UsXHJcbiAgICAgICAgICAgIGJsaW5kOiBjaGF0T3B0aW9ucy5pc0JsaW5kIHx8IGRpYWxvZ1Jlc3VsdC5ibGluZFJvbGxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQgd2VhcG9uUm9sbERhdGEgPSBhd2FpdCBhY3Rvci5nZXRXZWFwb25Sb2xsRGF0YSh3ZWFwb25EYXRhKTtcclxuICAgICAgICB3ZWFwb25Sb2xsRGF0YS5wb29sICs9IGRpYWxvZ1Jlc3VsdC5tb2RpZmllcjtcclxuXHJcbiAgICAgICAgY29uc3Qgcm9sbE9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFZlcmV0ZW5vUm9sbFR5cGUuQXR0YWNrLFxyXG4gICAgICAgICAgICBtZXNzYWdlRGF0YSxcclxuICAgICAgICAgICAgcm9sbERhdGE6IHdlYXBvblJvbGxEYXRhXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB2ZXJldGVub1JvbGxIYW5kbGVyID0gbmV3IFZlcmV0ZW5vUm9sbGVyKCk7XHJcbiAgICAgICAgYXdhaXQgdmVyZXRlbm9Sb2xsSGFuZGxlci5yb2xsKHJvbGxPcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyAjb25JdGVtQWN0aW9uKGV2ZW50OiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBjb25zdCBlbGVtZW50ID0gZXZlbnQuY3VycmVudFRhcmdldDtcclxuICAgICAgICBjb25zdCBkYXRhc2V0ID0gKGVsZW1lbnQgYXMgSFRNTEFuY2hvckVsZW1lbnQpPy5kYXRhc2V0O1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW1UeXBlLCBhY3Rpb25UeXBlLCBpdGVtSWQgfSA9IGRhdGFzZXQ7XHJcbiAgICAgICAgY29uc3QgaXRlbUluZm86IEl0ZW1BY3Rpb25JbmZvID0geyB0eXBlOiAoaXRlbVR5cGUhIGFzIFZlcmV0ZW5vSXRlbVR5cGUpLCBpZDogaXRlbUlkISB9O1xyXG5cclxuICAgICAgICBzd2l0Y2ggKGFjdGlvblR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAncmVtb3ZlJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJlbW92ZUl0ZW0oaXRlbUluZm8pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdlcXVpcCc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5lcXVpcEl0ZW0oaXRlbUluZm8pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICd1bmVxdWlwJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnVuZXF1aXBJdGVtKGl0ZW1JbmZvKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnc2hlZXQnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheVNoZWV0KGl0ZW1JbmZvKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVtb3ZlSXRlbShpdGVtSW5mbzogSXRlbUFjdGlvbkluZm8pOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5hY3Rvci5pdGVtcy5nZXQoaXRlbUluZm8uaWQpO1xyXG4gICAgICAgIGlmICghaXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFjdG9yLmRlbGV0ZUVtYmVkZGVkRG9jdW1lbnRzKFwiSXRlbVwiLCBbaXRlbS5faWQhXSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXF1aXBJdGVtKGl0ZW1JbmZvOiBJdGVtQWN0aW9uSW5mbyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHN3aXRjaCAoaXRlbUluZm8udHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlICd3ZWFwb24nOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZXF1aXBXZWFwb24oaXRlbUluZm8uaWQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdhcm1vcic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5lcXVpcEFybW9yKGl0ZW1JbmZvLmlkKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXF1aXBXZWFwb24oaXRlbUlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5hY3Rvci5pdGVtcy5maW5kKHggPT4geC5faWQgPT09IGl0ZW1JZCk7XHJcbiAgICAgICAgaWYgKCFpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQ0M1x1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNlx1MDQzNFx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSwgXHUwNDM1XHUwNDQxXHUwNDNCXHUwNDM4IFx1MDQ0RFx1MDQzQVx1MDQzOFx1MDQzRlx1MDQzOFx1MDQ0MFx1MDQzRVx1MDQzMlx1MDQzMFx1MDQzRFx1MDQzRSBcdTA0MzFcdTA0M0VcdTA0M0JcdTA0NENcdTA0NDhcdTA0MzUgMiBcdTA0NERcdTA0M0JcdTA0MzVcdTA0M0NcdTA0MzVcdTA0M0RcdTA0NDJcdTA0M0VcdTA0MzIgXHUwNDNFXHUwNDQwXHUwNDQzXHUwNDM2XHUwNDM4XHUwNDRGLlxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLmFjdG9yLnVwZGF0ZUVtYmVkZGVkRG9jdW1lbnRzKFwiSXRlbVwiLCBbXHJcbiAgICAgICAgICAgIHsgX2lkOiBpdGVtLl9pZCEsIFwic3lzdGVtLmlzRXF1aXBwZWRcIjogdHJ1ZSB9LFxyXG4gICAgICAgIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGVxdWlwQXJtb3IoaXRlbUlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBlcXVpcHBlZEFybW9yID0gdGhpcy5hY3Rvci5pdGVtcy5maW5kKHggPT4gKHggYXMgdW5rbm93biBhcyBWZXJldGVub0FybW9yKS5zeXN0ZW0uaXNFcXVpcHBlZCAmJiB4LnR5cGUgPT09IFZlcmV0ZW5vSXRlbVR5cGUuQXJtb3IpO1xyXG4gICAgICAgIGlmIChlcXVpcHBlZEFybW9yKSB7XHJcbiAgICAgICAgICAgIC8vIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQ0M1x1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNlx1MDQzNFx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSwgXHUwNDM1XHUwNDQxXHUwNDNCXHUwNDM4IFx1MDQzMVx1MDQ0MFx1MDQzRVx1MDQzRFx1MDQ0RiBcdTA0NDNcdTA0MzZcdTA0MzUgXHUwNDREXHUwNDNBXHUwNDM4XHUwNDNGXHUwNDM4XHUwNDQwXHUwNDNFXHUwNDMyXHUwNDMwXHUwNDNEXHUwNDMwLlxyXG5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuYWN0b3IuaXRlbXMuZmluZCh4ID0+IHguX2lkID09PSBpdGVtSWQpO1xyXG4gICAgICAgIGlmICghaXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLmFjdG9yLnVwZGF0ZUVtYmVkZGVkRG9jdW1lbnRzKFwiSXRlbVwiLCBbXHJcbiAgICAgICAgICAgIHsgX2lkOiBpdGVtLl9pZCEsIFwic3lzdGVtLmlzRXF1aXBwZWRcIjogdHJ1ZSB9LFxyXG4gICAgICAgIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHVuZXF1aXBJdGVtKGl0ZW1JbmZvOiBJdGVtQWN0aW9uSW5mbyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmFjdG9yLml0ZW1zLmZpbmQoeCA9PiB4Ll9pZCA9PT0gaXRlbUluZm8uaWRcclxuICAgICAgICAgICAgJiYgKHggYXMgdW5rbm93biBhcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSkuc3lzdGVtXHJcbiAgICAgICAgICAgICYmICh4IGFzIHVua25vd24gYXMgUGh5c2ljYWxWZXJldGVub0l0ZW0pLnN5c3RlbS5pc0VxdWlwcGVkXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKCFpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMuYWN0b3IudXBkYXRlRW1iZWRkZWREb2N1bWVudHMoXCJJdGVtXCIsIFtcclxuICAgICAgICAgICAgeyBfaWQ6IGl0ZW0uX2lkISwgXCJzeXN0ZW0uaXNFcXVpcHBlZFwiOiBmYWxzZSB9LFxyXG4gICAgICAgIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3BsYXlTaGVldChpdGVtSW5mbzogSXRlbUFjdGlvbkluZm8pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5hY3Rvci5pdGVtcy5nZXQoaXRlbUluZm8uaWQpO1xyXG4gICAgICAgIGlmICghaXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpdGVtLnNoZWV0LnJlbmRlcih0cnVlLCB7IGVkaXRhYmxlOiB0cnVlIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jICNvbkFybW9yQWN0aW9uKGV2ZW50OiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBjb25zdCBlbGVtZW50ID0gZXZlbnQuY3VycmVudFRhcmdldDtcclxuICAgICAgICBjb25zdCBkYXRhc2V0ID0gKGVsZW1lbnQgYXMgSFRNTEFuY2hvckVsZW1lbnQpPy5kYXRhc2V0O1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW1UeXBlLCBhY3Rpb25UeXBlLCBpdGVtSWQgfSA9IGRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGNvbnN0IGNoYXRPcHRpb25zOiBWZXJldGVub0NoYXRPcHRpb25zID0ge1xyXG4gICAgICAgICAgICBpc0JsaW5kOiBmYWxzZSB8fCBldmVudC5zaGlmdEtleSxcclxuICAgICAgICAgICAgc2hvd0RpYWxvZzogKENPTkZJRy5TRVRUSU5HUy5TaG93VGFza0NoZWNrT3B0aW9ucyAhPT0gZXZlbnQuY3RybEtleSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpdGVtSWQgPT0gbnVsbCB8fCBpdGVtSWQgPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VEYXRhID0ge1xyXG4gICAgICAgICAgICB1c2VySWQ6IGdhbWUudXNlci5faWQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBzcGVha2VyOiBDaGF0TWVzc2FnZS5nZXRTcGVha2VyKCksXHJcbiAgICAgICAgICAgIGZsYXZvcjogJycsXHJcbiAgICAgICAgICAgIHNvdW5kOiBDT05GSUcuc291bmRzLmRpY2UsXHJcbiAgICAgICAgICAgIGJsaW5kOiBmYWxzZVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uVHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlICdibG9jayc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yb2xsQXJtb3JCbG9jayhpdGVtSWQsIGNoYXRPcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdhYmxhdGUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuYWJsYXRlQXJtb3IoaXRlbUlkKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdyZXBhaXInOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVwYWlyQXJtb3IoaXRlbUlkKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByb2xsQXJtb3JCbG9jayhhcm1vcklkOiBzdHJpbmcsIGNoYXRPcHRpb25zOiBWZXJldGVub0NoYXRPcHRpb25zKSB7XHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGRpYWxvZ1Jlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEaWFsb2dBcmd1bWVudCgpO1xyXG4gICAgICAgIGlmIChjaGF0T3B0aW9ucy5zaG93RGlhbG9nKSB7XHJcbiAgICAgICAgICAgIGRpYWxvZ1Jlc3VsdCA9IGF3YWl0IChuZXcgVmVyZXRlbm9Sb2xsRGlhbG9nKCkpLmdldFRhc2tDaGVja09wdGlvbnMoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkaWFsb2dSZXN1bHQuY2FuY2VsbGVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VEYXRhOiBWZXJldGVub01lc3NhZ2VEYXRhID0ge1xyXG4gICAgICAgICAgICB1c2VySWQ6IGdhbWUudXNlci5faWQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBzcGVha2VyOiBDaGF0TWVzc2FnZS5nZXRTcGVha2VyKCksXHJcbiAgICAgICAgICAgIGZsYXZvcjogJ1x1MDQxN1x1MDQzMFx1MDQ0OVx1MDQzOFx1MDQ0Mlx1MDQzMCcsXHJcbiAgICAgICAgICAgIHNvdW5kOiBDT05GSUcuc291bmRzLmRpY2UsXHJcbiAgICAgICAgICAgIGJsaW5kOiBjaGF0T3B0aW9ucy5pc0JsaW5kIHx8IGRpYWxvZ1Jlc3VsdC5ibGluZFJvbGxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQgYXJtb3JSb2xsRGF0YSA9IGF3YWl0IGFjdG9yLmdldEFybW9yUm9sbERhdGEoYXJtb3JJZCk7XHJcbiAgICAgICAgaWYgKGFybW9yUm9sbERhdGEgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcm1vclJvbGxEYXRhLnBvb2wgKz0gZGlhbG9nUmVzdWx0Lm1vZGlmaWVyO1xyXG5cclxuICAgICAgICBjb25zdCByb2xsT3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgdHlwZTogVmVyZXRlbm9Sb2xsVHlwZS5Bcm1vckJsb2NrLFxyXG4gICAgICAgICAgICBtZXNzYWdlRGF0YSxcclxuICAgICAgICAgICAgcm9sbERhdGE6IGFybW9yUm9sbERhdGFcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyb2xsT3B0aW9ucy5yb2xsRGF0YS5wb29sID09IDApIHtcclxuICAgICAgICAgICAgLy8gXHUwNDQxXHUwNDNFXHUwNDNFXHUwNDMxXHUwNDQ5XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1IFx1MDQzRSBcdTA0NDBcdTA0MzBcdTA0MzdcdTA0MzFcdTA0MzhcdTA0NDJcdTA0M0VcdTA0MzkgXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDNEXHUwNDM1LlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB2ZXJldGVub1JvbGxIYW5kbGVyID0gbmV3IFZlcmV0ZW5vUm9sbGVyKCk7XHJcbiAgICAgICAgYXdhaXQgdmVyZXRlbm9Sb2xsSGFuZGxlci5yb2xsKHJvbGxPcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBhYmxhdGVBcm1vcihhcm1vcklkOiBzdHJpbmcsIHZhbHVlOiBudW1iZXIgPSAxKSB7XHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHZhbHVlIDwgMSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBhcm1vciA9ICh0aGlzLmFjdG9yLml0ZW1zLmZpbmQoeCA9PiB4Ll9pZCA9PT0gYXJtb3JJZCkgYXMgdW5rbm93biBhcyBWZXJldGVub0FybW9yKTtcclxuICAgICAgICBpZiAoIWFybW9yKSB7XHJcbiAgICAgICAgICAgIC8vIFx1MDQ0MVx1MDQzRVx1MDQzRVx1MDQzMVx1MDQ0OVx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSBcdTA0M0VcdTA0MzEgXHUwNDNFXHUwNDQxXHUwNDQyXHUwNDQzXHUwNDQyXHUwNDQxXHUwNDQyXHUwNDMyXHUwNDQzXHUwNDRFXHUwNDQ5XHUwNDM1XHUwNDNDIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQzQ1x1MDQzNVx1MDQ0Mlx1MDQzNS5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFybW9yLnN5c3RlbS5kdXJhYmlsaXR5ID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQ0M1x1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNlx1MDQzNFx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSBcdTA0M0UgXHUwNDQwXHUwNDMwXHUwNDM3XHUwNDMxXHUwNDM4XHUwNDQyXHUwNDNFXHUwNDM5IFx1MDQzMVx1MDQ0MFx1MDQzRVx1MDQzRFx1MDQzNS5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgLT0gdmFsdWU7XHJcblxyXG4gICAgICAgIGlmIChhcm1vci5zeXN0ZW0uZHVyYWJpbGl0eSA8IDApIHtcclxuICAgICAgICAgICAgYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFybW9yLnN5c3RlbS5kdXJhYmlsaXR5ID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQ0M1x1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNlx1MDQzNFx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSBcdTA0M0UgXHUwNDQwXHUwNDMwXHUwNDM3XHUwNDMxXHUwNDM4XHUwNDQyXHUwNDNFXHUwNDM5IFx1MDQzMVx1MDQ0MFx1MDQzRVx1MDQzRFx1MDQzNS5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMuYWN0b3IudXBkYXRlRW1iZWRkZWREb2N1bWVudHMoXCJJdGVtXCIsIFtcclxuICAgICAgICAgICAgeyBfaWQ6IGFybW9yLl9pZCEsIFwic3lzdGVtLmR1cmFiaWxpdHlcIjogYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgfSxcclxuICAgICAgICBdKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZXBhaXJBcm1vcihhcm1vcklkOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBhcm1vciA9ICh0aGlzLmFjdG9yLml0ZW1zLmZpbmQoeCA9PiB4Ll9pZCA9PT0gYXJtb3JJZCkgYXMgdW5rbm93biBhcyBWZXJldGVub0FybW9yKTtcclxuICAgICAgICBpZiAoIWFybW9yKSB7XHJcbiAgICAgICAgICAgIC8vIFx1MDQ0MVx1MDQzRVx1MDQzRVx1MDQzMVx1MDQ0OVx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSBcdTA0M0VcdTA0MzEgXHUwNDNFXHUwNDQxXHUwNDQyXHUwNDQzXHUwNDQyXHUwNDQxXHUwNDQyXHUwNDMyXHUwNDQzXHUwNDRFXHUwNDQ5XHUwNDM1XHUwNDNDIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQzQ1x1MDQzNVx1MDQ0Mlx1MDQzNVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbWF4RHVyYWJpbGl0eSA9IGFybW9yLnN5c3RlbS5hcm1vckNsYXNzICsgYXJtb3Iuc3lzdGVtLnF1YWxpdHlcclxuICAgICAgICBpZiAoYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgPT09IG1heER1cmFiaWxpdHkpIHtcclxuICAgICAgICAgICAgLy8gXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDQzXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM2XHUwNDM0XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1IFx1MDQzRSBcdTA0NDZcdTA0MzVcdTA0M0JcdTA0M0VcdTA0MzkgXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDNEXHUwNDM1LlxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5hY3Rvci51cGRhdGVFbWJlZGRlZERvY3VtZW50cyhcIkl0ZW1cIiwgW1xyXG4gICAgICAgICAgICB7IF9pZDogYXJtb3IuX2lkISwgXCJzeXN0ZW0uZHVyYWJpbGl0eVwiOiBtYXhEdXJhYmlsaXR5IH0sXHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0NyZWF0dXJlU2hlZXREYXRhPFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU+IGV4dGVuZHMgVmVyZXRlbm9BY3RvclNoZWV0RGF0YTxUQWN0b3I+IHtcclxuICAgIHN0YXRzOiBTdGF0c0Jsb2NrO1xyXG4gICAgYXR0cmlidXRlczogQXR0cmlidXRlc0Jsb2NrO1xyXG4gICAgc2tpbGxzOiBTa2lsbHNCbG9jaztcclxuICAgIG1heEhwOiBudW1iZXI7XHJcbiAgICBtYXhXcDogbnVtYmVyO1xyXG4gICAgd2VhcG9uczogVmVyZXRlbm9XZWFwb25bXTtcclxuICAgIGVxdWlwcGVkV2VhcG9uczogVmVyZXRlbm9XZWFwb25bXTtcclxuICAgIGFybW9yczogVmVyZXRlbm9Bcm1vcltdO1xyXG4gICAgZXF1aXBwZWRBcm1vcjogVmVyZXRlbm9Bcm1vcjtcclxuICAgIGVxdWlwbWVudDogVmVyZXRlbm9FcXVpcG1lbnRbXTtcclxuICAgIGVxdWlwcGVkRXF1aXBtZW50OiBWZXJldGVub0VxdWlwbWVudFtdO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0NyZWF0dXJlU2hlZXQgfVxyXG5leHBvcnQgdHlwZSB7IFZlcmV0ZW5vQ3JlYXR1cmVTaGVldERhdGEgfSIsICJpbXBvcnQgeyBWZXJldGVub0NoYXJhY3RlciB9IGZyb20gXCIuLlwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0NyZWF0dXJlU2hlZXQsIFZlcmV0ZW5vQ3JlYXR1cmVTaGVldERhdGEgfSBmcm9tIFwiLi4vY3JlYXR1cmUvc2hlZXRcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vQ2hhcmFjdGVyU2hlZXQ8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9DaGFyYWN0ZXI+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZVNoZWV0PFRBY3Rvcj57XHJcbiAgICBzdGF0aWMgb3ZlcnJpZGUgZ2V0IGRlZmF1bHRPcHRpb25zKCk6IEFjdG9yU2hlZXRPcHRpb25zIHtcclxuICAgICAgICBjb25zdCBzdXBlck9wdGlvbnMgPSBzdXBlci5kZWZhdWx0T3B0aW9ucztcclxuICAgICAgICBjb25zdCBtZXJnZWRPYmplY3QgPSBtZXJnZU9iamVjdChzdXBlck9wdGlvbnMsIHtcclxuICAgICAgICAgICAgd2lkdGg6IDU2MCxcclxuICAgICAgICAgICAgY2xhc3NlczogWy4uLnN1cGVyT3B0aW9ucy5jbGFzc2VzLCAnY2hhcmFjdGVyLXNoZWV0J10sXHJcbiAgICAgICAgICAgIHRhYnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuYXZTZWxlY3RvcjogXCIuc2hlZXQtdGFic1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRTZWxlY3RvcjogXCIuc2hlZXQtYm9keVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluaXRpYWw6IFwibWFpblwiLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbWVyZ2VkT2JqZWN0O1xyXG4gICAgfVxyXG5cclxuICAgIG92ZXJyaWRlIGFzeW5jIGdldERhdGEob3B0aW9uczogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4gPSB7fSk6IFByb21pc2U8VmVyZXRlbm9DaGFyYWN0ZXJTaGVldERhdGE8VEFjdG9yPj4ge1xyXG4gICAgICAgIGNvbnN0IHNoZWV0RGF0YSA9IGF3YWl0IHN1cGVyLmdldERhdGEob3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIC4uLnNoZWV0RGF0YSxcclxuICAgICAgICAgICAgbW9uZXk6IGFjdG9yLk1vbmV5LFxyXG4gICAgICAgICAgICByZXB1dGF0aW9uOiBhY3Rvci5SZXB1dGF0aW9uLFxyXG4gICAgICAgICAgICBleHA6IGFjdG9yLkV4cFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRlbXBsYXRlKCkge1xyXG4gICAgICAgIHJldHVybiBgc3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL2FjdG9ycy9jaGFyYWN0ZXItc2hlZXQuaGJzYDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQ2hhcmFjdGVyU2hlZXREYXRhPFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vQ2hhcmFjdGVyPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmVTaGVldERhdGE8VEFjdG9yPiB7XHJcbiAgICBtb25leTogbnVtYmVyO1xyXG4gICAgcmVwdXRhdGlvbjogbnVtYmVyO1xyXG4gICAgZXhwOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQ2hhcmFjdGVyU2hlZXQgfSIsICJpbXBvcnQgeyBWZXJldGVub01vbnN0ZXIgfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9DcmVhdHVyZVNoZWV0IH0gZnJvbSBcIi4uL2NyZWF0dXJlL3NoZWV0XCI7XHJcblxyXG5jbGFzcyBWZXJldGVub01vbnN0ZXJTaGVldDxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub01vbnN0ZXI+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZVNoZWV0PFRBY3Rvcj57XHJcblxyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub01vbnN0ZXJTaGVldCB9IiwgImltcG9ydCB7IFZlcmV0ZW5vTnBjIH0gZnJvbSBcIi4uXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmVTaGVldCB9IGZyb20gXCIuLi9jcmVhdHVyZS9zaGVldFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9OcGNTaGVldDxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub05wYz4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlU2hlZXQ8VEFjdG9yPntcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vTnBjU2hlZXQgfSIsICJleHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJTZXR0aW5ncygpOiB2b2lkIHtcclxuICAgIGdhbWUuc2V0dGluZ3MucmVnaXN0ZXIoXCJ2ZXJldGVub1wiLCBcInZpc2liaWxpdHkuc2hvd1Rhc2tDaGVja09wdGlvbnNcIiwge1xyXG4gICAgICAgIG5hbWU6IFwidmVyZXRlbm8uc2V0dGluZ3Muc2hvd1Rhc2tDaGVja09wdGlvbnMubmFtZVwiLFxyXG4gICAgICAgIGhpbnQ6IFwidmVyZXRlbm8uc2V0dGluZ3Muc2hvd1Rhc2tDaGVja09wdGlvbnMuaGludFwiLFxyXG4gICAgICAgIHNjb3BlOiBcImNsaWVudFwiLFxyXG4gICAgICAgIGNvbmZpZzogdHJ1ZSxcclxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxyXG4gICAgICAgIHR5cGU6IEJvb2xlYW5cclxuICAgIH0pO1xyXG59IiwgImNsYXNzIFZlcmV0ZW5vQ2xpZW50U2V0dGluZ3Mge1xyXG4gICAgZ2V0IFNob3dUYXNrQ2hlY2tPcHRpb25zKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiBnYW1lLnNldHRpbmdzLmdldChcInZlcmV0ZW5vXCIsIFwidmlzaWJpbGl0eS5zaG93VGFza0NoZWNrT3B0aW9uc1wiKSBhcyBib29sZWFuO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9DbGllbnRTZXR0aW5ncyB7XHJcbiAgICBTaG93VGFza0NoZWNrT3B0aW9uczogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9DbGllbnRTZXR0aW5ncyB9OyIsICJpbXBvcnQgeyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQsIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGEgfSBmcm9tIFwiLi4vcGh5c2ljYWwtaXRlbS9zaGVldFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0VxdWlwbWVudCB9IGZyb20gXCIuL2RvY3VtZW50XCI7XHJcblxyXG5jbGFzcyBWZXJldGVub0VxdWlwbWVudFNoZWV0IGV4dGVuZHMgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0PFZlcmV0ZW5vRXF1aXBtZW50PiB7XHJcbiAgICBvdmVycmlkZSBhc3luYyBnZXREYXRhKG9wdGlvbnM/OiBQYXJ0aWFsPERvY3VtZW50U2hlZXRPcHRpb25zPik6IFByb21pc2U8VmVyZXRlbm9FcXVpcG1lbnRTaGVldERhdGE+IHtcclxuICAgICAgICBjb25zdCBzaGVldERhdGEgPSBhd2FpdCBzdXBlci5nZXREYXRhKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW0gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogVmVyZXRlbm9FcXVpcG1lbnRTaGVldERhdGEgPSB7XHJcbiAgICAgICAgICAgIC4uLnNoZWV0RGF0YSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB0ZW1wbGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gYHN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9pdGVtcy9lcXVpcG1lbnQtc2hlZXQuaGJzYDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vRXF1aXBtZW50U2hlZXREYXRhIGV4dGVuZHMgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YTxWZXJldGVub0VxdWlwbWVudD4ge1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0VxdWlwbWVudFNoZWV0IH07XHJcbmV4cG9ydCB0eXBlIHsgVmVyZXRlbm9FcXVpcG1lbnRTaGVldERhdGEgfTsiLCAiaW1wb3J0IHsgVmVyZXRlbm9Bcm1vclNoZWV0IH0gZnJvbSAnJG1vZHVsZS9pdGVtL2FybW9yL3NoZWV0JztcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtU2hlZXQgfSBmcm9tICckbW9kdWxlL2l0ZW0vYmFzZS9zaGVldCc7XHJcbmltcG9ydCB7IFZFUkVURU5PQ09ORklHIH0gZnJvbSAnLi4vLi4vdmVyZXRlbm9Db25maWcnO1xyXG5pbXBvcnQgeyBWRVJFVEVOT19QQVJUSUFMUyB9IGZyb20gJy4uLy4uL3BhcnRpYWxzJztcclxuaW1wb3J0IHsgVmVyZXRlbm9XZWFwb25TaGVldCB9IGZyb20gJyRtb2R1bGUvaXRlbS93ZWFwb24vc2hlZXQnO1xyXG5pbXBvcnQgeyBWZXJldGVub0NoYXJhY3RlclNoZWV0IH0gZnJvbSAnJG1vZHVsZS9hY3Rvci9jaGFyYWN0ZXIvc2hlZXQnO1xyXG5pbXBvcnQgeyBWZXJldGVub01vbnN0ZXJTaGVldCB9IGZyb20gJyRtb2R1bGUvYWN0b3IvbW9uc3Rlci9zaGVldCc7XHJcbmltcG9ydCB7IFZlcmV0ZW5vTnBjU2hlZXQgfSBmcm9tICckbW9kdWxlL2FjdG9yL25wYy9zaGVldCc7XHJcbmltcG9ydCB7IHJlZ2lzdGVyU2V0dGluZ3MgfSBmcm9tICckbW9kdWxlL3N5c3RlbS9zZXR0aW5ncyc7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ2xpZW50U2V0dGluZ3MgfSBmcm9tICckbW9kdWxlL3N5c3RlbS9zZXR0aW5ncy9jbGllbnQtc2V0dGluZ3MnO1xyXG5pbXBvcnQgeyBWZXJldGVub0VxdWlwbWVudFNoZWV0IH0gZnJvbSAnJG1vZHVsZS9pdGVtL2VxdWlwbWVudC9zaGVldCc7XHJcblxyXG5mdW5jdGlvbiBwcmVsb2FkSGFuZGxlYmFyc1RlbXBsYXRlcygpIHtcclxuICAgIHJldHVybiBsb2FkVGVtcGxhdGVzKFZFUkVURU5PX1BBUlRJQUxTKTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IEluaXQgPSB7XHJcbiAgICBsaXN0ZW4oKTogdm9pZCB7XHJcbiAgICAgICAgSG9va3Mub25jZSgnaW5pdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJWZXJldGVubyB8IFN5c3RlbSBpbml0IGJlZ2luLlwiKTtcclxuXHJcbiAgICAgICAgICAgIENPTkZJRy5WRVJFVEVOTyA9IFZFUkVURU5PQ09ORklHO1xyXG4gICAgICAgICAgICBDT05GSUcuU0VUVElOR1MgPSBuZXcgVmVyZXRlbm9DbGllbnRTZXR0aW5ncygpO1xyXG5cclxuICAgICAgICAgICAgQWN0b3JzLnVucmVnaXN0ZXJTaGVldCgnY29yZScsIEFjdG9yU2hlZXQpO1xyXG4gICAgICAgICAgICBBY3RvcnMucmVnaXN0ZXJTaGVldCgndmVyZXRlbm8nLCBWZXJldGVub0NoYXJhY3RlclNoZWV0LCB7XHJcbiAgICAgICAgICAgICAgICB0eXBlczogWydjaGFyYWN0ZXInXSxcclxuICAgICAgICAgICAgICAgIG1ha2VEZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBBY3RvcnMucmVnaXN0ZXJTaGVldCgndmVyZXRlbm8nLCBWZXJldGVub01vbnN0ZXJTaGVldCwge1xyXG4gICAgICAgICAgICAgICAgdHlwZXM6IFsnbW9uc3RlciddLFxyXG4gICAgICAgICAgICAgICAgbWFrZURlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIEFjdG9ycy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vTnBjU2hlZXQsIHtcclxuICAgICAgICAgICAgICAgIHR5cGVzOiBbJ25wYyddLFxyXG4gICAgICAgICAgICAgICAgbWFrZURlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBJdGVtcy51bnJlZ2lzdGVyU2hlZXQoJ2NvcmUnLCBJdGVtU2hlZXQpO1xyXG4gICAgICAgICAgICBJdGVtcy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vSXRlbVNoZWV0LCB7XHJcbiAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgSXRlbXMucmVnaXN0ZXJTaGVldCgndmVyZXRlbm8nLCBWZXJldGVub0FybW9yU2hlZXQsIHtcclxuICAgICAgICAgICAgICAgIHR5cGVzOiBbJ2FybW9yJ10sXHJcbiAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgSXRlbXMucmVnaXN0ZXJTaGVldCgndmVyZXRlbm8nLCBWZXJldGVub1dlYXBvblNoZWV0LCB7XHJcbiAgICAgICAgICAgICAgICB0eXBlczogWyd3ZWFwb24nXSxcclxuICAgICAgICAgICAgICAgIG1ha2VEZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBJdGVtcy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vRXF1aXBtZW50U2hlZXQsIHtcclxuICAgICAgICAgICAgICAgIHR5cGVzOiBbJ2VxdWlwbWVudCddLFxyXG4gICAgICAgICAgICAgICAgbWFrZURlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBwcmVsb2FkSGFuZGxlYmFyc1RlbXBsYXRlcygpO1xyXG5cclxuICAgICAgICAgICAgcmVnaXN0ZXJTZXR0aW5ncygpO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJWZXJldGVubyB8IFN5c3RlbSBpbml0IGRvbmUuXCIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4iLCAiaW1wb3J0IHsgVmVyZXRlbm9BY3RvciB9IGZyb20gXCIkbW9kdWxlL2FjdG9yXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgVmVyZXRlbm9BY3RvcnM8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9BY3RvcjxudWxsPj4gZXh0ZW5kcyBBY3RvcnM8VEFjdG9yPiB7XHJcblxyXG59IiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3JQcm94eSB9IGZyb20gXCIkbW9kdWxlL2FjdG9yL2Jhc2UvZG9jdW1lbnRcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9BY3RvcnMgfSBmcm9tIFwiJG1vZHVsZS9jb2xsZWN0aW9uXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vSXRlbVByb3h5IH0gZnJvbSBcIiRtb2R1bGUvaXRlbS9iYXNlL2RvY3VtZW50XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vUm9sbCB9IGZyb20gXCIkbW9kdWxlL3N5c3RlbS9yb2xsXCI7XHJcblxyXG5leHBvcnQgY29uc3QgTG9hZCA9IHtcclxuICAgIGxpc3RlbigpOiB2b2lkIHtcclxuICAgICAgICBDT05GSUcuQWN0b3IuY29sbGVjdGlvbiA9IFZlcmV0ZW5vQWN0b3JzO1xyXG4gICAgICAgIENPTkZJRy5BY3Rvci5kb2N1bWVudENsYXNzID0gVmVyZXRlbm9BY3RvclByb3h5O1xyXG4gICAgICAgIENPTkZJRy5JdGVtLmRvY3VtZW50Q2xhc3MgPSBWZXJldGVub0l0ZW1Qcm94eTtcclxuXHJcbiAgICAgICAgQ09ORklHLkRpY2Uucm9sbHMucHVzaChWZXJldGVub1JvbGwpO1xyXG4gICAgfVxyXG59IiwgImltcG9ydCB7IEluaXQgfSBmcm9tICcuL2luaXQnO1xyXG5pbXBvcnQgeyBMb2FkIH0gZnJvbSAnLi9sb2FkJztcclxuXHJcbmV4cG9ydCBjb25zdCBIb29rc1ZlcmV0ZW5vID0ge1xyXG4gICAgbGlzdGVuKCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGxpc3RlbmVyczogeyBsaXN0ZW4oKTogdm9pZCB9W10gPSBbXHJcbiAgICAgICAgICAgIEluaXQsXHJcbiAgICAgICAgICAgIExvYWQsXHJcbiAgICAgICAgXTtcclxuICAgICAgICBmb3IgKGNvbnN0IExpc3RlbmVyIG9mIGxpc3RlbmVycykge1xyXG4gICAgICAgICAgICBMaXN0ZW5lci5saXN0ZW4oKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG59O1xyXG4iLCAiaW1wb3J0IHsgSG9va3NWZXJldGVubyB9IGZyb20gJy4vc2NyaXB0cy9ob29rcy9pbmRleCc7XHJcblxyXG5Ib29rc1ZlcmV0ZW5vLmxpc3RlbigpOyJdLAogICJtYXBwaW5ncyI6ICI7OztBQUVBLE1BQU0sb0JBQU4sY0FBNEQsVUFBaUI7QUFBQSxJQUN6RSxJQUFJLFdBQVc7QUFDWCxhQUFPLEtBQUssS0FBSztBQUFBLElBQ3JCO0FBQUEsSUFFQSxJQUFJLGlCQUFpQjtBQUNqQixhQUFPLEtBQUssS0FBSztBQUFBLElBQ3JCO0FBQUEsSUFFQSxXQUFXLGlCQUFpQjtBQUN4QixZQUFNLG9CQUFvQixLQUFLLFNBQVMsSUFBSSxRQUFRLFVBQVUsS0FBSztBQUVuRSxZQUFNLFVBQVUsWUFBWSxNQUFNLGdCQUFnQjtBQUFBLFFBQzlDLE9BQU87QUFBQSxRQUNQLFNBQVMsQ0FBQyxZQUFZLFFBQVEsT0FBTztBQUFBLE1BQ3pDLENBQUM7QUFDRCxVQUFHLG1CQUFrQjtBQUNqQixnQkFBUSxRQUFRLEtBQUssU0FBUztBQUFBLE1BQ2xDO0FBRUEsYUFBTztBQUFBLElBQ1g7QUFBQSxJQUVBLElBQUksV0FBVztBQUNYLGFBQU8sMkNBQTJDLEtBQUssS0FBSyxJQUFJO0FBQUEsSUFDcEU7QUFBQSxJQUVBLE1BQWUsUUFBUSxVQUF5QyxDQUFDLEdBQTBDO0FBQ3ZHLGNBQVEsS0FBSyxLQUFLO0FBQ2xCLGNBQVEsV0FBVyxLQUFLO0FBRXhCLFlBQU0sRUFBRSxLQUFL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LGdCQUFnQixRQUFRLFVBQVU7QUFDekMsZUFBTyxjQUFjLFlBQVksd0JBQXdCO0FBQUEsVUFDckQsT0FBTyxDQUFDLFdBQVc7QUFBQSxVQUNuQixhQUFhO0FBQUEsUUFDakIsQ0FBQztBQUNELGVBQU8sY0FBYyxZQUFZLHNCQUFzQjtBQUFBLFVBQ25ELE9BQU8sQ0FBQyxTQUFTO0FBQUEsVUFDakIsYUFBYTtBQUFBLFFBQ2pCLENBQUM7QUFDRCxlQUFPLGNBQWMsWUFBWSxrQkFBa0I7QUFBQSxVQUMvQyxPQUFPLENBQUMsS0FBSztBQUFBLFVBQ2IsYUFBYTtBQUFBLFFBQ2pCLENBQUM7QUFFRCxjQUFNLGdCQUFnQixRQUFRLFNBQVM7QUFDdkMsY0FBTSxjQUFjLFlBQVksbUJBQW1CO0FBQUEsVUFDL0MsYUFBYTtBQUFBLFFBQ2pCLENBQUM7QUFDRCxjQUFNLGNBQWMsWUFBWSxvQkFBb0I7QUFBQSxVQUNoRCxPQUFPLENBQUMsT0FBTztBQUFBLFVBQ2YsYUFBYTtBQUFBLFFBQ2pCLENBQUM7QUFDRCxjQUFNLGNBQWMsWUFBWSxxQkFBcUI7QUFBQSxVQUNqRCxPQUFPLENBQUMsUUFBUTtBQUFBLFVBQ2hCLGFBQWE7QUFBQSxRQUNqQixDQUFDO0FBQ0QsY0FBTSxjQUFjLFlBQVksd0JBQXdCO0FBQUEsVUFDcEQsT0FBTyxDQUFDLFdBQVc7QUFBQSxVQUNuQixhQUFhO0FBQUEsUUFDakIsQ0FBQztBQUVELG1DQUEyQjtBQUUzQix5QkFBaUI7QUFFakIsZ0JBQVEsSUFBSSw4QkFBOEI7QUFBQSxNQUM5QyxDQUFDO0FBQUEsSUFDTDtBQUFBLEVBQ0o7OztBQzVETyxNQUFNLGlCQUFOLGNBQWlFLE9BQWU7QUFBQSxFQUV2Rjs7O0FDQ08sTUFBTSxPQUFPO0FBQUEsSUFDaEIsU0FBZTtBQUNYLGFBQU8sTUFBTSxhQUFhO0FBQzFCLGFBQU8sTUFBTSxnQkFBZ0I7QUFDN0IsYUFBTyxLQUFLLGdCQUFnQjtBQUU1QixhQUFPLEtBQUssTUFBTSxLQUFLLFlBQVk7QUFBQSxJQUN2QztBQUFBLEVBQ0o7OztBQ1ZPLE1BQU0sZ0JBQWdCO0FBQUEsSUFDekIsU0FBZTtBQUNYLFlBQU0sWUFBa0M7QUFBQSxRQUNwQztBQUFBLFFBQ0E7QUFBQSxNQUNKO0FBQ0EsaUJBQVcsWUFBWSxXQUFXO0FBQzlCLGlCQUFTLE9BQU87QUFBQSxNQUNwQjtBQUFBLElBQ0o7QUFBQSxFQUNKOzs7QUNYQSxnQkFBYyxPQUFPOyIsCiAgIm5hbWVzIjogWyJXZWFwb25UeXBlIiwgIlJhbmdlVHlwZSIsICJTa2lsbFR5cGUiLCAiaHRtbCJdCn0K
