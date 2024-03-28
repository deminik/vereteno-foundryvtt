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
    get modifier() {
      return this.system.modifier;
    }
    get damage() {
      return this.system.damage;
    }
    get initiative() {
      return this.system.initiative;
    }
    get crit() {
      return this.system.crit;
    }
    get weaponType() {
      return this.system.weaponType || "none" /* None */;
    }
    get attackWith() {
      return this.system.attackWith || "none" /* None */;
    }
    get range() {
      return this.system.range || "none" /* None */;
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
        modifier: item.modifier,
        weaponType: item.weaponType,
        attackWith: item.attackWith,
        crit: item.crit,
        damage: item.damage,
        initiative: item.initiative,
        range: item.range,
        weaponTypes,
        ranges: rangeTypes,
        skills: skillTypes
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
        switch (x.weaponType) {
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
        equippedArmor: actor.EquippedArmor
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL21vZHVsZS9pdGVtL2Jhc2Uvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL3BoeXNpY2FsLWl0ZW0vc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL2FybW9yL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvYmFzZS9kb2N1bWVudC50cyIsICIuLi9zcmMvbW9kdWxlL2RhdGEudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL3dlYXBvbi9kYXRhLnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvY3JlYXR1cmUvZG9jdW1lbnQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9jaGFyYWN0ZXIvZG9jdW1lbnQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9tb25zdGVyL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvbnBjL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9iYXNlL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9waHlzaWNhbC1pdGVtL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9hcm1vci9kb2N1bWVudC50cyIsICIuLi9zcmMvY29tbW9uLnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS93ZWFwb24vZG9jdW1lbnQudHMiLCAiLi4vc3JjL3ZlcmV0ZW5vQ29uZmlnLnRzIiwgIi4uL3NyYy9wYXJ0aWFscy50cyIsICIuLi9zcmMvbW9kdWxlL2l0ZW0vd2VhcG9uL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvYmFzZS9zaGVldC50cyIsICIuLi9zcmMvbW9kdWxlL3N5c3RlbS9yb2xsLnRzIiwgIi4uL3NyYy9tb2R1bGUvdXRpbHMvdmVyZXRlbm8tcm9sbGVyLnRzIiwgIi4uL3NyYy9tb2R1bGUvZGlhbG9nL3JvbGwtZGlhbG9nLnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvY3JlYXR1cmUvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9jaGFyYWN0ZXIvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9tb25zdGVyL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvbnBjL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvc3lzdGVtL3NldHRpbmdzL2luZGV4LnRzIiwgIi4uL3NyYy9tb2R1bGUvc3lzdGVtL3NldHRpbmdzL2NsaWVudC1zZXR0aW5ncy50cyIsICIuLi9zcmMvc2NyaXB0cy9ob29rcy9pbml0LnRzIiwgIi4uL3NyYy9tb2R1bGUvY29sbGVjdGlvbi9hY3RvcnMudHMiLCAiLi4vc3JjL3NjcmlwdHMvaG9va3MvbG9hZC50cyIsICIuLi9zcmMvc2NyaXB0cy9ob29rcy9pbmRleC50cyIsICIuLi9zcmMvdmVyZXRlbm8udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBoeXNpY2FsVmVyZXRlbm9JdGVtLCBWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vSXRlbVNoZWV0PFRJdGVtIGV4dGVuZHMgVmVyZXRlbm9JdGVtPiBleHRlbmRzIEl0ZW1TaGVldDxUSXRlbT4ge1xyXG4gICAgZ2V0IGl0ZW1EYXRhKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLml0ZW0uZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgaXRlbVByb3BlcnRpZXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbS5zeXN0ZW07XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCBkZWZhdWx0T3B0aW9ucygpIHtcclxuICAgICAgICBjb25zdCBpc1J1c3NpYW5MYW5ndWFnZSA9IGdhbWUuc2V0dGluZ3MuZ2V0KFwiY29yZVwiLCBcImxhbmd1YWdlXCIpID09ICdydSc7XHJcblxyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBtZXJnZU9iamVjdChzdXBlci5kZWZhdWx0T3B0aW9ucywge1xyXG4gICAgICAgICAgICB3aWR0aDogNTYwLFxyXG4gICAgICAgICAgICBjbGFzc2VzOiBbJ3ZlcmV0ZW5vJywgJ2l0ZW0nLCAnc2hlZXQnXVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmKGlzUnVzc2lhbkxhbmd1YWdlKXtcclxuICAgICAgICAgICAgb3B0aW9ucy5jbGFzc2VzLnB1c2goXCJsYW5nLXJ1XCIpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb3B0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgdGVtcGxhdGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIGBzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvaXRlbXMvJHt0aGlzLml0ZW0udHlwZX0tc2hlZXQuaGJzYDtcclxuICAgIH1cclxuXHJcbiAgICBvdmVycmlkZSBhc3luYyBnZXREYXRhKG9wdGlvbnM6IFBhcnRpYWw8RG9jdW1lbnRTaGVldE9wdGlvbnM+ID0ge30pOiBQcm9taXNlPFZlcmV0ZW5vSXRlbVNoZWV0RGF0YTxUSXRlbT4+IHtcclxuICAgICAgICBvcHRpb25zLmlkID0gdGhpcy5pZDtcclxuICAgICAgICBvcHRpb25zLmVkaXRhYmxlID0gdGhpcy5pc0VkaXRhYmxlO1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW0gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIC8vIEVucmljaCBjb250ZW50XHJcbiAgICAgICAgY29uc3QgZW5yaWNoZWRDb250ZW50OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XHJcbiAgICAgICAgY29uc3Qgcm9sbERhdGEgPSB7IC4uLnRoaXMuaXRlbS5nZXRSb2xsRGF0YSgpLCAuLi50aGlzLmFjdG9yPy5nZXRSb2xsRGF0YSgpIH07XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGl0ZW1UeXBlOiBudWxsLFxyXG4gICAgICAgICAgICBpdGVtOiBpdGVtLFxyXG4gICAgICAgICAgICBkYXRhOiBpdGVtLnN5c3RlbSxcclxuICAgICAgICAgICAgaXNQaHlzaWNhbDogZmFsc2UsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpdGVtLkRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICBjc3NDbGFzczogdGhpcy5pc0VkaXRhYmxlID8gXCJlZGl0YWJsZVwiIDogXCJsb2NrZWRcIixcclxuICAgICAgICAgICAgZWRpdGFibGU6IHRoaXMuaXNFZGl0YWJsZSxcclxuICAgICAgICAgICAgZG9jdW1lbnQ6IGl0ZW0sXHJcbiAgICAgICAgICAgIGxpbWl0ZWQ6IHRoaXMuaXRlbS5saW1pdGVkLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB0aGlzLm9wdGlvbnMsXHJcbiAgICAgICAgICAgIG93bmVyOiB0aGlzLml0ZW0uaXNPd25lcixcclxuICAgICAgICAgICAgdGl0bGU6IHRoaXMudGl0bGUsXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb3ZlcnJpZGUgYXN5bmMgX3VwZGF0ZU9iamVjdChldmVudDogRXZlbnQsIGZvcm1EYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBzdXBlci5fdXBkYXRlT2JqZWN0KGV2ZW50LCBmb3JtRGF0YSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0l0ZW1TaGVldERhdGE8VEl0ZW0gZXh0ZW5kcyBWZXJldGVub0l0ZW0+IGV4dGVuZHMgSXRlbVNoZWV0RGF0YTxUSXRlbT4ge1xyXG4gICAgaXRlbVR5cGU6IHN0cmluZyB8IG51bGw7XHJcbiAgICBpdGVtOiBUSXRlbTtcclxuICAgIGRhdGE6IFRJdGVtW1wic3lzdGVtXCJdO1xyXG4gICAgaXNQaHlzaWNhbDogYm9vbGVhbjtcclxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbiAgICAvLyBzeXN0ZW06IFZlcmV0ZW5vSXRlbVN5c3RlbURhdGE7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJdGVtU2hlZXRPcHRpb25zIGV4dGVuZHMgRG9jdW1lbnRTaGVldE9wdGlvbnMge1xyXG4gICAgaGFzU2lkZWJhcjogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9JdGVtU2hlZXQgfTtcclxuZXhwb3J0IHR5cGUgeyBWZXJldGVub0l0ZW1TaGVldERhdGEsIEl0ZW1TaGVldE9wdGlvbnMgfTsiLCAiaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtU2hlZXQsIFZlcmV0ZW5vSXRlbVNoZWV0RGF0YSB9IGZyb20gXCIuLi9iYXNlL3NoZWV0XCI7XHJcblxyXG5jbGFzcyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQ8VEl0ZW0gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbT4gZXh0ZW5kcyBWZXJldGVub0l0ZW1TaGVldDxUSXRlbT4ge1xyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zPzogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4pOiBQcm9taXNlPFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGE8VEl0ZW0+PiB7XHJcbiAgICAgICAgY29uc3Qgc2hlZXREYXRhID0gYXdhaXQgc3VwZXIuZ2V0RGF0YShvcHRpb25zKTtcclxuICAgICAgICBjb25zdCB7IGl0ZW0gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIC4uLnNoZWV0RGF0YSxcclxuICAgICAgICAgICAgaXNQaHlzaWNhbDogdHJ1ZSxcclxuICAgICAgICAgICAgd2VpZ2h0OiBpdGVtLndlaWdodCxcclxuICAgICAgICAgICAgcHJpY2U6IGl0ZW0ucHJpY2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXREYXRhPFRJdGVtIGV4dGVuZHMgUGh5c2ljYWxWZXJldGVub0l0ZW0+IGV4dGVuZHMgVmVyZXRlbm9JdGVtU2hlZXREYXRhPFRJdGVtPiB7XHJcbiAgICBpc1BoeXNpY2FsOiB0cnVlO1xyXG4gICAgd2VpZ2h0OiBudW1iZXI7XHJcbiAgICBwcmljZTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgeyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQgfTtcclxuZXhwb3J0IHR5cGUgeyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXREYXRhIH07IiwgImltcG9ydCB7IFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldCwgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YSB9IGZyb20gXCIuLi9waHlzaWNhbC1pdGVtL3NoZWV0XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQXJtb3IgfSBmcm9tIFwiLi9kb2N1bWVudFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9Bcm1vclNoZWV0IGV4dGVuZHMgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0PFZlcmV0ZW5vQXJtb3I+IHtcclxuICAgIG92ZXJyaWRlIGFzeW5jIGdldERhdGEob3B0aW9ucz86IFBhcnRpYWw8RG9jdW1lbnRTaGVldE9wdGlvbnM+KTogUHJvbWlzZTxWZXJldGVub0FybW9yU2hlZXREYXRhPiB7XHJcbiAgICAgICAgY29uc3Qgc2hlZXREYXRhID0gYXdhaXQgc3VwZXIuZ2V0RGF0YShvcHRpb25zKTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBpdGVtIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQ6IFZlcmV0ZW5vQXJtb3JTaGVldERhdGEgPSB7XHJcbiAgICAgICAgICAgIC4uLnNoZWV0RGF0YSxcclxuICAgICAgICAgICAgYXJtb3JDbGFzczogaXRlbS5hcm1vckNsYXNzLFxyXG4gICAgICAgICAgICBxdWFsaXR5OiBpdGVtLnF1YWxpdHksXHJcbiAgICAgICAgICAgIGR1cmFiaWxpdHk6IGl0ZW0uZHVyYWJpbGl0eSxcclxuICAgICAgICAgICAgbWF4RHVyYWJpbGl0eTogaXRlbS5tYXhEdWFyYWJpbGl0eSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB0ZW1wbGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gYHN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9pdGVtcy9hcm1vci1zaGVldC5oYnNgO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Bcm1vclNoZWV0RGF0YSBleHRlbmRzIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGE8VmVyZXRlbm9Bcm1vcj4ge1xyXG4gICAgYXJtb3JDbGFzczogbnVtYmVyO1xyXG4gICAgcXVhbGl0eTogbnVtYmVyO1xyXG4gICAgZHVyYWJpbGl0eTogbnVtYmVyO1xyXG4gICAgbWF4RHVyYWJpbGl0eTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0FybW9yU2hlZXQgfTtcclxuZXhwb3J0IHR5cGUgeyBWZXJldGVub0FybW9yU2hlZXREYXRhIH07IiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3JTb3VyY2UsIFZlcmV0ZW5vQWN0b3JTeXN0ZW1EYXRhIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9BY3RvcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBBY3RvcjxUUGFyZW50PntcclxuICAgIGdldCBEZXNjcmlwdGlvbigpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5zeXN0ZW0uZGVzY3JpcHRpb24gfHwgJycpLnRyaW0oKTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQWN0b3I8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgQWN0b3I8VFBhcmVudD4ge1xyXG4gICAgY29uc3RydWN0b3I6IHR5cGVvZiBWZXJldGVub0FjdG9yO1xyXG4gICAgc3lzdGVtOiBWZXJldGVub0FjdG9yU3lzdGVtRGF0YTtcclxuXHJcbiAgICBEZXNjcmlwdGlvbjogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBWZXJldGVub0FjdG9yUHJveHkgPSBuZXcgUHJveHkoVmVyZXRlbm9BY3Rvciwge1xyXG4gICAgY29uc3RydWN0KFxyXG4gICAgICAgIF90YXJnZXQsXHJcbiAgICAgICAgYXJnczogW3NvdXJjZTogUHJlQ3JlYXRlPFZlcmV0ZW5vQWN0b3JTb3VyY2U+LCBjb250ZXh0PzogRG9jdW1lbnRDb25zdHJ1Y3Rpb25Db250ZXh0PFZlcmV0ZW5vQWN0b3JbXCJwYXJlbnRcIl0+XSxcclxuICAgICkge1xyXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IGFyZ3NbMF07XHJcbiAgICAgICAgY29uc3QgdHlwZSA9IHNvdXJjZT8udHlwZTtcclxuICAgICAgICByZXR1cm4gbmV3IENPTkZJRy5WRVJFVEVOTy5BY3Rvci5kb2N1bWVudENsYXNzZXNbdHlwZV0oLi4uYXJncyk7XHJcbiAgICB9LFxyXG59KTtcclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQWN0b3IsIFZlcmV0ZW5vQWN0b3JQcm94eSB9OyIsICJpbXBvcnQgeyBWZXJldGVub1JvbGxEYXRhIH0gZnJvbSBcIi4vYWN0b3IvYmFzZS9kYXRhXCI7XHJcblxyXG5pbnRlcmZhY2UgSWRMYWJlbFR5cGU8VD4ge1xyXG4gICAgaWQ6IG51bWJlcjtcclxuICAgIGxhYmVsOiBzdHJpbmc7XHJcbiAgICB0eXBlOiBUO1xyXG59XHJcblxyXG5jbGFzcyBWZXJldGVub1JvbGxPcHRpb25zIHtcclxuICAgIHR5cGU6IFZlcmV0ZW5vUm9sbFR5cGUgPSBWZXJldGVub1JvbGxUeXBlLlJlZ3VsYXI7XHJcbiAgICBtZXNzYWdlRGF0YTogVmVyZXRlbm9NZXNzYWdlRGF0YSA9IG5ldyBWZXJldGVub01lc3NhZ2VEYXRhKCk7XHJcbiAgICByb2xsRGF0YTogVmVyZXRlbm9Sb2xsRGF0YSA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcbn1cclxuZW51bSBWZXJldGVub1JvbGxUeXBlIHtcclxuICAgIE5vbmUgPSAnbm9uZScsXHJcbiAgICBSZWd1bGFyID0gJ3JlZ3VsYXInLFxyXG4gICAgQXJtb3JCbG9jayA9ICdhcm1vci1ibG9jaycsXHJcbiAgICBBdHRhY2sgPSAnYXR0YWNrJyxcclxuICAgIEluaXRpYXRpdmUgPSAnaW5pdGlhdGl2ZScsXHJcbn1cclxuXHJcbmNsYXNzIFZlcmV0ZW5vTWVzc2FnZURhdGEgaW1wbGVtZW50cyBSb2xsT3B0aW9ucyB7XHJcbiAgICBbaW5kZXg6IHN0cmluZ106IGFueTtcclxuICAgIHVzZXJJZDogc3RyaW5nIHwgdW5kZWZpbmVkO1xyXG4gICAgc3BlYWtlcjogYW55ID0ge307XHJcbiAgICBmbGF2b3I6IHN0cmluZyA9ICcnO1xyXG4gICAgc291bmQ6IGFueSB8IG51bGwgPSBudWxsO1xyXG4gICAgYmxpbmQ6IGJvb2xlYW4gPSBmYWxzZVxyXG59XHJcblxyXG5jbGFzcyBWZXJldGVub1JvbGxEYXRhIHtcclxuICAgIGRpY2U6IHN0cmluZyA9ICdkMjAnO1xyXG4gICAgcG9vbDogbnVtYmVyID0gMTtcclxuICAgIGJvbnVzOiBudW1iZXIgPSAwO1xyXG4gICAgaXNTZXJpYWw6IGJvb2xlYW4gPSBmYWxzZTtcclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vUm9sbERhdGEge1xyXG4gICAgZGljZTogc3RyaW5nO1xyXG4gICAgcG9vbDogbnVtYmVyO1xyXG4gICAgYm9udXM6IG51bWJlcjtcclxuICAgIGlzU2VyaWFsOiBib29sZWFuO1xyXG59XHJcblxyXG5jbGFzcyBWZXJldGVub0NoYXRPcHRpb25zIHtcclxuICAgIGlzQmxpbmQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHNob3dEaWFsb2c6IGJvb2xlYW4gPSBmYWxzZTtcclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQ2hhdE9wdGlvbnMge1xyXG4gICAgaXNCbGluZDogYm9vbGVhbjtcclxuICAgIHNob3dEaWFsb2c6IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIHsgSWRMYWJlbFR5cGUgfVxyXG5leHBvcnQgdHlwZSB7IFZlcmV0ZW5vUm9sbE9wdGlvbnMsIFZlcmV0ZW5vTWVzc2FnZURhdGEgfVxyXG5leHBvcnQgeyBWZXJldGVub1JvbGxUeXBlLCBWZXJldGVub1JvbGxEYXRhLCBWZXJldGVub0NoYXRPcHRpb25zIH0iLCAiaW1wb3J0IHsgU2tpbGxUeXBlIH0gZnJvbSBcIiRjb21tb25cIjtcclxuaW1wb3J0IHsgQmFzZVBoeXNpY2FsSXRlbVNvdXJjZSwgUGh5c2ljYWxTeXN0ZW1Tb3VyY2UsIFBoeXNpY2FsVmVyZXRlbm9JdGVtU3lzdGVtRGF0YSB9IGZyb20gXCIuLi9waHlzaWNhbC1pdGVtL2RhdGFcIjtcclxuXHJcbmludGVyZmFjZSBWZXJldGVub1dlYXBvblN5c3RlbURhdGEgZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbVN5c3RlbURhdGEge1xyXG4gICAgbW9kaWZpZXI6IG51bWJlcjtcclxuICAgIGRhbWFnZTogbnVtYmVyO1xyXG4gICAgaW5pdGlhdGl2ZTogbnVtYmVyO1xyXG4gICAgY3JpdDogbnVtYmVyO1xyXG4gICAgd2VhcG9uVHlwZTogV2VhcG9uVHlwZSxcclxuICAgIGF0dGFja1dpdGg6IFNraWxsVHlwZSxcclxuICAgIHJhbmdlOiBSYW5nZVR5cGVcclxufVxyXG5cclxudHlwZSBXZWFwb25Tb3VyY2UgPSBCYXNlUGh5c2ljYWxJdGVtU291cmNlPFwid2VhcG9uXCIsIFdlYXBvblN5c3RlbVNvdXJjZT47XHJcblxyXG4vLyB0eXBlIFdlYXBvbkl0ZW1Tb3VyY2U8XHJcbi8vICAgICBUVHlwZSBleHRlbmRzIFBoeXNpY2FsSXRlbVR5cGUsXHJcbi8vICAgICBUU3lzdGVtU291cmNlIGV4dGVuZHMgV2VhcG9uU3lzdGVtU291cmNlID0gV2VhcG9uU3lzdGVtU291cmNlLFxyXG4vLyA+ID0gQmFzZUl0ZW1Tb3VyY2VQRjJlPFRUeXBlLCBUU3lzdGVtU291cmNlPjtcclxuXHJcbmludGVyZmFjZSBXZWFwb25TeXN0ZW1Tb3VyY2UgZXh0ZW5kcyBQaHlzaWNhbFN5c3RlbVNvdXJjZSB7XHJcbiAgICBtb2RpZmllcjogbnVtYmVyO1xyXG4gICAgZGFtYWdlOiBudW1iZXI7XHJcbiAgICBpbml0aWF0aXZlOiBudW1iZXI7XHJcbiAgICBjcml0OiBudW1iZXI7XHJcbiAgICB3ZWFwb25UeXBlOiBXZWFwb25UeXBlLFxyXG4gICAgYXR0YWNrV2l0aDogU2tpbGxUeXBlLFxyXG4gICAgcmFuZ2U6IFJhbmdlVHlwZVxyXG59XHJcblxyXG5lbnVtIFdlYXBvblR5cGUge1xyXG4gICAgTm9uZSA9IFwibm9uZVwiLFxyXG4gICAgQnJhd2xpbmcgPSBcImJyYXdsaW5nXCIsXHJcbiAgICBNZWxlZSA9IFwibWVsZWVcIixcclxuICAgIFJhbmdlZCA9IFwicmFuZ2VkXCJcclxufVxyXG5cclxuZW51bSBSYW5nZVR5cGUge1xyXG4gICAgTm9uZSA9IFwibm9uZVwiLFxyXG4gICAgUG9pbnRCbGFuayA9IFwicG9pbnRCbGFua1wiLFxyXG4gICAgQ2xvc2UgPSBcImNsb3NlXCIsXHJcbiAgICBNZWRpdW0gPSBcIm1lZGl1bVwiLFxyXG4gICAgTG9uZyA9IFwibG9uZ1wiLFxyXG4gICAgVXRtb3N0ID0gXCJ1dG1vc3RcIlxyXG59XHJcblxyXG5lbnVtIEF0dGFja1R5cGUge1xyXG4gICAgTm9uZSA9IFwibm9uZVwiLFxyXG4gICAgUmVndWxhciA9IFwicmVndWxhclwiLFxyXG4gICAgUG93ZXIgPSBcInBvd2VyXCIsXHJcbiAgICBMaWdodCA9IFwibGlnaHRcIixcclxuICAgIEFpbWVkID0gXCJhaW1lZFwiLFxyXG4gICAgSGlwID0gXCJoaXBcIixcclxuICAgIEJ1cnN0ID0gXCJidXJzdFwiXHJcbn1cclxuXHJcbmV4cG9ydCB7IFdlYXBvblR5cGUsIFJhbmdlVHlwZSwgQXR0YWNrVHlwZSB9XHJcbmV4cG9ydCB7IFZlcmV0ZW5vV2VhcG9uU3lzdGVtRGF0YSwgV2VhcG9uU291cmNlIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9Sb2xsRGF0YSB9IGZyb20gXCIkbW9kdWxlL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9Bcm1vciwgVmVyZXRlbm9JdGVtIH0gZnJvbSBcIiRtb2R1bGUvaXRlbVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW1UeXBlIH0gZnJvbSBcIiRtb2R1bGUvaXRlbS9iYXNlL2RhdGFcIjtcclxuaW1wb3J0IHsgQXR0YWNrVHlwZSwgV2VhcG9uVHlwZSB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vd2VhcG9uL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9XZWFwb24gfSBmcm9tIFwiJG1vZHVsZS9pdGVtL3dlYXBvbi9kb2N1bWVudFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcbmltcG9ydCB7IEF0dHJpYnV0ZXNCbG9jaywgU2tpbGxzQmxvY2ssIFN0YXRzQmxvY2ssIFZlcmV0ZW5vQ3JlYXR1cmVTeXN0ZW1EYXRhLCBXZWFwb25BdHRhY2tJbmZvIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9DcmVhdHVyZTxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0FjdG9yPFRQYXJlbnQ+e1xyXG4gICAgZ2V0IFN0YXRzKCk6IFN0YXRzQmxvY2sge1xyXG4gICAgICAgIGNvbnN0IGhwID0gdGhpcy5zeXN0ZW0uc3RhdHMuaGl0UG9pbnRzLnZhbHVlO1xyXG4gICAgICAgIGlmIChocCA+IHRoaXMuTWF4SHApIHtcclxuICAgICAgICAgICAgdGhpcy5zeXN0ZW0uc3RhdHMuaGl0UG9pbnRzLnZhbHVlID0gdGhpcy5NYXhIcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHdwID0gdGhpcy5zeXN0ZW0uc3RhdHMud2lsbFBvaW50cy52YWx1ZTtcclxuICAgICAgICBpZiAod3AgPiB0aGlzLk1heFdwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3lzdGVtLnN0YXRzLndpbGxQb2ludHMudmFsdWUgPSB0aGlzLk1heFdwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLnN0YXRzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBBdHRyaWJ1dGVzKCk6IEF0dHJpYnV0ZXNCbG9jayB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmF0dHJpYnV0ZXM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IFNraWxscygpOiBTa2lsbHNCbG9jayB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLnNraWxscztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgTWF4SHAoKTogbnVtYmVyIHtcclxuICAgICAgICBjb25zdCBjb25zdGl0dXRpb25WYWx1ZSA9IHRoaXMuQXR0cmlidXRlcy5jb25zdGl0dXRpb24udmFsdWU7XHJcbiAgICAgICAgY29uc3QgZGV4dGVyaXR5VmFsdWUgPSB0aGlzLkF0dHJpYnV0ZXMuZGV4dGVyaXR5LnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IGJvbnVzZXMgPSAwO1xyXG5cclxuICAgICAgICByZXR1cm4gY29uc3RpdHV0aW9uVmFsdWUgKyBkZXh0ZXJpdHlWYWx1ZSArIGJvbnVzZXM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IE1heFdwKCk6IG51bWJlciB7XHJcbiAgICAgICAgY29uc3QgaW50ZWxsaWdlbmNlVmFsdWUgPSB0aGlzLkF0dHJpYnV0ZXMuaW50ZWxsaWdlbmNlLnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IGVtcGF0aHlWYWx1ZSA9IHRoaXMuQXR0cmlidXRlcy5lbXBhdGh5LnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IGJvbnVzZXMgPSAwO1xyXG5cclxuICAgICAgICByZXR1cm4gaW50ZWxsaWdlbmNlVmFsdWUgKyBlbXBhdGh5VmFsdWUgKyBib251c2VzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHUwNDE4XHUwNDNDXHUwNDM1XHUwNDRFXHUwNDQ5XHUwNDM1XHUwNDM1XHUwNDQxXHUwNDRGIFx1MDQzRVx1MDQ0MFx1MDQ0M1x1MDQzNlx1MDQzOFx1MDQzNS5cclxuICAgICAqL1xyXG4gICAgZ2V0IFdlYXBvbnMoKTogVmVyZXRlbm9XZWFwb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXMubWFwKHggPT4geCBhcyB1bmtub3duIGFzIFZlcmV0ZW5vSXRlbSkuZmlsdGVyKHggPT4geC50eXBlID09IFZlcmV0ZW5vSXRlbVR5cGUuV2VhcG9uKS5tYXAoeCA9PiB4IGFzIFZlcmV0ZW5vV2VhcG9uKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFx1MDQyRFx1MDQzQVx1MDQzOFx1MDQzRlx1MDQzOFx1MDQ0MFx1MDQzRVx1MDQzMlx1MDQzMFx1MDQzRFx1MDQzRFx1MDQzRVx1MDQzNSBcdTA0M0VcdTA0NDBcdTA0NDNcdTA0MzZcdTA0MzhcdTA0MzUuXHJcbiAgICAgKi9cclxuICAgIGdldCBFcXVpcHBlZFdlYXBvbnMoKTogVmVyZXRlbm9XZWFwb25bXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuV2VhcG9ucy5maWx0ZXIoeCA9PiB4LnN5c3RlbS5pc0VxdWlwcGVkKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFx1MDQxOFx1MDQzQ1x1MDQzNVx1MDQ0RVx1MDQ0OVx1MDQzMFx1MDQ0Rlx1MDQ0MVx1MDQ0RiBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0NEYuXHJcbiAgICAgKi9cclxuICAgIGdldCBBcm1vcnMoKTogVmVyZXRlbm9Bcm1vcltdIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pdGVtcy5tYXAoeCA9PiB4IGFzIHVua25vd24gYXMgVmVyZXRlbm9JdGVtKS5maWx0ZXIoeCA9PiB4LnR5cGUgPT0gVmVyZXRlbm9JdGVtVHlwZS5Bcm1vcikubWFwKHggPT4geCBhcyBWZXJldGVub0FybW9yKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFx1MDQyRFx1MDQzQVx1MDQzOFx1MDQzRlx1MDQzOFx1MDQ0MFx1MDQzRVx1MDQzMlx1MDQzMFx1MDQzRFx1MDQzRFx1MDQzMFx1MDQ0RiBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0NEYuXHJcbiAgICAgKi9cclxuICAgIGdldCBFcXVpcHBlZEFybW9yKCk6IFZlcmV0ZW5vQXJtb3Ige1xyXG4gICAgICAgIHJldHVybiB0aGlzLkFybW9ycy5maWx0ZXIoeCA9PiB4LnN5c3RlbS5pc0VxdWlwcGVkKVswXSB8fCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGdldEF0dHJpYnV0ZVJvbGxEYXRhKGtleTogc3RyaW5nKTogUHJvbWlzZTxWZXJldGVub1JvbGxEYXRhPiB7XHJcbiAgICAgICAgY29uc3QgYXR0cmlidXRlID0gdGhpcy5BdHRyaWJ1dGVzW2tleV07XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IFZlcmV0ZW5vUm9sbERhdGEoKTtcclxuICAgICAgICBpZiAoYXR0cmlidXRlID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gYXR0cmlidXRlLnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IGJvbnVzZXMgPSAwO1xyXG4gICAgICAgIHJlc3VsdC5wb29sID0gdmFsdWUgKyBib251c2VzO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGdldFNraWxsUm9sbERhdGEoa2V5OiBzdHJpbmcpOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERhdGE+IHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGF0YSgpO1xyXG5cclxuICAgICAgICBjb25zdCBza2lsbCA9IHRoaXMuU2tpbGxzW2tleV07XHJcbiAgICAgICAgaWYgKHNraWxsID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZVJvbGxEYXRhID0gYXdhaXQgdGhpcy5nZXRBdHRyaWJ1dGVSb2xsRGF0YShza2lsbC5hdHRyaWJ1dGUpO1xyXG5cclxuICAgICAgICBjb25zdCB2YWx1ZSA9IHNraWxsLnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IGJvbnVzZXMgPSAwO1xyXG4gICAgICAgIHJlc3VsdC5wb29sID0gYXR0cmlidXRlUm9sbERhdGEucG9vbCArIHZhbHVlICsgYm9udXNlcztcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBnZXRXZWFwb25Sb2xsRGF0YSh3ZWFwb25EYXRhOiBXZWFwb25BdHRhY2tJbmZvKTogUHJvbWlzZTxWZXJldGVub1JvbGxEYXRhPiB7XHJcbiAgICAgICAgbGV0IGl0ZW0gPSB0aGlzLml0ZW1zLmdldCh3ZWFwb25EYXRhLmlkKSBhcyB1bmtub3duIGFzIFZlcmV0ZW5vV2VhcG9uO1xyXG5cclxuICAgICAgICBsZXQgaXRlbVNraWxsID0gaXRlbS5zeXN0ZW0uYXR0YWNrV2l0aDtcclxuICAgICAgICBsZXQgc2tpbGxSb2xsRGF0YSA9IGF3YWl0IHRoaXMuZ2V0U2tpbGxSb2xsRGF0YShpdGVtU2tpbGwpO1xyXG5cclxuICAgICAgICBsZXQgd2VhcG9uQXR0YWNrVHlwZU1vZGlmaWVyID0gdGhpcy5nZXRXZWFwb25BdHRhY2tUeXBlTW9kaWZpZXIod2VhcG9uRGF0YSk7XHJcblxyXG4gICAgICAgIGxldCB3ZWFwb25BdHRhY2tNb2RpZmllciA9IGl0ZW0uc3lzdGVtLm1vZGlmaWVyO1xyXG5cclxuICAgICAgICBsZXQgd2VhcG9uRGFtYWdlID0gaXRlbS5zeXN0ZW0uZGFtYWdlO1xyXG5cclxuICAgICAgICBjb25zdCByb2xsRGF0YTogVmVyZXRlbm9Sb2xsRGF0YSA9IG1lcmdlT2JqZWN0KHNraWxsUm9sbERhdGEsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBvb2w6IHNraWxsUm9sbERhdGEucG9vbCArIHdlYXBvbkF0dGFja1R5cGVNb2RpZmllciArIHdlYXBvbkF0dGFja01vZGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgd2VhcG9uRGFtYWdlLFxyXG4gICAgICAgICAgICAgICAgd2VhcG9uQXR0YWNrTW9kaWZpZXJcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh3ZWFwb25EYXRhLmF0dGFja1R5cGUgPT0gQXR0YWNrVHlwZS5CdXJzdCkge1xyXG4gICAgICAgICAgICByb2xsRGF0YS5pc1NlcmlhbCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcm9sbERhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0V2VhcG9uQXR0YWNrVHlwZU1vZGlmaWVyKHdlYXBvbkRhdGE6IFdlYXBvbkF0dGFja0luZm8pOiBudW1iZXIge1xyXG4gICAgICAgIGlmICh3ZWFwb25EYXRhLndlYXBvblR5cGUgPT0gV2VhcG9uVHlwZS5NZWxlZSB8fCB3ZWFwb25EYXRhLndlYXBvblR5cGUgPT0gV2VhcG9uVHlwZS5CcmF3bGluZykge1xyXG4gICAgICAgICAgICBpZiAod2VhcG9uRGF0YS5hdHRhY2tUeXBlID09IEF0dGFja1R5cGUuUG93ZXIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAyO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAod2VhcG9uRGF0YS5hdHRhY2tUeXBlID09IEF0dGFja1R5cGUuTGlnaHQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAod2VhcG9uRGF0YS53ZWFwb25UeXBlID09IFdlYXBvblR5cGUuUmFuZ2VkKSB7XHJcbiAgICAgICAgICAgIGlmICh3ZWFwb25EYXRhLmF0dGFja1R5cGUgPT0gQXR0YWNrVHlwZS5BaW1lZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh3ZWFwb25EYXRhLmF0dGFja1R5cGUgPT0gQXR0YWNrVHlwZS5IaXApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHdlYXBvbkRhdGEuYXR0YWNrVHlwZSA9PSBBdHRhY2tUeXBlLkJ1cnN0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gLTI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2V0QXJtb3JSb2xsRGF0YShpdGVtSWQ6IHN0cmluZyk6IFByb21pc2U8VmVyZXRlbm9Sb2xsRGF0YSB8IG51bGw+IHtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGF0YSgpO1xyXG4gICAgICAgIGxldCBpdGVtID0gKHRoaXMuaXRlbXMuZ2V0KGl0ZW1JZCkgYXMgdW5rbm93biBhcyBWZXJldGVub0FybW9yKTtcclxuXHJcbiAgICAgICAgaWYgKCFpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVzdWx0LnBvb2wgPSBpdGVtLnN5c3RlbS5kdXJhYmlsaXR5XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2V0SW5pdGlhdGl2ZVJvbGxEYXRhKGl0ZW1JZDogc3RyaW5nKTogUHJvbWlzZTxWZXJldGVub1JvbGxEYXRhPiB7XHJcbiAgICAgICAgbGV0IGl0ZW0gPSAodGhpcy5pdGVtcy5nZXQoaXRlbUlkKSBhcyB1bmtub3duIGFzIFZlcmV0ZW5vV2VhcG9uKTtcclxuXHJcbiAgICAgICAgbGV0IHNraWxsID0gdGhpcy5Ta2lsbHMuYWdpbGl0eTtcclxuXHJcbiAgICAgICAgbGV0IGJvbnVzZXMgPSAwO1xyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGF0YSgpO1xyXG4gICAgICAgIHJlc3VsdC5wb29sID0gMTtcclxuICAgICAgICByZXN1bHQuYm9udXMgPSBza2lsbC52YWx1ZSArIGl0ZW0uc3lzdGVtLm1vZGlmaWVyICsgYm9udXNlcztcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBlcXVpcFdlYXBvbigpIHsgfVxyXG5cclxuICAgIGFzeW5jIGVxdWlwQXJtb3IoKSB7IH1cclxuXHJcbiAgICBhc3luYyB1bmVxdWlwSXRlbSgpIHsgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9DcmVhdHVyZTxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0FjdG9yPFRQYXJlbnQ+IHtcclxuICAgIHN5c3RlbTogVmVyZXRlbm9DcmVhdHVyZVN5c3RlbURhdGEsXHJcbiAgICBTdGF0czogU3RhdHNCbG9jaztcclxuICAgIEF0dHJpYnV0ZXM6IEF0dHJpYnV0ZXNCbG9jaztcclxuICAgIFNraWxsczogU2tpbGxzQmxvY2s7XHJcbiAgICBNYXhIcDogbnVtYmVyO1xyXG4gICAgTWF4V3A6IG51bWJlcjtcclxuICAgIFdlYXBvbnM6IFZlcmV0ZW5vV2VhcG9uW107XHJcbiAgICBBcm1vcnM6IFZlcmV0ZW5vQXJtb3JbXTtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9DcmVhdHVyZSB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmUgfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9DaGFyYWN0ZXJTeXN0ZW1EYXRhIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9DaGFyYWN0ZXI8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZTxUUGFyZW50PntcclxuICAgIGdldCBNb25leSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5tb25leSB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBSZXB1dGF0aW9uKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLnJlcHV0YXRpb24gfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgRXhwKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmV4cCB8fCAwO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9DaGFyYWN0ZXI8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZTxUUGFyZW50PiB7XHJcbiAgICBzeXN0ZW06IFZlcmV0ZW5vQ2hhcmFjdGVyU3lzdGVtRGF0YTtcclxuXHJcbiAgICBNb25leTogbnVtYmVyO1xyXG4gICAgUmVwdXRhdGlvbjogbnVtYmVyO1xyXG4gICAgRXhwOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQ2hhcmFjdGVyIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9DcmVhdHVyZSB9IGZyb20gXCIuLi9pbmRleFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9Nb25zdGVyPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudD57XHJcblxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Nb25zdGVyPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudD4ge1xyXG5cclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9Nb25zdGVyIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9DcmVhdHVyZSB9IGZyb20gXCIuLi9pbmRleFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9OcGM8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZTxUUGFyZW50PntcclxuXHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub05wYzxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQ+IHtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vTnBjIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9BY3RvciB9IGZyb20gXCIkbW9kdWxlL2FjdG9yXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vSXRlbVNvdXJjZSwgVmVyZXRlbm9JdGVtU3lzdGVtRGF0YSB9IGZyb20gXCIuL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtU2hlZXQgfSBmcm9tIFwiLi9zaGVldFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9JdGVtPFRQYXJlbnQgZXh0ZW5kcyBWZXJldGVub0FjdG9yIHwgbnVsbCA9IFZlcmV0ZW5vQWN0b3IgfCBudWxsPiBleHRlbmRzIEl0ZW08VFBhcmVudD57XHJcbiAgICBnZXQgZGF0YSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wcmVwYXJlRGF0YSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBEZXNjcmlwdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuc3lzdGVtLmRlc2NyaXB0aW9uIHx8ICcnKS50cmltKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIEtlZXAgYFRleHRFZGl0b3JgIGFuZCBhbnl0aGluZyBlbHNlIHVwIHRvIG5vIGdvb2QgZnJvbSBzZXR0aW5nIHRoaXMgaXRlbSdzIGRlc2NyaXB0aW9uIHRvIGBudWxsYCAqL1xyXG4gICAgcHJvdGVjdGVkIG92ZXJyaWRlIGFzeW5jIF9wcmVVcGRhdGUoXHJcbiAgICAgICAgY2hhbmdlZDogRGVlcFBhcnRpYWw8dGhpc1tcIl9zb3VyY2VcIl0+LFxyXG4gICAgICAgIG9wdGlvbnM6IERvY3VtZW50VXBkYXRlQ29udGV4dDxUUGFyZW50PixcclxuICAgICAgICB1c2VyOiBVc2VyLFxyXG4gICAgKTogUHJvbWlzZTxib29sZWFuIHwgdm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBzdXBlci5fcHJlVXBkYXRlKGNoYW5nZWQsIG9wdGlvbnMsIHVzZXIpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKiogUmVmcmVzaCB0aGUgSXRlbSBEaXJlY3RvcnkgaWYgdGhpcyBpdGVtIGlzbid0IGVtYmVkZGVkICovXHJcbiAgICBwcm90ZWN0ZWQgb3ZlcnJpZGUgX29uVXBkYXRlKFxyXG4gICAgICAgIGRhdGE6IERlZXBQYXJ0aWFsPHRoaXNbXCJfc291cmNlXCJdPixcclxuICAgICAgICBvcHRpb25zOiBEb2N1bWVudE1vZGlmaWNhdGlvbkNvbnRleHQ8VFBhcmVudD4sXHJcbiAgICAgICAgdXNlcklkOiBzdHJpbmcsXHJcbiAgICApOiB2b2lkIHtcclxuICAgICAgICBzdXBlci5fb25VcGRhdGUoZGF0YSwgb3B0aW9ucywgdXNlcklkKTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vSXRlbTxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBJdGVtPFRQYXJlbnQ+IHtcclxuICAgIGNvbnN0cnVjdG9yOiB0eXBlb2YgVmVyZXRlbm9JdGVtO1xyXG4gICAgc3lzdGVtOiBWZXJldGVub0l0ZW1TeXN0ZW1EYXRhO1xyXG5cclxuICAgIERlc2NyaXB0aW9uOiBzdHJpbmc7XHJcblxyXG4gICAgX3NoZWV0OiBWZXJldGVub0l0ZW1TaGVldDx0aGlzPiB8IG51bGw7XHJcblxyXG4gICAgZ2V0IHNoZWV0KCk6IFZlcmV0ZW5vSXRlbVNoZWV0PHRoaXM+O1xyXG5cclxuICAgIHByZXBhcmVTaWJsaW5nRGF0YT8odGhpczogVmVyZXRlbm9JdGVtPFZlcmV0ZW5vQWN0b3I+KTogdm9pZDtcclxuICAgIHByZXBhcmVBY3RvckRhdGE/KHRoaXM6IFZlcmV0ZW5vSXRlbTxWZXJldGVub0FjdG9yPik6IHZvaWQ7XHJcbiAgICAvKiogT3B0aW9uYWwgZGF0YS1wcmVwYXJhdGlvbiBjYWxsYmFjayBleGVjdXRlZCBhZnRlciBydWxlLWVsZW1lbnQgc3ludGhldGljcyBhcmUgcHJlcGFyZWQgKi9cclxuICAgIG9uUHJlcGFyZVN5bnRoZXRpY3M/KHRoaXM6IFZlcmV0ZW5vSXRlbTxWZXJldGVub0FjdG9yPik6IHZvaWQ7XHJcblxyXG4gICAgLyoqIFJldHVybnMgaXRlbXMgdGhhdCBzaG91bGQgYWxzbyBiZSBhZGRlZCB3aGVuIHRoaXMgaXRlbSBpcyBjcmVhdGVkICovXHJcbiAgICBjcmVhdGVHcmFudGVkSXRlbXM/KG9wdGlvbnM/OiBvYmplY3QpOiBQcm9taXNlPFZlcmV0ZW5vSXRlbVtdPjtcclxuXHJcbiAgICAvKiogUmV0dXJucyBpdGVtcyB0aGF0IHNob3VsZCBhbHNvIGJlIGRlbGV0ZWQgc2hvdWxkIHRoaXMgaXRlbSBiZSBkZWxldGVkICovXHJcbiAgICBnZXRMaW5rZWRJdGVtcz8oKTogVmVyZXRlbm9JdGVtPFZlcmV0ZW5vQWN0b3I+W107XHJcbn1cclxuXHJcbmNvbnN0IFZlcmV0ZW5vSXRlbVByb3h5ID0gbmV3IFByb3h5KFZlcmV0ZW5vSXRlbSwge1xyXG4gICAgY29uc3RydWN0KFxyXG4gICAgICAgIF90YXJnZXQsXHJcbiAgICAgICAgYXJnczogW3NvdXJjZTogUHJlQ3JlYXRlPFZlcmV0ZW5vSXRlbVNvdXJjZT4sIGNvbnRleHQ/OiBEb2N1bWVudENvbnN0cnVjdGlvbkNvbnRleHQ8VmVyZXRlbm9BY3RvciB8IG51bGw+XSxcclxuICAgICkge1xyXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IGFyZ3NbMF07XHJcbiAgICAgICAgY29uc3QgdHlwZSA9IHNvdXJjZT8udHlwZTtcclxuICAgICAgICBjb25zdCBJdGVtQ2xhc3M6IHR5cGVvZiBWZXJldGVub0l0ZW0gPSBDT05GSUcuVkVSRVRFTk8uSXRlbS5kb2N1bWVudENsYXNzZXNbdHlwZV0gPz8gVmVyZXRlbm9JdGVtO1xyXG4gICAgICAgIHJldHVybiBuZXcgSXRlbUNsYXNzKC4uLmFyZ3MpO1xyXG4gICAgfSxcclxufSk7XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0l0ZW0sIFZlcmV0ZW5vSXRlbVByb3h5IH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9BY3RvciB9IGZyb20gXCIkbW9kdWxlL2FjdG9yXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIuLlwiO1xyXG5pbXBvcnQgeyBQaHlzaWNhbFZlcmV0ZW5vSXRlbVN5c3RlbURhdGEgfSBmcm9tIFwiLi9kYXRhXCI7XHJcblxyXG5jbGFzcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbTxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0l0ZW08VFBhcmVudD4ge1xyXG4gICAgZ2V0IHdlaWdodCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ud2VpZ2h0IHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHByaWNlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5wcmljZSB8fCAwO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgUGh5c2ljYWxWZXJldGVub0l0ZW08VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9JdGVtPFRQYXJlbnQ+IHtcclxuICAgIHN5c3RlbTogUGh5c2ljYWxWZXJldGVub0l0ZW1TeXN0ZW1EYXRhO1xyXG59XHJcblxyXG5leHBvcnQgeyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSB9OyIsICJpbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIiRtb2R1bGUvYWN0b3JcIjtcclxuaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9Bcm1vclN5c3RlbURhdGEgfSBmcm9tIFwiLi9kYXRhXCI7XHJcblxyXG5jbGFzcyBWZXJldGVub0FybW9yPFRQYXJlbnQgZXh0ZW5kcyBWZXJldGVub0FjdG9yIHwgbnVsbCA9IFZlcmV0ZW5vQWN0b3IgfCBudWxsPiBleHRlbmRzIFBoeXNpY2FsVmVyZXRlbm9JdGVtPFRQYXJlbnQ+IHtcclxuICAgIGdldCBhcm1vckNsYXNzKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmFybW9yQ2xhc3MgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgcXVhbGl0eSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5xdWFsaXR5IHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IG1heER1YXJhYmlsaXR5KCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYXJtb3JDbGFzcyArIHRoaXMucXVhbGl0eTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgZHVyYWJpbGl0eSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5kdXJhYmlsaXR5IHx8IHRoaXMubWF4RHVhcmFiaWxpdHk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0FybW9yPFRQYXJlbnQgZXh0ZW5kcyBWZXJldGVub0FjdG9yIHwgbnVsbCA9IFZlcmV0ZW5vQWN0b3IgfCBudWxsPiBleHRlbmRzIFBoeXNpY2FsVmVyZXRlbm9JdGVtPFRQYXJlbnQ+IHtcclxuICAgIHN5c3RlbTogVmVyZXRlbm9Bcm1vclN5c3RlbURhdGE7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQXJtb3IgfSIsICJlbnVtIFNraWxsVHlwZSB7XHJcbiAgICBOb25lID0gXCJub25lXCIsXHJcbiAgICBNZWxlZSA9IFwibWVsZWVcIixcclxuICAgIFN0cmVuZ3RoID0gXCJzdHJlbmd0aFwiLFxyXG4gICAgQWdpbGl0eSA9IFwiYWdpbGl0eVwiLFxyXG4gICAgUGlsb3RpbmcgPSBcInBpbG90aW5nXCIsXHJcbiAgICBTdGVhbHRoID0gXCJzdGVhbHRoXCIsXHJcbiAgICBSYW5nZWQgPSBcInJhbmdlZFwiLFxyXG4gICAgQ3liZXJzaGFtYW5pc20gPSBcImN5YmVyc2hhbWFuaXNtXCIsXHJcbiAgICBTdXJ2aXZhbCA9IFwic3Vydml2YWxcIixcclxuICAgIE1lZGljaW5lID0gXCJtZWRpY2luZVwiLFxyXG4gICAgT2JzZXJ2YXRpb24gPSBcIm9ic2VydmF0aW9uXCIsXHJcbiAgICBTY2llbmNlID0gXCJzY2llbmNlXCIsXHJcbiAgICBNZWNoYW5pY3MgPSBcIm1lY2hhbmljc1wiLFxyXG4gICAgTWFuaXB1bGF0aW9uID0gXCJtYW5pcHVsYXRpb25cIixcclxuICAgIExlYWRlcnNoaXAgPSBcImxlYWRlcnNoaXBcIixcclxuICAgIFdpdGNoY3JhZnQgPSBcIndpdGNoY3JhZnRcIixcclxuICAgIEN1bHR1cmUgPSBcImN1bHR1cmVcIixcclxufTtcclxuXHJcbmludGVyZmFjZSBJRGljdGlvbmFyeTxUPiB7XHJcbiAgICBbaW5kZXg6IHN0cmluZ106IFRcclxufVxyXG5cclxuZXhwb3J0IHsgU2tpbGxUeXBlIH1cclxuZXhwb3J0IHR5cGUgeyBJRGljdGlvbmFyeSB9IiwgImltcG9ydCB7IFNraWxsVHlwZSB9IGZyb20gXCIkY29tbW9uXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQWN0b3IgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5pbXBvcnQgeyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIuLi9pbmRleFwiO1xyXG5pbXBvcnQgeyBXZWFwb25UeXBlLCBSYW5nZVR5cGUsIFZlcmV0ZW5vV2VhcG9uU3lzdGVtRGF0YSB9IGZyb20gXCIuL2RhdGFcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vV2VhcG9uPFRQYXJlbnQgZXh0ZW5kcyBWZXJldGVub0FjdG9yIHwgbnVsbCA9IFZlcmV0ZW5vQWN0b3IgfCBudWxsPiBleHRlbmRzIFBoeXNpY2FsVmVyZXRlbm9JdGVtPFRQYXJlbnQ+IHtcclxuICAgIGdldCBtb2RpZmllcigpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5tb2RpZmllcjtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgZGFtYWdlKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmRhbWFnZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgaW5pdGlhdGl2ZSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5pbml0aWF0aXZlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBjcml0KCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmNyaXQ7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHdlYXBvblR5cGUoKTogV2VhcG9uVHlwZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLndlYXBvblR5cGUgfHwgV2VhcG9uVHlwZS5Ob25lO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBhdHRhY2tXaXRoKCk6IFNraWxsVHlwZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmF0dGFja1dpdGggfHwgU2tpbGxUeXBlLk5vbmU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHJhbmdlKCk6IFJhbmdlVHlwZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLnJhbmdlIHx8IFJhbmdlVHlwZS5Ob25lO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9XZWFwb248VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgUGh5c2ljYWxWZXJldGVub0l0ZW08VFBhcmVudD4ge1xyXG4gICAgc3lzdGVtOiBWZXJldGVub1dlYXBvblN5c3RlbURhdGE7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vV2VhcG9uIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9DaGFyYWN0ZXIsIFZlcmV0ZW5vTW9uc3RlciwgVmVyZXRlbm9OcGMgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FybW9yIH0gZnJvbSBcIiRtb2R1bGUvaXRlbVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub1dlYXBvbiB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vd2VhcG9uL2RvY3VtZW50XCI7XHJcblxyXG5leHBvcnQgY29uc3QgVkVSRVRFTk9DT05GSUcgPSB7XHJcbiAgICBjb21tb246IHtcclxuICAgICAgICBwcmljZTogXCJ2ZXJldGVuby5jb21tb24ucHJpY2VcIixcclxuICAgIH0sXHJcbiAgICB0YWJzOiB7XHJcbiAgICAgICAgc3RhdDogXCJ2ZXJldGVuby50YWIuc3RhdFwiLFxyXG4gICAgICAgIGVxdWlwbWVudDogXCJ2ZXJldGVuby50YWIuZXF1aXBtZW50XCIsXHJcbiAgICAgICAgZmlnaHQ6IFwidmVyZXRlbm8udGFiLmZpZ2h0XCIsXHJcbiAgICAgICAgYmlvOiBcInZlcmV0ZW5vLnRhYi5iaW9cIlxyXG4gICAgfSxcclxuICAgIHdlYXBvblR5cGVzOiB7XHJcbiAgICAgICAgbm9uZTogXCJ2ZXJldGVuby53ZWFwb25UeXBlLm5vbmVcIixcclxuICAgICAgICBicmF3bGluZzogXCJ2ZXJldGVuby53ZWFwb25UeXBlLmJyYXdsaW5nXCIsXHJcbiAgICAgICAgbWVsZWU6IFwidmVyZXRlbm8ud2VhcG9uVHlwZS5tZWxlZVwiLFxyXG4gICAgICAgIHJhbmdlZDogXCJ2ZXJldGVuby53ZWFwb25UeXBlLnJhbmdlZFwiLFxyXG4gICAgfSxcclxuICAgIHJhbmdlVHlwZXM6IHtcclxuICAgICAgICBwb2ludEJsYW5rOiBcInZlcmV0ZW5vLnJhbmdlLnBvaW50QmxhbmtcIixcclxuICAgICAgICBjbG9zZTogXCJ2ZXJldGVuby5yYW5nZS5jbG9zZVwiLFxyXG4gICAgICAgIG1lZGl1bTogXCJ2ZXJldGVuby5yYW5nZS5tZWRpdW1cIixcclxuICAgICAgICBsb25nOiBcInZlcmV0ZW5vLnJhbmdlLmxvbmdcIixcclxuICAgICAgICB1dG1vc3Q6IFwidmVyZXRlbm8ucmFuZ2UudXRtb3N0XCJcclxuICAgIH0sXHJcbiAgICBzdGF0czoge1xyXG4gICAgICAgIGhpdFBvaW50czogXCJ2ZXJldGVuby5zdGF0LmhpdFBvaW50XCIsXHJcbiAgICAgICAgd2lsbFBvaW50czogXCJ2ZXJldGVuby5zdGF0LndpbGxQb2ludFwiLFxyXG4gICAgICAgIHJlcHV0YXRpb246IFwidmVyZXRlbm8uc3RhdC5yZXB1dGF0aW9uXCJcclxuICAgIH0sXHJcbiAgICBhdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgY29uc3RpdHV0aW9uOiBcInZlcmV0ZW5vLmF0dHJpYnV0ZS5jb25zdGl0dXRpb25cIixcclxuICAgICAgICBpbnRlbGxpZ2VuY2U6IFwidmVyZXRlbm8uYXR0cmlidXRlLmludGVsbGlnZW5jZVwiLFxyXG4gICAgICAgIGRleHRlcml0eTogXCJ2ZXJldGVuby5hdHRyaWJ1dGUuZGV4dGVyaXR5XCIsXHJcbiAgICAgICAgZW1wYXRoeTogXCJ2ZXJldGVuby5hdHRyaWJ1dGUuZW1wYXRoeVwiXHJcbiAgICB9LFxyXG4gICAgc2tpbGxzOiB7XHJcbiAgICAgICAgbWVsZWU6IFwidmVyZXRlbm8uc2tpbGwubWVsZWVcIixcclxuICAgICAgICBzdHJlbmd0aDogXCJ2ZXJldGVuby5za2lsbC5zdHJlbmd0aFwiLFxyXG4gICAgICAgIGFnaWxpdHk6IFwidmVyZXRlbm8uc2tpbGwuYWdpbGl0eVwiLFxyXG4gICAgICAgIHBpbG90aW5nOiBcInZlcmV0ZW5vLnNraWxsLnBpbG90aW5nXCIsXHJcbiAgICAgICAgc3RlYWx0aDogXCJ2ZXJldGVuby5za2lsbC5zdGVhbHRoXCIsXHJcbiAgICAgICAgcmFuZ2VkOiBcInZlcmV0ZW5vLnNraWxsLnJhbmdlZFwiLFxyXG4gICAgICAgIGN5YmVyc2hhbWFuaXNtOiBcInZlcmV0ZW5vLnNraWxsLmN5YmVyc2hhbWFuaXNtXCIsXHJcbiAgICAgICAgc3Vydml2YWw6IFwidmVyZXRlbm8uc2tpbGwuc3Vydml2YWxcIixcclxuICAgICAgICBtZWRpY2luZTogXCJ2ZXJldGVuby5za2lsbC5tZWRpY2luZVwiLFxyXG4gICAgICAgIG9ic2VydmF0aW9uOiBcInZlcmV0ZW5vLnNraWxsLm9ic2VydmF0aW9uXCIsXHJcbiAgICAgICAgc2NpZW5jZTogXCJ2ZXJldGVuby5za2lsbC5zY2llbmNlXCIsXHJcbiAgICAgICAgbWVjaGFuaWNzOiBcInZlcmV0ZW5vLnNraWxsLm1lY2hhbmljc1wiLFxyXG4gICAgICAgIG1hbmlwdWxhdGlvbjogXCJ2ZXJldGVuby5za2lsbC5tYW5pcHVsYXRpb25cIixcclxuICAgICAgICBsZWFkZXJzaGlwOiBcInZlcmV0ZW5vLnNraWxsLmxlYWRlcnNoaXBcIixcclxuICAgICAgICB3aXRjaGNyYWZ0OiBcInZlcmV0ZW5vLnNraWxsLndpdGNoY3JhZnRcIixcclxuICAgICAgICBjdWx0dXJlOiBcInZlcmV0ZW5vLnNraWxsLmN1bHR1cmVcIlxyXG4gICAgfSxcclxuXHJcbiAgICBJdGVtOiB7XHJcbiAgICAgICAgZG9jdW1lbnRDbGFzc2VzOiB7XHJcbiAgICAgICAgICAgIGFybW9yOiBWZXJldGVub0FybW9yLFxyXG4gICAgICAgICAgICB3ZWFwb246IFZlcmV0ZW5vV2VhcG9uXHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcblxyXG4gICAgQWN0b3I6IHtcclxuICAgICAgICBkb2N1bWVudENsYXNzZXM6IHtcclxuICAgICAgICAgICAgY2hhcmFjdGVyOiBWZXJldGVub0NoYXJhY3RlcixcclxuICAgICAgICAgICAgbnBjOiBWZXJldGVub05wYyxcclxuICAgICAgICAgICAgbW9uc3RlcjogVmVyZXRlbm9Nb25zdGVyXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwgImV4cG9ydCBjb25zdCBWRVJFVEVOT19QQVJUSUFMUyA9IFtcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL3N0YXRzLXRhYi5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL3N0YXRzLWJsb2NrLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3Ivc2tpbGxzLWJsb2NrLmhic1wiLFxyXG5cclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2VxdWlwbWVudC10YWIuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9pdGVtL3dlYXBvbi1wbGF0ZS5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2l0ZW0vYXJtb3ItcGxhdGUuaGJzXCIsXHJcblxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvZmlnaHQtdGFiLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvZmlnaHQvYnJhd2xpbmctd2VhcG9uLXBsYXRlLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvZmlnaHQvbWVsZWUtd2VhcG9uLXBsYXRlLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvZmlnaHQvcmFuZ2VkLXdlYXBvbi1wbGF0ZS5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2ZpZ2h0L2FybW9yLXBsYXRlLmhic1wiLFxyXG5cclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2Jpby10YWIuaGJzXCIsXHJcblxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvaXRlbS9iYXNlLWl0ZW0tYmxvY2suaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9pdGVtL3BoeXNpY2FsLWl0ZW0tYmxvY2suaGJzXCIsXHJcbl07IiwgImltcG9ydCB7IFNraWxsVHlwZSB9IGZyb20gXCIkY29tbW9uXCI7XHJcbmltcG9ydCB7IElkTGFiZWxUeXBlIH0gZnJvbSBcIiRtb2R1bGUvZGF0YVwiO1xyXG5pbXBvcnQgeyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQsIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGEgfSBmcm9tIFwiLi4vcGh5c2ljYWwtaXRlbS9zaGVldFwiO1xyXG5pbXBvcnQgeyBXZWFwb25UeXBlLCBSYW5nZVR5cGUgfSBmcm9tIFwiLi9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vV2VhcG9uIH0gZnJvbSBcIi4vZG9jdW1lbnRcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vV2VhcG9uU2hlZXQgZXh0ZW5kcyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQ8VmVyZXRlbm9XZWFwb24+e1xyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zPzogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4pOiBQcm9taXNlPFZlcmV0ZW5vV2VhcG9uU2hlZXREYXRhPiB7XHJcbiAgICAgICAgY29uc3Qgc2hlZXREYXRhID0gYXdhaXQgc3VwZXIuZ2V0RGF0YShvcHRpb25zKTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBpdGVtIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgd2VhcG9uVHlwZXMgPSBPYmplY3QudmFsdWVzKFdlYXBvblR5cGUpLm1hcCgoZSwgaSkgPT4geyByZXR1cm4geyBpZDogaSwgbGFiZWw6IGdhbWUuaTE4bi5sb2NhbGl6ZShgdmVyZXRlbm8ud2VhcG9uVHlwZS4ke2V9YCksIHR5cGU6IGUgfSB9KVxyXG4gICAgICAgIHZhciByYW5nZVR5cGVzID0gT2JqZWN0LnZhbHVlcyhSYW5nZVR5cGUpLm1hcCgoZSwgaSkgPT4geyByZXR1cm4geyBpZDogaSwgbGFiZWw6IGdhbWUuaTE4bi5sb2NhbGl6ZShgdmVyZXRlbm8ucmFuZ2UuJHtlfWApLCB0eXBlOiBlIH0gfSlcclxuICAgICAgICB2YXIgc2tpbGxUeXBlcyA9IE9iamVjdC52YWx1ZXMoU2tpbGxUeXBlKS5tYXAoKGUsIGkpID0+IHsgcmV0dXJuIHsgaWQ6IGksIGxhYmVsOiBnYW1lLmkxOG4ubG9jYWxpemUoYHZlcmV0ZW5vLnNraWxsLiR7ZX1gKSwgdHlwZTogZSB9IH0pXHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogVmVyZXRlbm9XZWFwb25TaGVldERhdGEgPSB7XHJcbiAgICAgICAgICAgIC4uLnNoZWV0RGF0YSxcclxuICAgICAgICAgICAgbW9kaWZpZXI6IGl0ZW0ubW9kaWZpZXIsXHJcbiAgICAgICAgICAgIHdlYXBvblR5cGU6IGl0ZW0ud2VhcG9uVHlwZSxcclxuICAgICAgICAgICAgYXR0YWNrV2l0aDogaXRlbS5hdHRhY2tXaXRoLFxyXG4gICAgICAgICAgICBjcml0OiBpdGVtLmNyaXQsXHJcbiAgICAgICAgICAgIGRhbWFnZTogaXRlbS5kYW1hZ2UsXHJcbiAgICAgICAgICAgIGluaXRpYXRpdmU6IGl0ZW0uaW5pdGlhdGl2ZSxcclxuICAgICAgICAgICAgcmFuZ2U6IGl0ZW0ucmFuZ2UsXHJcbiAgICAgICAgICAgIHdlYXBvblR5cGVzOiB3ZWFwb25UeXBlcyxcclxuICAgICAgICAgICAgcmFuZ2VzOiByYW5nZVR5cGVzLFxyXG4gICAgICAgICAgICBza2lsbHM6IHNraWxsVHlwZXNcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB0ZW1wbGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gYHN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9pdGVtcy93ZWFwb24tc2hlZXQuaGJzYDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vV2VhcG9uU2hlZXREYXRhIGV4dGVuZHMgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YTxWZXJldGVub1dlYXBvbj4ge1xyXG4gICAgbW9kaWZpZXI6IG51bWJlcjtcclxuICAgIGRhbWFnZTogbnVtYmVyO1xyXG4gICAgaW5pdGlhdGl2ZTogbnVtYmVyO1xyXG4gICAgY3JpdDogbnVtYmVyO1xyXG4gICAgd2VhcG9uVHlwZTogV2VhcG9uVHlwZSxcclxuICAgIHdlYXBvblR5cGVzOiBJZExhYmVsVHlwZTxXZWFwb25UeXBlPltdLFxyXG4gICAgYXR0YWNrV2l0aDogU2tpbGxUeXBlLFxyXG4gICAgc2tpbGxzOiBJZExhYmVsVHlwZTxTa2lsbFR5cGU+W107XHJcbiAgICByYW5nZTogUmFuZ2VUeXBlXHJcbiAgICByYW5nZXM6IElkTGFiZWxUeXBlPFJhbmdlVHlwZT5bXTtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9XZWFwb25TaGVldCB9O1xyXG5leHBvcnQgdHlwZSB7IFZlcmV0ZW5vV2VhcG9uU2hlZXREYXRhIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9JdGVtIH0gZnJvbSBcIiRtb2R1bGUvaXRlbVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIi4uXCI7XHJcblxyXG5hYnN0cmFjdCBjbGFzcyBWZXJldGVub0FjdG9yU2hlZXQ8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9BY3Rvcj4gZXh0ZW5kcyBBY3RvclNoZWV0PFRBY3RvciwgVmVyZXRlbm9JdGVtPiB7XHJcbiAgICBzdGF0aWMgb3ZlcnJpZGUgZ2V0IGRlZmF1bHRPcHRpb25zKCk6IEFjdG9yU2hlZXRPcHRpb25zIHtcclxuICAgICAgICBjb25zdCBpc1J1c3NpYW5MYW5ndWFnZSA9IGdhbWUuc2V0dGluZ3MuZ2V0KFwiY29yZVwiLCBcImxhbmd1YWdlXCIpID09ICdydSc7XHJcblxyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBtZXJnZU9iamVjdChzdXBlci5kZWZhdWx0T3B0aW9ucywge1xyXG4gICAgICAgICAgICB3aWR0aDogNTYwLFxyXG4gICAgICAgICAgICBjbGFzc2VzOiBbJ3ZlcmV0ZW5vJywgJ2FjdG9yJywgJ3NoZWV0J11cclxuICAgICAgICB9KTtcclxuICAgICAgICBpZihpc1J1c3NpYW5MYW5ndWFnZSl7XHJcbiAgICAgICAgICAgIG9wdGlvbnMuY2xhc3Nlcy5wdXNoKFwibGFuZy1ydVwiKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zOiBQYXJ0aWFsPERvY3VtZW50U2hlZXRPcHRpb25zPiA9IHt9KTogUHJvbWlzZTxWZXJldGVub0FjdG9yU2hlZXREYXRhPFRBY3Rvcj4+IHtcclxuICAgICAgICBvcHRpb25zLmlkID0gdGhpcy5pZDtcclxuICAgICAgICBvcHRpb25zLmVkaXRhYmxlID0gdGhpcy5pc0VkaXRhYmxlO1xyXG5cclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBhY3RvcjogYWN0b3IsXHJcbiAgICAgICAgICAgIGNzc0NsYXNzOiB0aGlzLmFjdG9yLmlzT3duZXIgPyBcImVkaXRhYmxlXCIgOiBcImxvY2tlZFwiLFxyXG4gICAgICAgICAgICBkYXRhOiBhY3Rvci5zeXN0ZW0sXHJcbiAgICAgICAgICAgIGRvY3VtZW50OiB0aGlzLmFjdG9yLFxyXG4gICAgICAgICAgICBlZGl0YWJsZTogdGhpcy5pc0VkaXRhYmxlLFxyXG4gICAgICAgICAgICBlZmZlY3RzOiBbXSxcclxuICAgICAgICAgICAgbGltaXRlZDogdGhpcy5hY3Rvci5saW1pdGVkLFxyXG4gICAgICAgICAgICBvcHRpb25zLFxyXG4gICAgICAgICAgICBvd25lcjogdGhpcy5hY3Rvci5pc093bmVyLFxyXG4gICAgICAgICAgICB0aXRsZTogdGhpcy50aXRsZSxcclxuICAgICAgICAgICAgaXRlbXM6IGFjdG9yLml0ZW1zLFxyXG4gICAgICAgICAgICBhY3RvclR5cGU6IGFjdG9yLnR5cGUsXHJcblxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYWN0b3IuRGVzY3JpcHRpb25cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb3ZlcnJpZGUgYWN0aXZhdGVMaXN0ZW5lcnMoJGh0bWw6IEpRdWVyeSk6IHZvaWQge1xyXG4gICAgICAgIHN1cGVyLmFjdGl2YXRlTGlzdGVuZXJzKCRodG1sKTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQWN0b3JTaGVldERhdGE8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9BY3Rvcj4gZXh0ZW5kcyBBY3RvclNoZWV0RGF0YTxUQWN0b3I+IHtcclxuICAgIGFjdG9yVHlwZTogc3RyaW5nIHwgbnVsbDtcclxuICAgIGFjdG9yOiBUQWN0b3I7XHJcbiAgICBkYXRhOiBUQWN0b3JbXCJzeXN0ZW1cIl07XHJcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0FjdG9yU2hlZXQgfVxyXG5leHBvcnQgdHlwZSB7IFZlcmV0ZW5vQWN0b3JTaGVldERhdGEgfVxyXG4iLCAiaW1wb3J0IHsgVmVyZXRlbm9Sb2xsRGF0YSwgVmVyZXRlbm9Sb2xsT3B0aW9ucyB9IGZyb20gXCIkbW9kdWxlL2RhdGFcIjtcclxuaW1wb3J0IHsgQ2hhdE1lc3NhZ2VTY2hlbWEgfSBmcm9tIFwiLi4vLi4vLi4vdHlwZXMvZm91bmRyeS9jb21tb24vZG9jdW1lbnRzL2NoYXQtbWVzc2FnZVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9Sb2xsIGV4dGVuZHMgUm9sbCB7XHJcbiAgICBzdGF0aWMgb3ZlcnJpZGUgQ0hBVF9URU1QTEFURSA9IFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvY2hhdC9yb2xscy92ZXJldGVuby1yb2xsLWNoYXQtbWVzc2FnZS5oYnNcIjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihmb3JtdWxhOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgb3B0aW9ucz86IFJvbGxPcHRpb25zKSB7XHJcbiAgICAgICAgc3VwZXIoZm9ybXVsYSwgZGF0YSwgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIG92ZXJyaWRlIGFzeW5jIF9ldmFsdWF0ZSh7IG1pbmltaXplLCBtYXhpbWl6ZSwgfTogT21pdDxFdmFsdWF0ZVJvbGxQYXJhbXMsIFwiYXN5bmNcIj4pOiBQcm9taXNlPFJvbGxlZDx0aGlzPj4ge1xyXG4gICAgICAgIGNvbnN0IHN1cGVyRXZhbHVhdGUgPSBhd2FpdCBzdXBlci5fZXZhbHVhdGUoeyBtaW5pbWl6ZSwgbWF4aW1pemUgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBzdXBlckV2YWx1YXRlO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Sb2xsIGV4dGVuZHMgUm9sbCB7IH1cclxuXHJcbmNsYXNzIFZlcmV0ZW5vU2tpbGxSb2xsIGV4dGVuZHMgVmVyZXRlbm9Sb2xsIHtcclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCByb2xsRGF0YSA9IG9wdGlvbnMucm9sbERhdGE7XHJcbiAgICAgICAgY29uc3QgZm9ybXVsYSA9IGAke3JvbGxEYXRhLnBvb2x9JHtyb2xsRGF0YS5kaWNlfWA7XHJcblxyXG4gICAgICAgIHN1cGVyKGZvcm11bGEsIChyb2xsRGF0YSBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+KSwgb3B0aW9ucy5tZXNzYWdlRGF0YSk7XHJcbiAgICB9XHJcbn1cclxuaW50ZXJmYWNlIFZlcmV0ZW5vU2tpbGxSb2xsIGV4dGVuZHMgVmVyZXRlbm9Sb2xsIHsgfVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9Sb2xsLCBWZXJldGVub1NraWxsUm9sbCB9XHJcbiIsICJpbXBvcnQgeyBWZXJldGVub1JvbGxPcHRpb25zLCBWZXJldGVub1JvbGxUeXBlIH0gZnJvbSBcIiRtb2R1bGUvZGF0YVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub1JvbGwgfSBmcm9tIFwiJG1vZHVsZS9zeXN0ZW0vcm9sbFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9Sb2xsZXIge1xyXG4gICAgcm9sbE9iamVjdDogVmVyZXRlbm9Sb2xsIHwgbnVsbCA9IG51bGw7XHJcbiAgICBvcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zIHwgbnVsbCA9IG51bGw7XHJcbiAgICB2ZXJldGVub1Jlc3VsdDogVmVyZXRlbm9SZXN1bHQgPSBuZXcgVmVyZXRlbm9SZXN1bHQoKTtcclxuICAgIHZlcmV0ZW5vUm9sbHM6IFZlcmV0ZW5vRGllUmVzdWx0W10gPSBbXTtcclxuXHJcbiAgICBhc3luYyByb2xsKHJvbGxPcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gcm9sbE9wdGlvbnM7XHJcbiAgICAgICAgaWYgKHJvbGxPcHRpb25zLnJvbGxEYXRhLnBvb2wgPD0gMCAmJiByb2xsT3B0aW9ucy50eXBlICE9IFZlcmV0ZW5vUm9sbFR5cGUuQXJtb3JCbG9jaykge1xyXG4gICAgICAgICAgICAvL3JldHVybiBhd2FpdCB0aGlzLnJvbGxEZXNwZXJhdGlvbihyb2xsT3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcm9sbEZvcm11bGEgPSBgJHtyb2xsT3B0aW9ucy5yb2xsRGF0YS5wb29sfSR7cm9sbE9wdGlvbnMucm9sbERhdGEuZGljZX1gO1xyXG5cclxuICAgICAgICBsZXQgcm9sbCA9IG5ldyBWZXJldGVub1JvbGwocm9sbEZvcm11bGEpO1xyXG4gICAgICAgIHRoaXMucm9sbE9iamVjdCA9IHJvbGw7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5yb2xsT2JqZWN0Ll9ldmFsdWF0ZWQpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5yb2xsT2JqZWN0LmV2YWx1YXRlKHt9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVldmFsdWF0ZVRvdGFsKCk7XHJcbiAgICAgICAgdGhpcy50b01lc3NhZ2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByb2xsSW5pdGlhdGl2ZShyb2xsT3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHJvbGxPcHRpb25zO1xyXG5cclxuICAgICAgICBsZXQgcm9sbEZvcm11bGEgPSBgJHtyb2xsT3B0aW9ucy5yb2xsRGF0YS5wb29sfSR7cm9sbE9wdGlvbnMucm9sbERhdGEuZGljZX1gO1xyXG5cclxuICAgICAgICBjb25zdCBib251cyA9IHJvbGxPcHRpb25zLnJvbGxEYXRhLmJvbnVzO1xyXG4gICAgICAgIGlmIChib251cyAhPT0gbnVsbCAmJiBib251cyAhPT0gMCkge1xyXG4gICAgICAgICAgICBpZiAoYm9udXMgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICByb2xsRm9ybXVsYSA9IHJvbGxGb3JtdWxhICsgYCske2JvbnVzfWBcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJvbGxGb3JtdWxhID0gcm9sbEZvcm11bGEgKyBgJHtib251c31gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCByb2xsID0gbmV3IFZlcmV0ZW5vUm9sbChyb2xsRm9ybXVsYSk7XHJcbiAgICAgICAgdGhpcy5yb2xsT2JqZWN0ID0gcm9sbDtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnJvbGxPYmplY3QuX2V2YWx1YXRlZCkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJvbGxPYmplY3QuZXZhbHVhdGUoe30pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5yZWV2YWx1YXRlVG90YWwoKTtcclxuICAgICAgICB0aGlzLnRvTWVzc2FnZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlZXZhbHVhdGVUb3RhbCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBpZiAoIXRoaXMucm9sbE9iamVjdCB8fCAhdGhpcy5vcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5yb2xsT2JqZWN0IS5fZXZhbHVhdGVkKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucm9sbE9iamVjdCEuZXZhbHVhdGUoe30pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yb2xsRGF0YS5pc1NlcmlhbCkge1xyXG4gICAgICAgICAgICB0aGlzLnJvbGxPYmplY3QuX2Zvcm11bGEgKz0gJysnXHJcbiAgICAgICAgICAgIGxldCBpc0ludGVycnVwdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHdoaWxlICghaXNJbnRlcnJ1cHRlZCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGFkZGl0aW9uYWxSb2xsID0gbmV3IFJvbGwoJzFkMjAnKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IGFkZGl0aW9uYWxSb2xsLmV2YWx1YXRlKHt9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFkZGl0aW9uYWxSb2xsUmVzdWx0OiBEaWVSZXN1bHQgPSAoYWRkaXRpb25hbFJvbGwudGVybXNbMF0gYXMgYW55KS5yZXN1bHRzWzBdO1xyXG4gICAgICAgICAgICAgICAgKHRoaXMucm9sbE9iamVjdC50ZXJtc1swXSBhcyBhbnkpLnJlc3VsdHMucHVzaChhZGRpdGlvbmFsUm9sbFJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYWRkaXRpb25hbFJvbGxSZXN1bHQucmVzdWx0IDw9IDQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpc0ludGVycnVwdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJvbGxEaWNlc1Jlc3VsdHMgPSAodGhpcy5yb2xsT2JqZWN0LnRlcm1zWzBdIGFzIGFueSkucmVzdWx0cyBhcyBEaWVSZXN1bHRbXTtcclxuICAgICAgICBsZXQgcm9sbFJlc3VsdCA9IHRoaXMuY2FsY3VsYXRlRGljZXNUb3RhbChyb2xsRGljZXNSZXN1bHRzKTtcclxuXHJcbiAgICAgICAgdGhpcy52ZXJldGVub1Jlc3VsdCA9IHJvbGxSZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgY2FsY3VsYXRlRGljZXNUb3RhbChkaWNlczogRGllUmVzdWx0W10pOiBWZXJldGVub1Jlc3VsdCB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0OiBWZXJldGVub1Jlc3VsdCA9IHtcclxuICAgICAgICAgICAgdG90YWw6IDAsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NlczogMCxcclxuICAgICAgICAgICAgY3JpdEZhaWxzOiAwXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaWNlcy5mb3JFYWNoKHIgPT4ge1xyXG4gICAgICAgICAgICBsZXQgcm9sbFJlc3VsdDogVmVyZXRlbm9EaWVSZXN1bHQgPSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQ6IHIucmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgY2xhc3NlczogJ2QyMCdcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyLnJlc3VsdCA9PT0gMjApIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC50b3RhbCArPSAyO1xyXG4gICAgICAgICAgICAgICAgcm9sbFJlc3VsdC5jbGFzc2VzICs9ICcgbWF4JztcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5zdWNjZXNzZXMgKz0gMjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHIucmVzdWx0ID49IDE3ICYmIHIucmVzdWx0IDw9IDE5KSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQudG90YWwrKztcclxuICAgICAgICAgICAgICAgIHJvbGxSZXN1bHQuY2xhc3NlcyArPSAnIGdvb2QnO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnN1Y2Nlc3NlcysrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoci5yZXN1bHQgPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC50b3RhbC0tO1xyXG4gICAgICAgICAgICAgICAgcm9sbFJlc3VsdC5jbGFzc2VzICs9ICcgbWluJztcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5jcml0RmFpbHMrKztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy52ZXJldGVub1JvbGxzLnB1c2gocm9sbFJlc3VsdCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgdG9NZXNzYWdlKCk6IFByb21pc2U8Q2hhdE1lc3NhZ2UgfCB1bmRlZmluZWQ+IHtcclxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjaGF0RGF0YSA9IHRoaXMub3B0aW9ucy5tZXNzYWdlRGF0YTtcclxuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHRoaXMuZ2V0VGVtcGxhdGUodGhpcy5vcHRpb25zLnR5cGUpO1xyXG4gICAgICAgIGNvbnN0IHZlcmV0ZW5vUm9sbERhdGEgPSB0aGlzLmdldFZlcmV0ZW5vUm9sbERhdGEoKTtcclxuXHJcbiAgICAgICAgY2hhdERhdGEuY29udGVudCA9IGF3YWl0IHJlbmRlclRlbXBsYXRlKHRlbXBsYXRlLCB2ZXJldGVub1JvbGxEYXRhKTtcclxuICAgICAgICBjaGF0RGF0YS5yb2xsID0gdGhpcy5yb2xsT2JqZWN0O1xyXG5cclxuICAgICAgICByZXR1cm4gQ2hhdE1lc3NhZ2UuY3JlYXRlKGNoYXREYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRUZW1wbGF0ZSh0eXBlOiBWZXJldGVub1JvbGxUeXBlKTogc3RyaW5nIHtcclxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBWZXJldGVub1JvbGxUeXBlLlJlZ3VsYXI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9jaGF0L3JvbGxzL3ZlcmV0ZW5vLXJvbGwtY2hhdC1tZXNzYWdlLmhic1wiO1xyXG4gICAgICAgICAgICBjYXNlIFZlcmV0ZW5vUm9sbFR5cGUuQXJtb3JCbG9jazpcclxuICAgICAgICAgICAgICAgIHJldHVybiBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL2NoYXQvcm9sbHMvdmVyZXRlbm8tYXJtb3Itcm9sbC1jaGF0LW1lc3NhZ2UuaGJzXCI7XHJcbiAgICAgICAgICAgIGNhc2UgVmVyZXRlbm9Sb2xsVHlwZS5Jbml0aWF0aXZlOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvY2hhdC9yb2xscy92ZXJldGVuby1pbml0aWF0aXZlLXJvbGwtY2hhdC1tZXNzYWdlLmhic1wiO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvY2hhdC9yb2xscy92ZXJldGVuby1yb2xsLWNoYXQtbWVzc2FnZS5oYnNcIjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VmVyZXRlbm9Sb2xsRGF0YSgpOiBWZXJldGVub1JvbGxSZXN1bHQge1xyXG4gICAgICAgIGxldCByb2xsRGF0YSA9IHtcclxuICAgICAgICAgICAgZm9ybXVsYTogdGhpcy5yb2xsT2JqZWN0IS5fZm9ybXVsYSxcclxuICAgICAgICAgICAgdG90YWw6IHRoaXMucm9sbE9iamVjdCEudG90YWwhLFxyXG4gICAgICAgICAgICB2ZXJldGVub1RvdGFsOiB0aGlzLnZlcmV0ZW5vUmVzdWx0LnRvdGFsLFxyXG4gICAgICAgICAgICB2ZXJldGVub1N1Y2Nlc3NlczogdGhpcy52ZXJldGVub1Jlc3VsdC5zdWNjZXNzZXMsXHJcbiAgICAgICAgICAgIHZlcmV0ZW5vQ3JpdEZhaWxzOiB0aGlzLnZlcmV0ZW5vUmVzdWx0LmNyaXRGYWlscyxcclxuICAgICAgICAgICAgcm9sbHM6IHRoaXMudmVyZXRlbm9Sb2xsc1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJvbGxEYXRhO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgRGllUmVzdWx0IHtcclxuICAgIGFjdGl2ZTogYm9vbGVhbjtcclxuICAgIHJlc3VsdDogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9EaWVSZXN1bHQge1xyXG4gICAgcmVzdWx0OiBudW1iZXI7XHJcbiAgICBjbGFzc2VzOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNsYXNzIFZlcmV0ZW5vUmVzdWx0IHtcclxuICAgIHRvdGFsOiBudW1iZXIgPSAwO1xyXG4gICAgc3VjY2Vzc2VzOiBudW1iZXIgPSAwO1xyXG4gICAgY3JpdEZhaWxzOiBudW1iZXIgPSAwO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Sb2xsUmVzdWx0IHtcclxuICAgIGZvcm11bGE6IHN0cmluZztcclxuICAgIHRvdGFsOiBudW1iZXI7XHJcbiAgICB2ZXJldGVub1RvdGFsOiBudW1iZXI7XHJcbiAgICB2ZXJldGVub1N1Y2Nlc3NlczogbnVtYmVyO1xyXG4gICAgdmVyZXRlbm9Dcml0RmFpbHM6IG51bWJlcjtcclxuICAgIHJvbGxzOiBWZXJldGVub0RpZVJlc3VsdFtdO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub1JvbGxlciB9IiwgImV4cG9ydCBjbGFzcyBWZXJldGVub1JvbGxEaWFsb2cge1xyXG4gICAgdGVtcGxhdGU6IHN0cmluZyA9ICdzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9jaGF0L2RpYWxvZy9yb2xsLWRpYWxvZy5oYnMnO1xyXG5cclxuICAgIGFzeW5jIGdldFRhc2tDaGVja09wdGlvbnMoKTogUHJvbWlzZTxWZXJldGVub1JvbGxEaWFsb2dBcmd1bWVudD4ge1xyXG4gICAgICAgIGNvbnN0IGh0bWwgPSBhd2FpdCByZW5kZXJUZW1wbGF0ZSh0aGlzLnRlbXBsYXRlLCB7fSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlx1MDQxQ1x1MDQzRVx1MDQzNFx1MDQzOFx1MDQ0NFx1MDQzOFx1MDQzQVx1MDQzMFx1MDQ0Mlx1MDQzRVx1MDQ0MFx1MDQ0QiBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0NDFcdTA0M0FcdTA0MzBcIixcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGh0bWwsXHJcbiAgICAgICAgICAgICAgICBidXR0b25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIlx1MDQxNFx1MDQzMFx1MDQzQlx1MDQzNVx1MDQzNVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogaHRtbCA9PiByZXNvbHZlKHRoaXMuX3Byb2Nlc3NUYXNrQ2hlY2tPcHRpb25zKChodG1sWzBdIGFzIHVua25vd24gYXMgSFRNTEFuY2hvckVsZW1lbnQpLnF1ZXJ5U2VsZWN0b3IoXCJmb3JtXCIpKSlcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGNhbmNlbDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJcdTA0MUVcdTA0NDJcdTA0M0NcdTA0MzVcdTA0M0RcdTA0MzBcIlxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBcIm5vcm1hbFwiLFxyXG4gICAgICAgICAgICAgICAgY2xvc2U6ICgpID0+IHJlc29sdmUoeyBtb2RpZmllcjogMCwgYmxpbmRSb2xsOiBmYWxzZSwgY2FuY2VsbGVkOiB0cnVlIH0pXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBuZXcgRGlhbG9nKGRhdGEpLnJlbmRlcih0cnVlKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBfcHJvY2Vzc1Rhc2tDaGVja09wdGlvbnMoZm9ybTogSlF1ZXJ5KTogVmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG1vZGlmaWVyOiBwYXJzZUludChmb3JtLm1vZGlmaWVyLnZhbHVlKSxcclxuICAgICAgICAgICAgYmxpbmRSb2xsOiBmb3JtLmJsaW5kUm9sbC5jaGVja2VkLFxyXG4gICAgICAgICAgICBjYW5jZWxsZWQ6IGZhbHNlXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50IHtcclxuICAgIG1vZGlmaWVyOiBudW1iZXIgPSAwO1xyXG4gICAgYmxpbmRSb2xsOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBjYW5jZWxsZWQ6IGJvb2xlYW4gPSB0cnVlO1xyXG59IiwgImltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmUgfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9BY3RvclNoZWV0LCBWZXJldGVub0FjdG9yU2hlZXREYXRhIH0gZnJvbSBcIi4uL2Jhc2Uvc2hlZXRcIjtcclxuaW1wb3J0IHsgQXR0cmlidXRlV2l0aFNraWxscywgQXR0cmlidXRlc0Jsb2NrLCBJdGVtQWN0aW9uSW5mbywgU2tpbGwsIFNraWxsc0Jsb2NrLCBTdGF0LCBTdGF0c0Jsb2NrLCBXZWFwb25BdHRhY2tJbmZvIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0NoYXRPcHRpb25zLCBWZXJldGVub01lc3NhZ2VEYXRhLCBWZXJldGVub1JvbGxEYXRhLCBWZXJldGVub1JvbGxPcHRpb25zLCBWZXJldGVub1JvbGxUeXBlIH0gZnJvbSBcIiRtb2R1bGUvZGF0YVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub1JvbGxlciB9IGZyb20gXCIkbW9kdWxlL3V0aWxzL3ZlcmV0ZW5vLXJvbGxlclwiO1xyXG5pbXBvcnQgeyBWZXJldGVub1dlYXBvbiB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vd2VhcG9uL2RvY3VtZW50XCI7XHJcbmltcG9ydCB7IFBoeXNpY2FsVmVyZXRlbm9JdGVtLCBWZXJldGVub0FybW9yLCBWZXJldGVub0l0ZW0gfSBmcm9tIFwiJG1vZHVsZS9pdGVtXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vSXRlbVR5cGUgfSBmcm9tIFwiJG1vZHVsZS9pdGVtL2Jhc2UvZGF0YVwiO1xyXG5pbXBvcnQgeyBBdHRhY2tUeXBlLCBXZWFwb25UeXBlIH0gZnJvbSBcIiRtb2R1bGUvaXRlbS93ZWFwb24vZGF0YVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub1JvbGxEaWFsb2csIFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50IH0gZnJvbSBcIiRtb2R1bGUvZGlhbG9nXCI7XHJcblxyXG5hYnN0cmFjdCBjbGFzcyBWZXJldGVub0NyZWF0dXJlU2hlZXQ8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZT4gZXh0ZW5kcyBWZXJldGVub0FjdG9yU2hlZXQ8VEFjdG9yPntcclxuICAgIG92ZXJyaWRlIGFzeW5jIGdldERhdGEob3B0aW9uczogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4gPSB7fSk6IFByb21pc2U8VmVyZXRlbm9DcmVhdHVyZVNoZWV0RGF0YTxUQWN0b3I+PiB7XHJcbiAgICAgICAgY29uc3Qgc2hlZXREYXRhID0gYXdhaXQgc3VwZXIuZ2V0RGF0YShvcHRpb25zKTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgZm9yIChsZXQgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKGFjdG9yLlN0YXRzKSkge1xyXG4gICAgICAgICAgICAodiBhcyBTdGF0KS5sYWJlbCA9IGdhbWUuaTE4bi5sb2NhbGl6ZShgdmVyZXRlbm8uc3RhdC4ke2t9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoYWN0b3IuQXR0cmlidXRlcykpIHtcclxuICAgICAgICAgICAgKHYgYXMgQXR0cmlidXRlV2l0aFNraWxscykubGFiZWwgPSBnYW1lLmkxOG4ubG9jYWxpemUoYHZlcmV0ZW5vLmF0dHJpYnV0ZS4ke2t9YCk7XHJcbiAgICAgICAgICAgICh2IGFzIEF0dHJpYnV0ZVdpdGhTa2lsbHMpLnNraWxscyA9IHt9O1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgW2sxLCB2MV0gb2YgT2JqZWN0LmVudHJpZXMoYWN0b3IuU2tpbGxzKS5maWx0ZXIoeCA9PiB4WzFdLmF0dHJpYnV0ZSA9PT0gaykpIHtcclxuICAgICAgICAgICAgICAgICh2MSBhcyBTa2lsbCkubGFiZWwgPSBnYW1lLmkxOG4ubG9jYWxpemUoYHZlcmV0ZW5vLnNraWxsLiR7azF9YCk7XHJcbiAgICAgICAgICAgICAgICAodiBhcyBBdHRyaWJ1dGVXaXRoU2tpbGxzKS5za2lsbHNbazFdID0gdjE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGVxdWlwcGVkV2VhcG9ucyA9IGFjdG9yLkVxdWlwcGVkV2VhcG9ucy5tYXAoeCA9PiB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoeC53ZWFwb25UeXBlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFdlYXBvblR5cGUuQnJhd2xpbmc6XHJcbiAgICAgICAgICAgICAgICAgICAgeC5zeXN0ZW1bXCJpc0JyYXdsaW5nXCJdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIFdlYXBvblR5cGUuTWVsZWU6XHJcbiAgICAgICAgICAgICAgICAgICAgeC5zeXN0ZW1bXCJpc01lbGVlXCJdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIFdlYXBvblR5cGUuUmFuZ2VkOlxyXG4gICAgICAgICAgICAgICAgICAgIHguc3lzdGVtW1wiaXNSYW5nZWRcIl0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4geDtcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAuLi5zaGVldERhdGEsXHJcbiAgICAgICAgICAgIHN0YXRzOiBhY3Rvci5TdGF0cyxcclxuICAgICAgICAgICAgYXR0cmlidXRlczogYWN0b3IuQXR0cmlidXRlcyxcclxuICAgICAgICAgICAgc2tpbGxzOiBhY3Rvci5Ta2lsbHMsXHJcbiAgICAgICAgICAgIG1heEhwOiBhY3Rvci5NYXhIcCxcclxuICAgICAgICAgICAgbWF4V3A6IGFjdG9yLk1heFdwLFxyXG4gICAgICAgICAgICB3ZWFwb25zOiBhY3Rvci5XZWFwb25zLFxyXG4gICAgICAgICAgICBlcXVpcHBlZFdlYXBvbnM6IGVxdWlwcGVkV2VhcG9ucyxcclxuICAgICAgICAgICAgYXJtb3JzOiBhY3Rvci5Bcm1vcnMsXHJcbiAgICAgICAgICAgIGVxdWlwcGVkQXJtb3I6IGFjdG9yLkVxdWlwcGVkQXJtb3IsXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG92ZXJyaWRlIGFjdGl2YXRlTGlzdGVuZXJzKCRodG1sOiBKUXVlcnkpOiB2b2lkIHtcclxuICAgICAgICBzdXBlci5hY3RpdmF0ZUxpc3RlbmVycygkaHRtbCk7XHJcbiAgICAgICAgY29uc3QgaHRtbCA9ICRodG1sWzBdO1xyXG5cclxuICAgICAgICAkaHRtbC5vbignY2xpY2snLCAnLnNraWxsLWNoZWNrJywgdGhpcy4jb25Ta2lsbENoZWNrUm9sbC5iaW5kKHRoaXMpKTtcclxuICAgICAgICAkaHRtbC5vbignY2xpY2snLCAnLml0ZW0tYWN0aW9uJywgdGhpcy4jb25JdGVtQWN0aW9uLmJpbmQodGhpcykpO1xyXG4gICAgICAgICRodG1sLm9uKCdjbGljaycsICcuYXJtb3ItYWN0aW9uJywgdGhpcy4jb25Bcm1vckFjdGlvbi5iaW5kKHRoaXMpKTtcclxuICAgICAgICAkaHRtbC5vbignY2xpY2snLCAnLndlYXBvbi1hY3Rpb24nLCB0aGlzLiNvbldlYXBvbkFjdGlvbi5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgLy8gaHRtbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICcuaXRlbS1hY3Rpb24nLCB0aGlzLiNvbkl0ZW1BY3Rpb24uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgLy8gaHRtbC5vbignY2xpY2snLCAnLndlYXBvbi1hY3Rpb24nLCB0aGlzLiNvbldlYXBvbkFjdGlvbi5iaW5kKHRoaXMpKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyAjb25Ta2lsbENoZWNrUm9sbChldmVudDogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcbiAgICAgICAgY29uc3QgZGF0YXNldCA9IChlbGVtZW50IGFzIEhUTUxBbmNob3JFbGVtZW50KT8uZGF0YXNldDtcclxuXHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgY29uc3Qgc2hvd0RpYWxvZyA9IChDT05GSUcuU0VUVElOR1MuU2hvd1Rhc2tDaGVja09wdGlvbnMgIT09IGV2ZW50LmN0cmxLZXkpO1xyXG4gICAgICAgIGxldCBkaWFsb2dSZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQoKTtcclxuICAgICAgICBpZiAoc2hvd0RpYWxvZykge1xyXG4gICAgICAgICAgICBkaWFsb2dSZXN1bHQgPSBhd2FpdCAobmV3IFZlcmV0ZW5vUm9sbERpYWxvZygpKS5nZXRUYXNrQ2hlY2tPcHRpb25zKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlhbG9nUmVzdWx0LmNhbmNlbGxlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgeyBsYWJlbCwgcm9sbEtleSwgcm9sbFR5cGUgfSA9IGRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGlmIChyb2xsS2V5ID09IG51bGwgfHwgcm9sbFR5cGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcm9sbERhdGEgPSBuZXcgVmVyZXRlbm9Sb2xsRGF0YSgpO1xyXG4gICAgICAgIGlmIChyb2xsVHlwZSA9PSBcImF0dHJpYnV0ZVwiKSB7XHJcbiAgICAgICAgICAgIHJvbGxEYXRhID0gYXdhaXQgYWN0b3IuZ2V0QXR0cmlidXRlUm9sbERhdGEocm9sbEtleSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcm9sbERhdGEgPSBhd2FpdCBhY3Rvci5nZXRTa2lsbFJvbGxEYXRhKHJvbGxLZXkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcm9sbERhdGEucG9vbCArPSBkaWFsb2dSZXN1bHQubW9kaWZpZXI7XHJcblxyXG5cclxuICAgICAgICBsZXQgbWVzc2FnZURhdGEgPSB7XHJcbiAgICAgICAgICAgIHVzZXJJZDogZ2FtZS51c2VyLl9pZCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIHNwZWFrZXI6IENoYXRNZXNzYWdlLmdldFNwZWFrZXIoKSxcclxuICAgICAgICAgICAgZmxhdm9yOiBsYWJlbCB8fCAnJyxcclxuICAgICAgICAgICAgc291bmQ6IENPTkZJRy5zb3VuZHMuZGljZSxcclxuICAgICAgICAgICAgYmxpbmQ6IGZhbHNlIHx8IGRpYWxvZ1Jlc3VsdC5ibGluZFJvbGwgfHwgZXZlbnQuc2hpZnRLZXlcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCByb2xsT3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgdHlwZTogVmVyZXRlbm9Sb2xsVHlwZS5SZWd1bGFyLFxyXG4gICAgICAgICAgICBtZXNzYWdlRGF0YTogbWVzc2FnZURhdGEsXHJcbiAgICAgICAgICAgIHJvbGxEYXRhOiByb2xsRGF0YVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgcm9sbGVyID0gbmV3IFZlcmV0ZW5vUm9sbGVyKCk7XHJcbiAgICAgICAgYXdhaXQgcm9sbGVyLnJvbGwocm9sbE9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jICNvbldlYXBvbkFjdGlvbihldmVudDogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcbiAgICAgICAgY29uc3QgZGF0YXNldCA9IChlbGVtZW50IGFzIEhUTUxBbmNob3JFbGVtZW50KT8uZGF0YXNldDtcclxuXHJcbiAgICAgICAgY29uc3QgeyBpdGVtVHlwZSwgYWN0aW9uVHlwZSwgaXRlbUlkLCB3ZWFwb25UeXBlLCBhdHRhY2tUeXBlIH0gPSBkYXRhc2V0O1xyXG5cclxuICAgICAgICBpZiAoaXRlbUlkID09IG51bGwgfHwgaXRlbUlkID09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjaGF0T3B0aW9uczogVmVyZXRlbm9DaGF0T3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgaXNCbGluZDogZmFsc2UgfHwgZXZlbnQuc2hpZnRLZXksXHJcbiAgICAgICAgICAgIHNob3dEaWFsb2c6IChDT05GSUcuU0VUVElOR1MuU2hvd1Rhc2tDaGVja09wdGlvbnMgIT09IGV2ZW50LmN0cmxLZXkpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYWN0aW9uVHlwZSA9PT0gJ2luaXRpYXRpdmUnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJvbGxXZWFwb25Jbml0aWF0aXZlKGl0ZW1JZCwgY2hhdE9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChhY3Rpb25UeXBlID09PSAnYXR0YWNrJykge1xyXG4gICAgICAgICAgICBsZXQgd2VhcG9uRGF0YTogV2VhcG9uQXR0YWNrSW5mbyA9IHtcclxuICAgICAgICAgICAgICAgIGlkOiBpdGVtSWQsXHJcbiAgICAgICAgICAgICAgICB3ZWFwb25UeXBlOiB3ZWFwb25UeXBlIGFzIFdlYXBvblR5cGUsXHJcbiAgICAgICAgICAgICAgICBhdHRhY2tUeXBlOiBhdHRhY2tUeXBlIGFzIEF0dGFja1R5cGVcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJvbGxXZWFwb25BdHRhY2sod2VhcG9uRGF0YSwgY2hhdE9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByb2xsV2VhcG9uSW5pdGlhdGl2ZSh3ZWFwb25JZDogc3RyaW5nLCBjaGF0T3B0aW9uczogVmVyZXRlbm9DaGF0T3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBkaWFsb2dSZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQoKTtcclxuICAgICAgICBpZiAoY2hhdE9wdGlvbnMuc2hvd0RpYWxvZykge1xyXG4gICAgICAgICAgICBkaWFsb2dSZXN1bHQgPSBhd2FpdCAobmV3IFZlcmV0ZW5vUm9sbERpYWxvZygpKS5nZXRUYXNrQ2hlY2tPcHRpb25zKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlhbG9nUmVzdWx0LmNhbmNlbGxlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBtZXNzYWdlRGF0YTogVmVyZXRlbm9NZXNzYWdlRGF0YSA9IHtcclxuICAgICAgICAgICAgdXNlcklkOiBnYW1lLnVzZXIuX2lkIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgc3BlYWtlcjogQ2hhdE1lc3NhZ2UuZ2V0U3BlYWtlcigpLFxyXG4gICAgICAgICAgICBmbGF2b3I6ICdcdTA0MThcdTA0M0RcdTA0MzhcdTA0NDZcdTA0MzhcdTA0MzBcdTA0NDJcdTA0MzhcdTA0MzJcdTA0MzAnLFxyXG4gICAgICAgICAgICBzb3VuZDogQ09ORklHLnNvdW5kcy5kaWNlLFxyXG4gICAgICAgICAgICBibGluZDogY2hhdE9wdGlvbnMuaXNCbGluZCB8fCBkaWFsb2dSZXN1bHQuYmxpbmRSb2xsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbGV0IGluaXRpYXRpdmVSb2xsRGF0YSA9IGF3YWl0IGFjdG9yLmdldEluaXRpYXRpdmVSb2xsRGF0YSh3ZWFwb25JZCk7XHJcbiAgICAgICAgaWYgKGluaXRpYXRpdmVSb2xsRGF0YSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluaXRpYXRpdmVSb2xsRGF0YS5ib251cyArPSBkaWFsb2dSZXN1bHQubW9kaWZpZXI7XHJcblxyXG4gICAgICAgIGNvbnN0IHJvbGxPcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBWZXJldGVub1JvbGxUeXBlLkluaXRpYXRpdmUsXHJcbiAgICAgICAgICAgIG1lc3NhZ2VEYXRhLFxyXG4gICAgICAgICAgICByb2xsRGF0YTogaW5pdGlhdGl2ZVJvbGxEYXRhXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB2ZXJldGVub1JvbGxIYW5kbGVyID0gbmV3IFZlcmV0ZW5vUm9sbGVyKCk7XHJcbiAgICAgICAgYXdhaXQgdmVyZXRlbm9Sb2xsSGFuZGxlci5yb2xsSW5pdGlhdGl2ZShyb2xsT3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcm9sbFdlYXBvbkF0dGFjayh3ZWFwb25EYXRhOiBXZWFwb25BdHRhY2tJbmZvLCBjaGF0T3B0aW9uczogVmVyZXRlbm9DaGF0T3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBkaWFsb2dSZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQoKTtcclxuICAgICAgICBpZiAoY2hhdE9wdGlvbnMuc2hvd0RpYWxvZykge1xyXG4gICAgICAgICAgICBkaWFsb2dSZXN1bHQgPSBhd2FpdCAobmV3IFZlcmV0ZW5vUm9sbERpYWxvZygpKS5nZXRUYXNrQ2hlY2tPcHRpb25zKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlhbG9nUmVzdWx0LmNhbmNlbGxlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBtZXNzYWdlRGF0YTogVmVyZXRlbm9NZXNzYWdlRGF0YSA9IHtcclxuICAgICAgICAgICAgdXNlcklkOiBnYW1lLnVzZXIuX2lkIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgc3BlYWtlcjogQ2hhdE1lc3NhZ2UuZ2V0U3BlYWtlcigpLFxyXG4gICAgICAgICAgICBmbGF2b3I6IHdlYXBvbkRhdGEud2VhcG9uVHlwZSxcclxuICAgICAgICAgICAgc291bmQ6IENPTkZJRy5zb3VuZHMuZGljZSxcclxuICAgICAgICAgICAgYmxpbmQ6IGNoYXRPcHRpb25zLmlzQmxpbmQgfHwgZGlhbG9nUmVzdWx0LmJsaW5kUm9sbFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCB3ZWFwb25Sb2xsRGF0YSA9IGF3YWl0IGFjdG9yLmdldFdlYXBvblJvbGxEYXRhKHdlYXBvbkRhdGEpO1xyXG4gICAgICAgIHdlYXBvblJvbGxEYXRhLnBvb2wgKz0gZGlhbG9nUmVzdWx0Lm1vZGlmaWVyO1xyXG5cclxuICAgICAgICBjb25zdCByb2xsT3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgdHlwZTogVmVyZXRlbm9Sb2xsVHlwZS5BdHRhY2ssXHJcbiAgICAgICAgICAgIG1lc3NhZ2VEYXRhLFxyXG4gICAgICAgICAgICByb2xsRGF0YTogd2VhcG9uUm9sbERhdGFcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHZlcmV0ZW5vUm9sbEhhbmRsZXIgPSBuZXcgVmVyZXRlbm9Sb2xsZXIoKTtcclxuICAgICAgICBhd2FpdCB2ZXJldGVub1JvbGxIYW5kbGVyLnJvbGwocm9sbE9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jICNvbkl0ZW1BY3Rpb24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG4gICAgICAgIGNvbnN0IGRhdGFzZXQgPSAoZWxlbWVudCBhcyBIVE1MQW5jaG9yRWxlbWVudCk/LmRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgaXRlbVR5cGUsIGFjdGlvblR5cGUsIGl0ZW1JZCB9ID0gZGF0YXNldDtcclxuICAgICAgICBjb25zdCBpdGVtSW5mbzogSXRlbUFjdGlvbkluZm8gPSB7IHR5cGU6IChpdGVtVHlwZSEgYXMgVmVyZXRlbm9JdGVtVHlwZSksIGlkOiBpdGVtSWQhIH07XHJcblxyXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uVHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlICdyZW1vdmUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVtb3ZlSXRlbShpdGVtSW5mbyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2VxdWlwJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmVxdWlwSXRlbShpdGVtSW5mbyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3VuZXF1aXAnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudW5lcXVpcEl0ZW0oaXRlbUluZm8pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZW1vdmVJdGVtKGl0ZW1JbmZvOiBJdGVtQWN0aW9uSW5mbyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmFjdG9yLml0ZW1zLmdldChpdGVtSW5mby5pZCk7XHJcbiAgICAgICAgaWYgKCFpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYWN0b3IuZGVsZXRlRW1iZWRkZWREb2N1bWVudHMoXCJJdGVtXCIsIFtpdGVtLl9pZCFdKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBlcXVpcEl0ZW0oaXRlbUluZm86IEl0ZW1BY3Rpb25JbmZvKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgc3dpdGNoIChpdGVtSW5mby50eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3dlYXBvbic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5lcXVpcFdlYXBvbihpdGVtSW5mby5pZCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2FybW9yJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmVxdWlwQXJtb3IoaXRlbUluZm8uaWQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBlcXVpcFdlYXBvbihpdGVtSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmFjdG9yLml0ZW1zLmZpbmQoeCA9PiB4Ll9pZCA9PT0gaXRlbUlkKTtcclxuICAgICAgICBpZiAoIWl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDQzXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM2XHUwNDM0XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1LCBcdTA0MzVcdTA0NDFcdTA0M0JcdTA0MzggXHUwNDREXHUwNDNBXHUwNDM4XHUwNDNGXHUwNDM4XHUwNDQwXHUwNDNFXHUwNDMyXHUwNDMwXHUwNDNEXHUwNDNFIFx1MDQzMVx1MDQzRVx1MDQzQlx1MDQ0Q1x1MDQ0OFx1MDQzNSAyIFx1MDQ0RFx1MDQzQlx1MDQzNVx1MDQzQ1x1MDQzNVx1MDQzRFx1MDQ0Mlx1MDQzRVx1MDQzMiBcdTA0M0VcdTA0NDBcdTA0NDNcdTA0MzZcdTA0MzhcdTA0NEYuXHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMuYWN0b3IudXBkYXRlRW1iZWRkZWREb2N1bWVudHMoXCJJdGVtXCIsIFtcclxuICAgICAgICAgICAgeyBfaWQ6IGl0ZW0uX2lkISwgXCJzeXN0ZW0uaXNFcXVpcHBlZFwiOiB0cnVlIH0sXHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXF1aXBBcm1vcihpdGVtSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGVxdWlwcGVkQXJtb3IgPSB0aGlzLmFjdG9yLml0ZW1zLmZpbmQoeCA9PiAoeCBhcyB1bmtub3duIGFzIFZlcmV0ZW5vQXJtb3IpLnN5c3RlbS5pc0VxdWlwcGVkICYmIHgudHlwZSA9PT0gVmVyZXRlbm9JdGVtVHlwZS5Bcm1vcik7XHJcbiAgICAgICAgaWYgKGVxdWlwcGVkQXJtb3IpIHtcclxuICAgICAgICAgICAgLy8gXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDQzXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM2XHUwNDM0XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1LCBcdTA0MzVcdTA0NDFcdTA0M0JcdTA0MzggXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDNEXHUwNDRGIFx1MDQ0M1x1MDQzNlx1MDQzNSBcdTA0NERcdTA0M0FcdTA0MzhcdTA0M0ZcdTA0MzhcdTA0NDBcdTA0M0VcdTA0MzJcdTA0MzBcdTA0M0RcdTA0MzAuXHJcblxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5hY3Rvci5pdGVtcy5maW5kKHggPT4geC5faWQgPT09IGl0ZW1JZCk7XHJcbiAgICAgICAgaWYgKCFpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMuYWN0b3IudXBkYXRlRW1iZWRkZWREb2N1bWVudHMoXCJJdGVtXCIsIFtcclxuICAgICAgICAgICAgeyBfaWQ6IGl0ZW0uX2lkISwgXCJzeXN0ZW0uaXNFcXVpcHBlZFwiOiB0cnVlIH0sXHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgdW5lcXVpcEl0ZW0oaXRlbUluZm86IEl0ZW1BY3Rpb25JbmZvKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuYWN0b3IuaXRlbXMuZmluZCh4ID0+IHguX2lkID09PSBpdGVtSW5mby5pZFxyXG4gICAgICAgICAgICAmJiAoeCBhcyB1bmtub3duIGFzIFBoeXNpY2FsVmVyZXRlbm9JdGVtKS5zeXN0ZW1cclxuICAgICAgICAgICAgJiYgKHggYXMgdW5rbm93biBhcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSkuc3lzdGVtLmlzRXF1aXBwZWRcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoIWl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5hY3Rvci51cGRhdGVFbWJlZGRlZERvY3VtZW50cyhcIkl0ZW1cIiwgW1xyXG4gICAgICAgICAgICB7IF9pZDogaXRlbS5faWQhLCBcInN5c3RlbS5pc0VxdWlwcGVkXCI6IGZhbHNlIH0sXHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgI29uQXJtb3JBY3Rpb24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG4gICAgICAgIGNvbnN0IGRhdGFzZXQgPSAoZWxlbWVudCBhcyBIVE1MQW5jaG9yRWxlbWVudCk/LmRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgaXRlbVR5cGUsIGFjdGlvblR5cGUsIGl0ZW1JZCB9ID0gZGF0YXNldDtcclxuXHJcbiAgICAgICAgY29uc3QgY2hhdE9wdGlvbnM6IFZlcmV0ZW5vQ2hhdE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGlzQmxpbmQ6IGZhbHNlIHx8IGV2ZW50LnNoaWZ0S2V5LFxyXG4gICAgICAgICAgICBzaG93RGlhbG9nOiAoQ09ORklHLlNFVFRJTkdTLlNob3dUYXNrQ2hlY2tPcHRpb25zICE9PSBldmVudC5jdHJsS2V5KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGl0ZW1JZCA9PSBudWxsIHx8IGl0ZW1JZCA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbWVzc2FnZURhdGEgPSB7XHJcbiAgICAgICAgICAgIHVzZXJJZDogZ2FtZS51c2VyLl9pZCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIHNwZWFrZXI6IENoYXRNZXNzYWdlLmdldFNwZWFrZXIoKSxcclxuICAgICAgICAgICAgZmxhdm9yOiAnJyxcclxuICAgICAgICAgICAgc291bmQ6IENPTkZJRy5zb3VuZHMuZGljZSxcclxuICAgICAgICAgICAgYmxpbmQ6IGZhbHNlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc3dpdGNoIChhY3Rpb25UeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Jsb2NrJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJvbGxBcm1vckJsb2NrKGl0ZW1JZCwgY2hhdE9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2FibGF0ZSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5hYmxhdGVBcm1vcihpdGVtSWQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ3JlcGFpcic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yZXBhaXJBcm1vcihpdGVtSWQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJvbGxBcm1vckJsb2NrKGFybW9ySWQ6IHN0cmluZywgY2hhdE9wdGlvbnM6IFZlcmV0ZW5vQ2hhdE9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgZGlhbG9nUmVzdWx0ID0gbmV3IFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50KCk7XHJcbiAgICAgICAgaWYgKGNoYXRPcHRpb25zLnNob3dEaWFsb2cpIHtcclxuICAgICAgICAgICAgZGlhbG9nUmVzdWx0ID0gYXdhaXQgKG5ldyBWZXJldGVub1JvbGxEaWFsb2coKSkuZ2V0VGFza0NoZWNrT3B0aW9ucygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRpYWxvZ1Jlc3VsdC5jYW5jZWxsZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbWVzc2FnZURhdGE6IFZlcmV0ZW5vTWVzc2FnZURhdGEgPSB7XHJcbiAgICAgICAgICAgIHVzZXJJZDogZ2FtZS51c2VyLl9pZCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIHNwZWFrZXI6IENoYXRNZXNzYWdlLmdldFNwZWFrZXIoKSxcclxuICAgICAgICAgICAgZmxhdm9yOiAnXHUwNDE3XHUwNDMwXHUwNDQ5XHUwNDM4XHUwNDQyXHUwNDMwJyxcclxuICAgICAgICAgICAgc291bmQ6IENPTkZJRy5zb3VuZHMuZGljZSxcclxuICAgICAgICAgICAgYmxpbmQ6IGNoYXRPcHRpb25zLmlzQmxpbmQgfHwgZGlhbG9nUmVzdWx0LmJsaW5kUm9sbFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCBhcm1vclJvbGxEYXRhID0gYXdhaXQgYWN0b3IuZ2V0QXJtb3JSb2xsRGF0YShhcm1vcklkKTtcclxuICAgICAgICBpZiAoYXJtb3JSb2xsRGF0YSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFybW9yUm9sbERhdGEucG9vbCArPSBkaWFsb2dSZXN1bHQubW9kaWZpZXI7XHJcblxyXG4gICAgICAgIGNvbnN0IHJvbGxPcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBWZXJldGVub1JvbGxUeXBlLkFybW9yQmxvY2ssXHJcbiAgICAgICAgICAgIG1lc3NhZ2VEYXRhLFxyXG4gICAgICAgICAgICByb2xsRGF0YTogYXJtb3JSb2xsRGF0YVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJvbGxPcHRpb25zLnJvbGxEYXRhLnBvb2wgPT0gMCkge1xyXG4gICAgICAgICAgICAvLyBcdTA0NDFcdTA0M0VcdTA0M0VcdTA0MzFcdTA0NDlcdTA0MzVcdTA0M0RcdTA0MzhcdTA0MzUgXHUwNDNFIFx1MDQ0MFx1MDQzMFx1MDQzN1x1MDQzMVx1MDQzOFx1MDQ0Mlx1MDQzRVx1MDQzOSBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0MzUuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHZlcmV0ZW5vUm9sbEhhbmRsZXIgPSBuZXcgVmVyZXRlbm9Sb2xsZXIoKTtcclxuICAgICAgICBhd2FpdCB2ZXJldGVub1JvbGxIYW5kbGVyLnJvbGwocm9sbE9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGFibGF0ZUFybW9yKGFybW9ySWQ6IHN0cmluZywgdmFsdWU6IG51bWJlciA9IDEpIHtcclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAodmFsdWUgPCAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGFybW9yID0gKHRoaXMuYWN0b3IuaXRlbXMuZmluZCh4ID0+IHguX2lkID09PSBhcm1vcklkKSBhcyB1bmtub3duIGFzIFZlcmV0ZW5vQXJtb3IpO1xyXG4gICAgICAgIGlmICghYXJtb3IpIHtcclxuICAgICAgICAgICAgLy8gXHUwNDQxXHUwNDNFXHUwNDNFXHUwNDMxXHUwNDQ5XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1IFx1MDQzRVx1MDQzMSBcdTA0M0VcdTA0NDFcdTA0NDJcdTA0NDNcdTA0NDJcdTA0NDFcdTA0NDJcdTA0MzJcdTA0NDNcdTA0NEVcdTA0NDlcdTA0MzVcdTA0M0MgXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDNDXHUwNDM1XHUwNDQyXHUwNDM1LlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgPT09IDApIHtcclxuICAgICAgICAgICAgLy8gXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDQzXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM2XHUwNDM0XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1IFx1MDQzRSBcdTA0NDBcdTA0MzBcdTA0MzdcdTA0MzFcdTA0MzhcdTA0NDJcdTA0M0VcdTA0MzkgXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDNEXHUwNDM1LlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcm1vci5zeXN0ZW0uZHVyYWJpbGl0eSAtPSB2YWx1ZTtcclxuXHJcbiAgICAgICAgaWYgKGFybW9yLnN5c3RlbS5kdXJhYmlsaXR5IDwgMCkge1xyXG4gICAgICAgICAgICBhcm1vci5zeXN0ZW0uZHVyYWJpbGl0eSA9IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgPT09IDApIHtcclxuICAgICAgICAgICAgLy8gXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDQzXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM2XHUwNDM0XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1IFx1MDQzRSBcdTA0NDBcdTA0MzBcdTA0MzdcdTA0MzFcdTA0MzhcdTA0NDJcdTA0M0VcdTA0MzkgXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDNEXHUwNDM1LlxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5hY3Rvci51cGRhdGVFbWJlZGRlZERvY3VtZW50cyhcIkl0ZW1cIiwgW1xyXG4gICAgICAgICAgICB7IF9pZDogYXJtb3IuX2lkISwgXCJzeXN0ZW0uZHVyYWJpbGl0eVwiOiBhcm1vci5zeXN0ZW0uZHVyYWJpbGl0eSB9LFxyXG4gICAgICAgIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlcGFpckFybW9yKGFybW9ySWQ6IHN0cmluZykge1xyXG4gICAgICAgIGNvbnN0IGFybW9yID0gKHRoaXMuYWN0b3IuaXRlbXMuZmluZCh4ID0+IHguX2lkID09PSBhcm1vcklkKSBhcyB1bmtub3duIGFzIFZlcmV0ZW5vQXJtb3IpO1xyXG4gICAgICAgIGlmICghYXJtb3IpIHtcclxuICAgICAgICAgICAgLy8gXHUwNDQxXHUwNDNFXHUwNDNFXHUwNDMxXHUwNDQ5XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1IFx1MDQzRVx1MDQzMSBcdTA0M0VcdTA0NDFcdTA0NDJcdTA0NDNcdTA0NDJcdTA0NDFcdTA0NDJcdTA0MzJcdTA0NDNcdTA0NEVcdTA0NDlcdTA0MzVcdTA0M0MgXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDNDXHUwNDM1XHUwNDQyXHUwNDM1XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBtYXhEdXJhYmlsaXR5ID0gYXJtb3Iuc3lzdGVtLmFybW9yQ2xhc3MgKyBhcm1vci5zeXN0ZW0ucXVhbGl0eVxyXG4gICAgICAgIGlmIChhcm1vci5zeXN0ZW0uZHVyYWJpbGl0eSA9PT0gbWF4RHVyYWJpbGl0eSkge1xyXG4gICAgICAgICAgICAvLyBcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzRcdTA0NDNcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzZcdTA0MzRcdTA0MzVcdTA0M0RcdTA0MzhcdTA0MzUgXHUwNDNFIFx1MDQ0Nlx1MDQzNVx1MDQzQlx1MDQzRVx1MDQzOSBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0MzUuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLmFjdG9yLnVwZGF0ZUVtYmVkZGVkRG9jdW1lbnRzKFwiSXRlbVwiLCBbXHJcbiAgICAgICAgICAgIHsgX2lkOiBhcm1vci5faWQhLCBcInN5c3RlbS5kdXJhYmlsaXR5XCI6IG1heER1cmFiaWxpdHkgfSxcclxuICAgICAgICBdKTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQ3JlYXR1cmVTaGVldERhdGE8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZT4gZXh0ZW5kcyBWZXJldGVub0FjdG9yU2hlZXREYXRhPFRBY3Rvcj4ge1xyXG4gICAgc3RhdHM6IFN0YXRzQmxvY2s7XHJcbiAgICBhdHRyaWJ1dGVzOiBBdHRyaWJ1dGVzQmxvY2s7XHJcbiAgICBza2lsbHM6IFNraWxsc0Jsb2NrO1xyXG4gICAgbWF4SHA6IG51bWJlcjtcclxuICAgIG1heFdwOiBudW1iZXI7XHJcbiAgICB3ZWFwb25zOiBWZXJldGVub1dlYXBvbltdO1xyXG4gICAgZXF1aXBwZWRXZWFwb25zOiBWZXJldGVub1dlYXBvbltdO1xyXG4gICAgYXJtb3JzOiBWZXJldGVub0FybW9yW107XHJcbiAgICBlcXVpcHBlZEFybW9yOiBWZXJldGVub0FybW9yO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0NyZWF0dXJlU2hlZXQgfVxyXG5leHBvcnQgdHlwZSB7IFZlcmV0ZW5vQ3JlYXR1cmVTaGVldERhdGEgfSIsICJpbXBvcnQgeyBWZXJldGVub0NoYXJhY3RlciB9IGZyb20gXCIuLlwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0NyZWF0dXJlU2hlZXQsIFZlcmV0ZW5vQ3JlYXR1cmVTaGVldERhdGEgfSBmcm9tIFwiLi4vY3JlYXR1cmUvc2hlZXRcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vQ2hhcmFjdGVyU2hlZXQ8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9DaGFyYWN0ZXI+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZVNoZWV0PFRBY3Rvcj57XHJcbiAgICBzdGF0aWMgb3ZlcnJpZGUgZ2V0IGRlZmF1bHRPcHRpb25zKCk6IEFjdG9yU2hlZXRPcHRpb25zIHtcclxuICAgICAgICBjb25zdCBzdXBlck9wdGlvbnMgPSBzdXBlci5kZWZhdWx0T3B0aW9ucztcclxuICAgICAgICBjb25zdCBtZXJnZWRPYmplY3QgPSBtZXJnZU9iamVjdChzdXBlck9wdGlvbnMsIHtcclxuICAgICAgICAgICAgd2lkdGg6IDU2MCxcclxuICAgICAgICAgICAgY2xhc3NlczogWy4uLnN1cGVyT3B0aW9ucy5jbGFzc2VzLCAnY2hhcmFjdGVyLXNoZWV0J10sXHJcbiAgICAgICAgICAgIHRhYnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuYXZTZWxlY3RvcjogXCIuc2hlZXQtdGFic1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRTZWxlY3RvcjogXCIuc2hlZXQtYm9keVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluaXRpYWw6IFwibWFpblwiLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbWVyZ2VkT2JqZWN0O1xyXG4gICAgfVxyXG5cclxuICAgIG92ZXJyaWRlIGFzeW5jIGdldERhdGEob3B0aW9uczogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4gPSB7fSk6IFByb21pc2U8VmVyZXRlbm9DaGFyYWN0ZXJTaGVldERhdGE8VEFjdG9yPj4ge1xyXG4gICAgICAgIGNvbnN0IHNoZWV0RGF0YSA9IGF3YWl0IHN1cGVyLmdldERhdGEob3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIC4uLnNoZWV0RGF0YSxcclxuICAgICAgICAgICAgbW9uZXk6IGFjdG9yLk1vbmV5LFxyXG4gICAgICAgICAgICByZXB1dGF0aW9uOiBhY3Rvci5SZXB1dGF0aW9uLFxyXG4gICAgICAgICAgICBleHA6IGFjdG9yLkV4cFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRlbXBsYXRlKCkge1xyXG4gICAgICAgIHJldHVybiBgc3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL2FjdG9ycy9jaGFyYWN0ZXItc2hlZXQuaGJzYDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQ2hhcmFjdGVyU2hlZXREYXRhPFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vQ2hhcmFjdGVyPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmVTaGVldERhdGE8VEFjdG9yPiB7XHJcbiAgICBtb25leTogbnVtYmVyO1xyXG4gICAgcmVwdXRhdGlvbjogbnVtYmVyO1xyXG4gICAgZXhwOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQ2hhcmFjdGVyU2hlZXQgfSIsICJpbXBvcnQgeyBWZXJldGVub01vbnN0ZXIgfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9DcmVhdHVyZVNoZWV0IH0gZnJvbSBcIi4uL2NyZWF0dXJlL3NoZWV0XCI7XHJcblxyXG5jbGFzcyBWZXJldGVub01vbnN0ZXJTaGVldDxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub01vbnN0ZXI+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZVNoZWV0PFRBY3Rvcj57XHJcblxyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub01vbnN0ZXJTaGVldCB9IiwgImltcG9ydCB7IFZlcmV0ZW5vTnBjIH0gZnJvbSBcIi4uXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmVTaGVldCB9IGZyb20gXCIuLi9jcmVhdHVyZS9zaGVldFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9OcGNTaGVldDxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub05wYz4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlU2hlZXQ8VEFjdG9yPntcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vTnBjU2hlZXQgfSIsICJleHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJTZXR0aW5ncygpOiB2b2lkIHtcclxuICAgIGdhbWUuc2V0dGluZ3MucmVnaXN0ZXIoXCJ2ZXJldGVub1wiLCBcInZpc2liaWxpdHkuc2hvd1Rhc2tDaGVja09wdGlvbnNcIiwge1xyXG4gICAgICAgIG5hbWU6IFwidmVyZXRlbm8uc2V0dGluZ3Muc2hvd1Rhc2tDaGVja09wdGlvbnMubmFtZVwiLFxyXG4gICAgICAgIGhpbnQ6IFwidmVyZXRlbm8uc2V0dGluZ3Muc2hvd1Rhc2tDaGVja09wdGlvbnMuaGludFwiLFxyXG4gICAgICAgIHNjb3BlOiBcImNsaWVudFwiLFxyXG4gICAgICAgIGNvbmZpZzogdHJ1ZSxcclxuICAgICAgICBkZWZhdWx0OiB0cnVlLFxyXG4gICAgICAgIHR5cGU6IEJvb2xlYW5cclxuICAgIH0pO1xyXG59IiwgImNsYXNzIFZlcmV0ZW5vQ2xpZW50U2V0dGluZ3Mge1xyXG4gICAgZ2V0IFNob3dUYXNrQ2hlY2tPcHRpb25zKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiBnYW1lLnNldHRpbmdzLmdldChcInZlcmV0ZW5vXCIsIFwidmlzaWJpbGl0eS5zaG93VGFza0NoZWNrT3B0aW9uc1wiKSBhcyBib29sZWFuO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9DbGllbnRTZXR0aW5ncyB7XHJcbiAgICBTaG93VGFza0NoZWNrT3B0aW9uczogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9DbGllbnRTZXR0aW5ncyB9OyIsICJpbXBvcnQgeyBWZXJldGVub0FybW9yU2hlZXQgfSBmcm9tICckbW9kdWxlL2l0ZW0vYXJtb3Ivc2hlZXQnO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW1TaGVldCB9IGZyb20gJyRtb2R1bGUvaXRlbS9iYXNlL3NoZWV0JztcclxuaW1wb3J0IHsgVkVSRVRFTk9DT05GSUcgfSBmcm9tICcuLi8uLi92ZXJldGVub0NvbmZpZyc7XHJcbmltcG9ydCB7IFZFUkVURU5PX1BBUlRJQUxTIH0gZnJvbSAnLi4vLi4vcGFydGlhbHMnO1xyXG5pbXBvcnQgeyBWZXJldGVub1dlYXBvblNoZWV0IH0gZnJvbSAnJG1vZHVsZS9pdGVtL3dlYXBvbi9zaGVldCc7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ2hhcmFjdGVyU2hlZXQgfSBmcm9tICckbW9kdWxlL2FjdG9yL2NoYXJhY3Rlci9zaGVldCc7XHJcbmltcG9ydCB7IFZlcmV0ZW5vTW9uc3RlclNoZWV0IH0gZnJvbSAnJG1vZHVsZS9hY3Rvci9tb25zdGVyL3NoZWV0JztcclxuaW1wb3J0IHsgVmVyZXRlbm9OcGNTaGVldCB9IGZyb20gJyRtb2R1bGUvYWN0b3IvbnBjL3NoZWV0JztcclxuaW1wb3J0IHsgcmVnaXN0ZXJTZXR0aW5ncyB9IGZyb20gJyRtb2R1bGUvc3lzdGVtL3NldHRpbmdzJztcclxuaW1wb3J0IHsgVmVyZXRlbm9DbGllbnRTZXR0aW5ncyB9IGZyb20gJyRtb2R1bGUvc3lzdGVtL3NldHRpbmdzL2NsaWVudC1zZXR0aW5ncyc7XHJcblxyXG5mdW5jdGlvbiBwcmVsb2FkSGFuZGxlYmFyc1RlbXBsYXRlcygpIHtcclxuICAgIHJldHVybiBsb2FkVGVtcGxhdGVzKFZFUkVURU5PX1BBUlRJQUxTKTtcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IEluaXQgPSB7XHJcbiAgICBsaXN0ZW4oKTogdm9pZCB7XHJcbiAgICAgICAgSG9va3Mub25jZSgnaW5pdCcsIGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJWZXJldGVubyB8IFN5c3RlbSBpbml0IGJlZ2luLlwiKTtcclxuXHJcbiAgICAgICAgICAgIENPTkZJRy5WRVJFVEVOTyA9IFZFUkVURU5PQ09ORklHO1xyXG4gICAgICAgICAgICBDT05GSUcuU0VUVElOR1MgPSBuZXcgVmVyZXRlbm9DbGllbnRTZXR0aW5ncygpO1xyXG5cclxuICAgICAgICAgICAgQWN0b3JzLnVucmVnaXN0ZXJTaGVldCgnY29yZScsIEFjdG9yU2hlZXQpO1xyXG4gICAgICAgICAgICBBY3RvcnMucmVnaXN0ZXJTaGVldCgndmVyZXRlbm8nLCBWZXJldGVub0NoYXJhY3RlclNoZWV0LCB7XHJcbiAgICAgICAgICAgICAgICB0eXBlczogWydjaGFyYWN0ZXInXSxcclxuICAgICAgICAgICAgICAgIG1ha2VEZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBBY3RvcnMucmVnaXN0ZXJTaGVldCgndmVyZXRlbm8nLCBWZXJldGVub01vbnN0ZXJTaGVldCwge1xyXG4gICAgICAgICAgICAgICAgdHlwZXM6IFsnbW9uc3RlciddLFxyXG4gICAgICAgICAgICAgICAgbWFrZURlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIEFjdG9ycy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vTnBjU2hlZXQsIHtcclxuICAgICAgICAgICAgICAgIHR5cGVzOiBbJ25wYyddLFxyXG4gICAgICAgICAgICAgICAgbWFrZURlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBJdGVtcy51bnJlZ2lzdGVyU2hlZXQoJ2NvcmUnLCBJdGVtU2hlZXQpO1xyXG4gICAgICAgICAgICBJdGVtcy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vSXRlbVNoZWV0LCB7XHJcbiAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgSXRlbXMucmVnaXN0ZXJTaGVldCgndmVyZXRlbm8nLCBWZXJldGVub0FybW9yU2hlZXQsIHtcclxuICAgICAgICAgICAgICAgIHR5cGVzOiBbJ2FybW9yJ10sXHJcbiAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgSXRlbXMucmVnaXN0ZXJTaGVldCgndmVyZXRlbm8nLCBWZXJldGVub1dlYXBvblNoZWV0LCB7XHJcbiAgICAgICAgICAgICAgICB0eXBlczogWyd3ZWFwb24nXSxcclxuICAgICAgICAgICAgICAgIG1ha2VEZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcHJlbG9hZEhhbmRsZWJhcnNUZW1wbGF0ZXMoKTtcclxuXHJcbiAgICAgICAgICAgIHJlZ2lzdGVyU2V0dGluZ3MoKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVmVyZXRlbm8gfCBTeXN0ZW0gaW5pdCBkb25lLlwiKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuIiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3IgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFZlcmV0ZW5vQWN0b3JzPFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vQWN0b3I8bnVsbD4+IGV4dGVuZHMgQWN0b3JzPFRBY3Rvcj4ge1xyXG5cclxufSIsICJpbXBvcnQgeyBWZXJldGVub0FjdG9yUHJveHkgfSBmcm9tIFwiJG1vZHVsZS9hY3Rvci9iYXNlL2RvY3VtZW50XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQWN0b3JzIH0gZnJvbSBcIiRtb2R1bGUvY29sbGVjdGlvblwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW1Qcm94eSB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vYmFzZS9kb2N1bWVudFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub1JvbGwgfSBmcm9tIFwiJG1vZHVsZS9zeXN0ZW0vcm9sbFwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IExvYWQgPSB7XHJcbiAgICBsaXN0ZW4oKTogdm9pZCB7XHJcbiAgICAgICAgQ09ORklHLkFjdG9yLmNvbGxlY3Rpb24gPSBWZXJldGVub0FjdG9ycztcclxuICAgICAgICBDT05GSUcuQWN0b3IuZG9jdW1lbnRDbGFzcyA9IFZlcmV0ZW5vQWN0b3JQcm94eTtcclxuICAgICAgICBDT05GSUcuSXRlbS5kb2N1bWVudENsYXNzID0gVmVyZXRlbm9JdGVtUHJveHk7XHJcblxyXG4gICAgICAgIENPTkZJRy5EaWNlLnJvbGxzLnB1c2goVmVyZXRlbm9Sb2xsKTtcclxuICAgIH1cclxufSIsICJpbXBvcnQgeyBJbml0IH0gZnJvbSAnLi9pbml0JztcclxuaW1wb3J0IHsgTG9hZCB9IGZyb20gJy4vbG9hZCc7XHJcblxyXG5leHBvcnQgY29uc3QgSG9va3NWZXJldGVubyA9IHtcclxuICAgIGxpc3RlbigpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBsaXN0ZW5lcnM6IHsgbGlzdGVuKCk6IHZvaWQgfVtdID0gW1xyXG4gICAgICAgICAgICBJbml0LFxyXG4gICAgICAgICAgICBMb2FkLFxyXG4gICAgICAgIF07XHJcbiAgICAgICAgZm9yIChjb25zdCBMaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIHtcclxuICAgICAgICAgICAgTGlzdGVuZXIubGlzdGVuKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxufTtcclxuIiwgImltcG9ydCB7IEhvb2tzVmVyZXRlbm8gfSBmcm9tICcuL3NjcmlwdHMvaG9va3MvaW5kZXgnO1xyXG5cclxuSG9va3NWZXJldGVuby5saXN0ZW4oKTsiXSwKICAibWFwcGluZ3MiOiAiOzs7QUFFQSxNQUFNLG9CQUFOLGNBQTRELFVBQWlCO0FBQUEsSUFDekUsSUFBSSxXQUFXO0FBQ1gsYUFBTyxLQUFLLEtBQUs7QUFBQSxJQUNyQjtBQUFBLElBRUEsSUFBSSxpQkFBaUI7QUFDakIsYUFBTyxLQUFLLEtBQUs7QUFBQSxJQUNyQjtBQUFBLElBRUEsV0FBVyxpQkFBaUI7QUFDeEIsWUFBTSxvQkFBb0IsS0FBSyxTQUFTLElBQUksUUFBUSxVQUFVLEtBQUs7QUFFbkUsWUFBTSxVQUFVLFlBQVksTUFBTSxnQkFBZ0I7QUFBQSxRQUM5QyxPQUFPO0FBQUEsUUFDUCxTQUFTLENBQUMsWUFBWSxRQUFRLE9BQU87QUFBQSxNQUN6QyxDQUFDO0FBQ0QsVUFBRyxtQkFBa0I7QUFDakIsZ0JBQVEsUUFBUSxLQUFLLFNBQVM7QUFBQSxNQUNsQztBQUVBLGFBQU87QUFBQSxJQUNYO0FBQUEsSUFFQSxJQUFJLFdBQVc7QUFDWCxhQUFPLDJDQUEyQyxLQUFLLEtBQUssSUFBSTtBQUFBLElBQ3BFO0FBQUEsSUFFQSxNQUFlLFFBQVEsVUFBeUMsQ0FBQyxHQUEwQztBQUN2RyxjQUFRLEtBQUssS0FBSztBQUNsQixjQUFRLFdBQVcsS0FBSztBQUV4QixZQUFNLEVBQUUsS0FBSyxJQUFJO0FBR2pCLFlBQU0sa0JBQTBDLENBQUM7QUFDakQsWUFBTSxXQUFXLEVBQUUsR0FBRyxLQUFLLEtBQUssWUFBWSxHQUFHLEdBQUcsS0FBSyxPQUFPLFlBQVksRUFBRTtBQUU1RSxhQUFPO0FBQUEsUUFDSCxVQUFVO0FB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
