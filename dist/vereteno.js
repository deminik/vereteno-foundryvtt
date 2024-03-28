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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL21vZHVsZS9pdGVtL2Jhc2Uvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL3BoeXNpY2FsLWl0ZW0vc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL2FybW9yL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvYmFzZS9kb2N1bWVudC50cyIsICIuLi9zcmMvbW9kdWxlL2RhdGEudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL3dlYXBvbi9kYXRhLnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvY3JlYXR1cmUvZG9jdW1lbnQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9jaGFyYWN0ZXIvZG9jdW1lbnQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9tb25zdGVyL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvbnBjL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9iYXNlL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9waHlzaWNhbC1pdGVtL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9hcm1vci9kb2N1bWVudC50cyIsICIuLi9zcmMvY29tbW9uLnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS93ZWFwb24vZG9jdW1lbnQudHMiLCAiLi4vc3JjL3ZlcmV0ZW5vQ29uZmlnLnRzIiwgIi4uL3NyYy9wYXJ0aWFscy50cyIsICIuLi9zcmMvbW9kdWxlL2l0ZW0vd2VhcG9uL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvYmFzZS9zaGVldC50cyIsICIuLi9zcmMvbW9kdWxlL3N5c3RlbS9yb2xsLnRzIiwgIi4uL3NyYy9tb2R1bGUvdXRpbHMvdmVyZXRlbm8tcm9sbGVyLnRzIiwgIi4uL3NyYy9tb2R1bGUvZGlhbG9nL3JvbGwtZGlhbG9nLnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvY3JlYXR1cmUvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9jaGFyYWN0ZXIvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9tb25zdGVyL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvbnBjL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvc3lzdGVtL3NldHRpbmdzL2luZGV4LnRzIiwgIi4uL3NyYy9tb2R1bGUvc3lzdGVtL3NldHRpbmdzL2NsaWVudC1zZXR0aW5ncy50cyIsICIuLi9zcmMvc2NyaXB0cy9ob29rcy9pbml0LnRzIiwgIi4uL3NyYy9tb2R1bGUvY29sbGVjdGlvbi9hY3RvcnMudHMiLCAiLi4vc3JjL3NjcmlwdHMvaG9va3MvbG9hZC50cyIsICIuLi9zcmMvc2NyaXB0cy9ob29rcy9pbmRleC50cyIsICIuLi9zcmMvdmVyZXRlbm8udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBoeXNpY2FsVmVyZXRlbm9JdGVtLCBWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vSXRlbVNoZWV0PFRJdGVtIGV4dGVuZHMgVmVyZXRlbm9JdGVtPiBleHRlbmRzIEl0ZW1TaGVldDxUSXRlbT4ge1xyXG4gICAgZ2V0IGl0ZW1EYXRhKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLml0ZW0uZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgaXRlbVByb3BlcnRpZXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbS5zeXN0ZW07XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCBkZWZhdWx0T3B0aW9ucygpIHtcclxuICAgICAgICBjb25zdCBpc1J1c3NpYW5MYW5ndWFnZSA9IGdhbWUuc2V0dGluZ3MuZ2V0KFwiY29yZVwiLCBcImxhbmd1YWdlXCIpID09ICdydSc7XHJcblxyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBtZXJnZU9iamVjdChzdXBlci5kZWZhdWx0T3B0aW9ucywge1xyXG4gICAgICAgICAgICB3aWR0aDogNTYwLFxyXG4gICAgICAgICAgICBjbGFzc2VzOiBbJ3ZlcmV0ZW5vJywgJ2l0ZW0nLCAnc2hlZXQnXVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmKGlzUnVzc2lhbkxhbmd1YWdlKXtcclxuICAgICAgICAgICAgb3B0aW9ucy5jbGFzc2VzLnB1c2goXCJsYW5nLXJ1XCIpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb3B0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgdGVtcGxhdGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIGBzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvaXRlbXMvJHt0aGlzLml0ZW0udHlwZX0tc2hlZXQuaGJzYDtcclxuICAgIH1cclxuXHJcbiAgICBvdmVycmlkZSBhc3luYyBnZXREYXRhKG9wdGlvbnM6IFBhcnRpYWw8RG9jdW1lbnRTaGVldE9wdGlvbnM+ID0ge30pOiBQcm9taXNlPFZlcmV0ZW5vSXRlbVNoZWV0RGF0YTxUSXRlbT4+IHtcclxuICAgICAgICBvcHRpb25zLmlkID0gdGhpcy5pZDtcclxuICAgICAgICBvcHRpb25zLmVkaXRhYmxlID0gdGhpcy5pc0VkaXRhYmxlO1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW0gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIC8vIEVucmljaCBjb250ZW50XHJcbiAgICAgICAgY29uc3QgZW5yaWNoZWRDb250ZW50OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XHJcbiAgICAgICAgY29uc3Qgcm9sbERhdGEgPSB7IC4uLnRoaXMuaXRlbS5nZXRSb2xsRGF0YSgpLCAuLi50aGlzLmFjdG9yPy5nZXRSb2xsRGF0YSgpIH07XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGl0ZW1UeXBlOiBudWxsLFxyXG4gICAgICAgICAgICBpdGVtOiBpdGVtLFxyXG4gICAgICAgICAgICBkYXRhOiBpdGVtLnN5c3RlbSxcclxuICAgICAgICAgICAgaXNQaHlzaWNhbDogZmFsc2UsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpdGVtLkRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICBjc3NDbGFzczogdGhpcy5pc0VkaXRhYmxlID8gXCJlZGl0YWJsZVwiIDogXCJsb2NrZWRcIixcclxuICAgICAgICAgICAgZWRpdGFibGU6IHRoaXMuaXNFZGl0YWJsZSxcclxuICAgICAgICAgICAgZG9jdW1lbnQ6IGl0ZW0sXHJcbiAgICAgICAgICAgIGxpbWl0ZWQ6IHRoaXMuaXRlbS5saW1pdGVkLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB0aGlzLm9wdGlvbnMsXHJcbiAgICAgICAgICAgIG93bmVyOiB0aGlzLml0ZW0uaXNPd25lcixcclxuICAgICAgICAgICAgdGl0bGU6IHRoaXMudGl0bGUsXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb3ZlcnJpZGUgYXN5bmMgX3VwZGF0ZU9iamVjdChldmVudDogRXZlbnQsIGZvcm1EYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBzdXBlci5fdXBkYXRlT2JqZWN0KGV2ZW50LCBmb3JtRGF0YSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0l0ZW1TaGVldERhdGE8VEl0ZW0gZXh0ZW5kcyBWZXJldGVub0l0ZW0+IGV4dGVuZHMgSXRlbVNoZWV0RGF0YTxUSXRlbT4ge1xyXG4gICAgaXRlbVR5cGU6IHN0cmluZyB8IG51bGw7XHJcbiAgICBpdGVtOiBUSXRlbTtcclxuICAgIGRhdGE6IFRJdGVtW1wic3lzdGVtXCJdO1xyXG4gICAgaXNQaHlzaWNhbDogYm9vbGVhbjtcclxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbiAgICAvLyBzeXN0ZW06IFZlcmV0ZW5vSXRlbVN5c3RlbURhdGE7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJdGVtU2hlZXRPcHRpb25zIGV4dGVuZHMgRG9jdW1lbnRTaGVldE9wdGlvbnMge1xyXG4gICAgaGFzU2lkZWJhcjogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9JdGVtU2hlZXQgfTtcclxuZXhwb3J0IHR5cGUgeyBWZXJldGVub0l0ZW1TaGVldERhdGEsIEl0ZW1TaGVldE9wdGlvbnMgfTsiLCAiaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtU2hlZXQsIFZlcmV0ZW5vSXRlbVNoZWV0RGF0YSB9IGZyb20gXCIuLi9iYXNlL3NoZWV0XCI7XHJcblxyXG5jbGFzcyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQ8VEl0ZW0gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbT4gZXh0ZW5kcyBWZXJldGVub0l0ZW1TaGVldDxUSXRlbT4ge1xyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zPzogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4pOiBQcm9taXNlPFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGE8VEl0ZW0+PiB7XHJcbiAgICAgICAgY29uc3Qgc2hlZXREYXRhID0gYXdhaXQgc3VwZXIuZ2V0RGF0YShvcHRpb25zKTtcclxuICAgICAgICBjb25zdCB7IGl0ZW0gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIC4uLnNoZWV0RGF0YSxcclxuICAgICAgICAgICAgaXNQaHlzaWNhbDogdHJ1ZSxcclxuICAgICAgICAgICAgd2VpZ2h0OiBpdGVtLndlaWdodCxcclxuICAgICAgICAgICAgcHJpY2U6IGl0ZW0ucHJpY2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXREYXRhPFRJdGVtIGV4dGVuZHMgUGh5c2ljYWxWZXJldGVub0l0ZW0+IGV4dGVuZHMgVmVyZXRlbm9JdGVtU2hlZXREYXRhPFRJdGVtPiB7XHJcbiAgICBpc1BoeXNpY2FsOiB0cnVlO1xyXG4gICAgd2VpZ2h0OiBudW1iZXI7XHJcbiAgICBwcmljZTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgeyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQgfTtcclxuZXhwb3J0IHR5cGUgeyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXREYXRhIH07IiwgImltcG9ydCB7IFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldCwgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YSB9IGZyb20gXCIuLi9waHlzaWNhbC1pdGVtL3NoZWV0XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQXJtb3IgfSBmcm9tIFwiLi9kb2N1bWVudFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9Bcm1vclNoZWV0IGV4dGVuZHMgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0PFZlcmV0ZW5vQXJtb3I+IHtcclxuICAgIG92ZXJyaWRlIGFzeW5jIGdldERhdGEob3B0aW9ucz86IFBhcnRpYWw8RG9jdW1lbnRTaGVldE9wdGlvbnM+KTogUHJvbWlzZTxWZXJldGVub0FybW9yU2hlZXREYXRhPiB7XHJcbiAgICAgICAgY29uc3Qgc2hlZXREYXRhID0gYXdhaXQgc3VwZXIuZ2V0RGF0YShvcHRpb25zKTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBpdGVtIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQ6IFZlcmV0ZW5vQXJtb3JTaGVldERhdGEgPSB7XHJcbiAgICAgICAgICAgIC4uLnNoZWV0RGF0YSxcclxuICAgICAgICAgICAgYXJtb3JDbGFzczogaXRlbS5hcm1vckNsYXNzLFxyXG4gICAgICAgICAgICBxdWFsaXR5OiBpdGVtLnF1YWxpdHksXHJcbiAgICAgICAgICAgIGR1cmFiaWxpdHk6IGl0ZW0uZHVyYWJpbGl0eSxcclxuICAgICAgICAgICAgbWF4RHVyYWJpbGl0eTogaXRlbS5tYXhEdWFyYWJpbGl0eSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB0ZW1wbGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gYHN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9pdGVtcy9hcm1vci1zaGVldC5oYnNgO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Bcm1vclNoZWV0RGF0YSBleHRlbmRzIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGE8VmVyZXRlbm9Bcm1vcj4ge1xyXG4gICAgYXJtb3JDbGFzczogbnVtYmVyO1xyXG4gICAgcXVhbGl0eTogbnVtYmVyO1xyXG4gICAgZHVyYWJpbGl0eTogbnVtYmVyO1xyXG4gICAgbWF4RHVyYWJpbGl0eTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0FybW9yU2hlZXQgfTtcclxuZXhwb3J0IHR5cGUgeyBWZXJldGVub0FybW9yU2hlZXREYXRhIH07IiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3JTb3VyY2UsIFZlcmV0ZW5vQWN0b3JTeXN0ZW1EYXRhIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9BY3RvcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBBY3RvcjxUUGFyZW50PntcclxuICAgIGdldCBEZXNjcmlwdGlvbigpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5zeXN0ZW0uZGVzY3JpcHRpb24gfHwgJycpLnRyaW0oKTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQWN0b3I8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgQWN0b3I8VFBhcmVudD4ge1xyXG4gICAgY29uc3RydWN0b3I6IHR5cGVvZiBWZXJldGVub0FjdG9yO1xyXG4gICAgc3lzdGVtOiBWZXJldGVub0FjdG9yU3lzdGVtRGF0YTtcclxuXHJcbiAgICBEZXNjcmlwdGlvbjogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBWZXJldGVub0FjdG9yUHJveHkgPSBuZXcgUHJveHkoVmVyZXRlbm9BY3Rvciwge1xyXG4gICAgY29uc3RydWN0KFxyXG4gICAgICAgIF90YXJnZXQsXHJcbiAgICAgICAgYXJnczogW3NvdXJjZTogUHJlQ3JlYXRlPFZlcmV0ZW5vQWN0b3JTb3VyY2U+LCBjb250ZXh0PzogRG9jdW1lbnRDb25zdHJ1Y3Rpb25Db250ZXh0PFZlcmV0ZW5vQWN0b3JbXCJwYXJlbnRcIl0+XSxcclxuICAgICkge1xyXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IGFyZ3NbMF07XHJcbiAgICAgICAgY29uc3QgdHlwZSA9IHNvdXJjZT8udHlwZTtcclxuICAgICAgICByZXR1cm4gbmV3IENPTkZJRy5WRVJFVEVOTy5BY3Rvci5kb2N1bWVudENsYXNzZXNbdHlwZV0oLi4uYXJncyk7XHJcbiAgICB9LFxyXG59KTtcclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQWN0b3IsIFZlcmV0ZW5vQWN0b3JQcm94eSB9OyIsICJpbXBvcnQgeyBWZXJldGVub1JvbGxEYXRhIH0gZnJvbSBcIi4vYWN0b3IvYmFzZS9kYXRhXCI7XHJcblxyXG5pbnRlcmZhY2UgSWRMYWJlbFR5cGU8VD4ge1xyXG4gICAgaWQ6IG51bWJlcjtcclxuICAgIGxhYmVsOiBzdHJpbmc7XHJcbiAgICB0eXBlOiBUO1xyXG59XHJcblxyXG5jbGFzcyBWZXJldGVub1JvbGxPcHRpb25zIHtcclxuICAgIHR5cGU6IFZlcmV0ZW5vUm9sbFR5cGUgPSBWZXJldGVub1JvbGxUeXBlLlJlZ3VsYXI7XHJcbiAgICBtZXNzYWdlRGF0YTogVmVyZXRlbm9NZXNzYWdlRGF0YSA9IG5ldyBWZXJldGVub01lc3NhZ2VEYXRhKCk7XHJcbiAgICByb2xsRGF0YTogVmVyZXRlbm9Sb2xsRGF0YSA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcbn1cclxuZW51bSBWZXJldGVub1JvbGxUeXBlIHtcclxuICAgIE5vbmUgPSAnbm9uZScsXHJcbiAgICBSZWd1bGFyID0gJ3JlZ3VsYXInLFxyXG4gICAgQXJtb3JCbG9jayA9ICdhcm1vci1ibG9jaycsXHJcbiAgICBBdHRhY2sgPSAnYXR0YWNrJyxcclxuICAgIEluaXRpYXRpdmUgPSAnaW5pdGlhdGl2ZScsXHJcbn1cclxuXHJcbmNsYXNzIFZlcmV0ZW5vTWVzc2FnZURhdGEgaW1wbGVtZW50cyBSb2xsT3B0aW9ucyB7XHJcbiAgICBbaW5kZXg6IHN0cmluZ106IGFueTtcclxuICAgIHVzZXJJZDogc3RyaW5nIHwgdW5kZWZpbmVkO1xyXG4gICAgc3BlYWtlcjogYW55ID0ge307XHJcbiAgICBmbGF2b3I6IHN0cmluZyA9ICcnO1xyXG4gICAgc291bmQ6IGFueSB8IG51bGwgPSBudWxsO1xyXG4gICAgYmxpbmQ6IGJvb2xlYW4gPSBmYWxzZVxyXG59XHJcblxyXG5jbGFzcyBWZXJldGVub1JvbGxEYXRhIHtcclxuICAgIGRpY2U6IHN0cmluZyA9ICdkMjAnO1xyXG4gICAgcG9vbDogbnVtYmVyID0gMTtcclxuICAgIGJvbnVzOiBudW1iZXIgPSAwO1xyXG4gICAgaXNTZXJpYWw6IGJvb2xlYW4gPSBmYWxzZTtcclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vUm9sbERhdGEge1xyXG4gICAgZGljZTogc3RyaW5nO1xyXG4gICAgcG9vbDogbnVtYmVyO1xyXG4gICAgYm9udXM6IG51bWJlcjtcclxuICAgIGlzU2VyaWFsOiBib29sZWFuO1xyXG59XHJcblxyXG5jbGFzcyBWZXJldGVub0NoYXRPcHRpb25zIHtcclxuICAgIGlzQmxpbmQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHNob3dEaWFsb2c6IGJvb2xlYW4gPSBmYWxzZTtcclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQ2hhdE9wdGlvbnMge1xyXG4gICAgaXNCbGluZDogYm9vbGVhbjtcclxuICAgIHNob3dEaWFsb2c6IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIHsgSWRMYWJlbFR5cGUgfVxyXG5leHBvcnQgdHlwZSB7IFZlcmV0ZW5vUm9sbE9wdGlvbnMsIFZlcmV0ZW5vTWVzc2FnZURhdGEgfVxyXG5leHBvcnQgeyBWZXJldGVub1JvbGxUeXBlLCBWZXJldGVub1JvbGxEYXRhLCBWZXJldGVub0NoYXRPcHRpb25zIH0iLCAiaW1wb3J0IHsgU2tpbGxUeXBlIH0gZnJvbSBcIiRjb21tb25cIjtcclxuaW1wb3J0IHsgQmFzZVBoeXNpY2FsSXRlbVNvdXJjZSwgUGh5c2ljYWxTeXN0ZW1Tb3VyY2UsIFBoeXNpY2FsVmVyZXRlbm9JdGVtU3lzdGVtRGF0YSB9IGZyb20gXCIuLi9waHlzaWNhbC1pdGVtL2RhdGFcIjtcclxuXHJcbmludGVyZmFjZSBWZXJldGVub1dlYXBvblN5c3RlbURhdGEgZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbVN5c3RlbURhdGEge1xyXG4gICAgbW9kaWZpZXI6IG51bWJlcjtcclxuICAgIGRhbWFnZTogbnVtYmVyO1xyXG4gICAgaW5pdGlhdGl2ZTogbnVtYmVyO1xyXG4gICAgY3JpdDogbnVtYmVyO1xyXG4gICAgd2VhcG9uVHlwZTogV2VhcG9uVHlwZSxcclxuICAgIGF0dGFja1dpdGg6IFNraWxsVHlwZSxcclxuICAgIHJhbmdlOiBSYW5nZVR5cGUsXHJcbiAgICBoYXNCdXJzdDogYm9vbGVhblxyXG59XHJcblxyXG50eXBlIFdlYXBvblNvdXJjZSA9IEJhc2VQaHlzaWNhbEl0ZW1Tb3VyY2U8XCJ3ZWFwb25cIiwgV2VhcG9uU3lzdGVtU291cmNlPjtcclxuXHJcbmludGVyZmFjZSBXZWFwb25TeXN0ZW1Tb3VyY2UgZXh0ZW5kcyBQaHlzaWNhbFN5c3RlbVNvdXJjZSB7XHJcbiAgICBtb2RpZmllcjogbnVtYmVyO1xyXG4gICAgZGFtYWdlOiBudW1iZXI7XHJcbiAgICBpbml0aWF0aXZlOiBudW1iZXI7XHJcbiAgICBjcml0OiBudW1iZXI7XHJcbiAgICB3ZWFwb25UeXBlOiBXZWFwb25UeXBlLFxyXG4gICAgYXR0YWNrV2l0aDogU2tpbGxUeXBlLFxyXG4gICAgcmFuZ2U6IFJhbmdlVHlwZSxcclxuICAgIGhhc0J1cnN0OiBib29sZWFuXHJcbn1cclxuXHJcbmVudW0gV2VhcG9uVHlwZSB7XHJcbiAgICBOb25lID0gXCJub25lXCIsXHJcbiAgICBCcmF3bGluZyA9IFwiYnJhd2xpbmdcIixcclxuICAgIE1lbGVlID0gXCJtZWxlZVwiLFxyXG4gICAgUmFuZ2VkID0gXCJyYW5nZWRcIlxyXG59XHJcblxyXG5lbnVtIFJhbmdlVHlwZSB7XHJcbiAgICBOb25lID0gXCJub25lXCIsXHJcbiAgICBQb2ludEJsYW5rID0gXCJwb2ludEJsYW5rXCIsXHJcbiAgICBDbG9zZSA9IFwiY2xvc2VcIixcclxuICAgIE1lZGl1bSA9IFwibWVkaXVtXCIsXHJcbiAgICBMb25nID0gXCJsb25nXCIsXHJcbiAgICBVdG1vc3QgPSBcInV0bW9zdFwiXHJcbn1cclxuXHJcbmVudW0gQXR0YWNrVHlwZSB7XHJcbiAgICBOb25lID0gXCJub25lXCIsXHJcbiAgICBSZWd1bGFyID0gXCJyZWd1bGFyXCIsXHJcbiAgICBQb3dlciA9IFwicG93ZXJcIixcclxuICAgIExpZ2h0ID0gXCJsaWdodFwiLFxyXG4gICAgQWltZWQgPSBcImFpbWVkXCIsXHJcbiAgICBIaXAgPSBcImhpcFwiLFxyXG4gICAgQnVyc3QgPSBcImJ1cnN0XCJcclxufVxyXG5cclxuZXhwb3J0IHsgV2VhcG9uVHlwZSwgUmFuZ2VUeXBlLCBBdHRhY2tUeXBlIH1cclxuZXhwb3J0IHsgVmVyZXRlbm9XZWFwb25TeXN0ZW1EYXRhLCBXZWFwb25Tb3VyY2UgfSIsICJpbXBvcnQgeyBWZXJldGVub1JvbGxEYXRhIH0gZnJvbSBcIiRtb2R1bGUvZGF0YVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FybW9yLCBWZXJldGVub0l0ZW0gfSBmcm9tIFwiJG1vZHVsZS9pdGVtXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vSXRlbVR5cGUgfSBmcm9tIFwiJG1vZHVsZS9pdGVtL2Jhc2UvZGF0YVwiO1xyXG5pbXBvcnQgeyBBdHRhY2tUeXBlLCBXZWFwb25UeXBlIH0gZnJvbSBcIiRtb2R1bGUvaXRlbS93ZWFwb24vZGF0YVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub1dlYXBvbiB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vd2VhcG9uL2RvY3VtZW50XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQWN0b3IgfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuaW1wb3J0IHsgQXR0cmlidXRlc0Jsb2NrLCBTa2lsbHNCbG9jaywgU3RhdHNCbG9jaywgVmVyZXRlbm9DcmVhdHVyZVN5c3RlbURhdGEsIFdlYXBvbkF0dGFja0luZm8gfSBmcm9tIFwiLi9kYXRhXCI7XHJcblxyXG5jbGFzcyBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQWN0b3I8VFBhcmVudD57XHJcbiAgICBnZXQgU3RhdHMoKTogU3RhdHNCbG9jayB7XHJcbiAgICAgICAgY29uc3QgaHAgPSB0aGlzLnN5c3RlbS5zdGF0cy5oaXRQb2ludHMudmFsdWU7XHJcbiAgICAgICAgaWYgKGhwID4gdGhpcy5NYXhIcCkge1xyXG4gICAgICAgICAgICB0aGlzLnN5c3RlbS5zdGF0cy5oaXRQb2ludHMudmFsdWUgPSB0aGlzLk1heEhwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgd3AgPSB0aGlzLnN5c3RlbS5zdGF0cy53aWxsUG9pbnRzLnZhbHVlO1xyXG4gICAgICAgIGlmICh3cCA+IHRoaXMuTWF4V3ApIHtcclxuICAgICAgICAgICAgdGhpcy5zeXN0ZW0uc3RhdHMud2lsbFBvaW50cy52YWx1ZSA9IHRoaXMuTWF4V3A7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uc3RhdHM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IEF0dHJpYnV0ZXMoKTogQXR0cmlidXRlc0Jsb2NrIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uYXR0cmlidXRlcztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgU2tpbGxzKCk6IFNraWxsc0Jsb2NrIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uc2tpbGxzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBNYXhIcCgpOiBudW1iZXIge1xyXG4gICAgICAgIGNvbnN0IGNvbnN0aXR1dGlvblZhbHVlID0gdGhpcy5BdHRyaWJ1dGVzLmNvbnN0aXR1dGlvbi52YWx1ZTtcclxuICAgICAgICBjb25zdCBkZXh0ZXJpdHlWYWx1ZSA9IHRoaXMuQXR0cmlidXRlcy5kZXh0ZXJpdHkudmFsdWU7XHJcbiAgICAgICAgY29uc3QgYm9udXNlcyA9IDA7XHJcblxyXG4gICAgICAgIHJldHVybiBjb25zdGl0dXRpb25WYWx1ZSArIGRleHRlcml0eVZhbHVlICsgYm9udXNlcztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgTWF4V3AoKTogbnVtYmVyIHtcclxuICAgICAgICBjb25zdCBpbnRlbGxpZ2VuY2VWYWx1ZSA9IHRoaXMuQXR0cmlidXRlcy5pbnRlbGxpZ2VuY2UudmFsdWU7XHJcbiAgICAgICAgY29uc3QgZW1wYXRoeVZhbHVlID0gdGhpcy5BdHRyaWJ1dGVzLmVtcGF0aHkudmFsdWU7XHJcbiAgICAgICAgY29uc3QgYm9udXNlcyA9IDA7XHJcblxyXG4gICAgICAgIHJldHVybiBpbnRlbGxpZ2VuY2VWYWx1ZSArIGVtcGF0aHlWYWx1ZSArIGJvbnVzZXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcdTA0MThcdTA0M0NcdTA0MzVcdTA0NEVcdTA0NDlcdTA0MzVcdTA0MzVcdTA0NDFcdTA0NEYgXHUwNDNFXHUwNDQwXHUwNDQzXHUwNDM2XHUwNDM4XHUwNDM1LlxyXG4gICAgICovXHJcbiAgICBnZXQgV2VhcG9ucygpOiBWZXJldGVub1dlYXBvbltdIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5pdGVtcy5tYXAoeCA9PiB4IGFzIHVua25vd24gYXMgVmVyZXRlbm9JdGVtKS5maWx0ZXIoeCA9PiB4LnR5cGUgPT0gVmVyZXRlbm9JdGVtVHlwZS5XZWFwb24pLm1hcCh4ID0+IHggYXMgVmVyZXRlbm9XZWFwb24pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHUwNDJEXHUwNDNBXHUwNDM4XHUwNDNGXHUwNDM4XHUwNDQwXHUwNDNFXHUwNDMyXHUwNDMwXHUwNDNEXHUwNDNEXHUwNDNFXHUwNDM1IFx1MDQzRVx1MDQ0MFx1MDQ0M1x1MDQzNlx1MDQzOFx1MDQzNS5cclxuICAgICAqL1xyXG4gICAgZ2V0IEVxdWlwcGVkV2VhcG9ucygpOiBWZXJldGVub1dlYXBvbltdIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5XZWFwb25zLmZpbHRlcih4ID0+IHguc3lzdGVtLmlzRXF1aXBwZWQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHUwNDE4XHUwNDNDXHUwNDM1XHUwNDRFXHUwNDQ5XHUwNDMwXHUwNDRGXHUwNDQxXHUwNDRGIFx1MDQzMVx1MDQ0MFx1MDQzRVx1MDQzRFx1MDQ0Ri5cclxuICAgICAqL1xyXG4gICAgZ2V0IEFybW9ycygpOiBWZXJldGVub0FybW9yW10ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLml0ZW1zLm1hcCh4ID0+IHggYXMgdW5rbm93biBhcyBWZXJldGVub0l0ZW0pLmZpbHRlcih4ID0+IHgudHlwZSA9PSBWZXJldGVub0l0ZW1UeXBlLkFybW9yKS5tYXAoeCA9PiB4IGFzIFZlcmV0ZW5vQXJtb3IpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHUwNDJEXHUwNDNBXHUwNDM4XHUwNDNGXHUwNDM4XHUwNDQwXHUwNDNFXHUwNDMyXHUwNDMwXHUwNDNEXHUwNDNEXHUwNDMwXHUwNDRGIFx1MDQzMVx1MDQ0MFx1MDQzRVx1MDQzRFx1MDQ0Ri5cclxuICAgICAqL1xyXG4gICAgZ2V0IEVxdWlwcGVkQXJtb3IoKTogVmVyZXRlbm9Bcm1vciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuQXJtb3JzLmZpbHRlcih4ID0+IHguc3lzdGVtLmlzRXF1aXBwZWQpWzBdIHx8IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2V0QXR0cmlidXRlUm9sbERhdGEoa2V5OiBzdHJpbmcpOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERhdGE+IHtcclxuICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSB0aGlzLkF0dHJpYnV0ZXNba2V5XTtcclxuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGF0YSgpO1xyXG4gICAgICAgIGlmIChhdHRyaWJ1dGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBhdHRyaWJ1dGUudmFsdWU7XHJcbiAgICAgICAgY29uc3QgYm9udXNlcyA9IDA7XHJcbiAgICAgICAgcmVzdWx0LnBvb2wgPSB2YWx1ZSArIGJvbnVzZXM7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2V0U2tpbGxSb2xsRGF0YShrZXk6IHN0cmluZyk6IFByb21pc2U8VmVyZXRlbm9Sb2xsRGF0YT4ge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNraWxsID0gdGhpcy5Ta2lsbHNba2V5XTtcclxuICAgICAgICBpZiAoc2tpbGwgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgYXR0cmlidXRlUm9sbERhdGEgPSBhd2FpdCB0aGlzLmdldEF0dHJpYnV0ZVJvbGxEYXRhKHNraWxsLmF0dHJpYnV0ZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gc2tpbGwudmFsdWU7XHJcbiAgICAgICAgY29uc3QgYm9udXNlcyA9IDA7XHJcbiAgICAgICAgcmVzdWx0LnBvb2wgPSBhdHRyaWJ1dGVSb2xsRGF0YS5wb29sICsgdmFsdWUgKyBib251c2VzO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGdldFdlYXBvblJvbGxEYXRhKHdlYXBvbkRhdGE6IFdlYXBvbkF0dGFja0luZm8pOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERhdGE+IHtcclxuICAgICAgICBsZXQgaXRlbSA9IHRoaXMuaXRlbXMuZ2V0KHdlYXBvbkRhdGEuaWQpIGFzIHVua25vd24gYXMgVmVyZXRlbm9XZWFwb247XHJcblxyXG4gICAgICAgIGxldCBpdGVtU2tpbGwgPSBpdGVtLnN5c3RlbS5hdHRhY2tXaXRoO1xyXG4gICAgICAgIGxldCBza2lsbFJvbGxEYXRhID0gYXdhaXQgdGhpcy5nZXRTa2lsbFJvbGxEYXRhKGl0ZW1Ta2lsbCk7XHJcblxyXG4gICAgICAgIGxldCB3ZWFwb25BdHRhY2tUeXBlTW9kaWZpZXIgPSB0aGlzLmdldFdlYXBvbkF0dGFja1R5cGVNb2RpZmllcih3ZWFwb25EYXRhKTtcclxuXHJcbiAgICAgICAgbGV0IHdlYXBvbkF0dGFja01vZGlmaWVyID0gaXRlbS5zeXN0ZW0ubW9kaWZpZXI7XHJcblxyXG4gICAgICAgIGxldCB3ZWFwb25EYW1hZ2UgPSBpdGVtLnN5c3RlbS5kYW1hZ2U7XHJcblxyXG4gICAgICAgIGNvbnN0IHJvbGxEYXRhOiBWZXJldGVub1JvbGxEYXRhID0gbWVyZ2VPYmplY3Qoc2tpbGxSb2xsRGF0YSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcG9vbDogc2tpbGxSb2xsRGF0YS5wb29sICsgd2VhcG9uQXR0YWNrVHlwZU1vZGlmaWVyICsgd2VhcG9uQXR0YWNrTW9kaWZpZXIsXHJcbiAgICAgICAgICAgICAgICB3ZWFwb25EYW1hZ2UsXHJcbiAgICAgICAgICAgICAgICB3ZWFwb25BdHRhY2tNb2RpZmllclxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHdlYXBvbkRhdGEuYXR0YWNrVHlwZSA9PSBBdHRhY2tUeXBlLkJ1cnN0KSB7XHJcbiAgICAgICAgICAgIHJvbGxEYXRhLmlzU2VyaWFsID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByb2xsRGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRXZWFwb25BdHRhY2tUeXBlTW9kaWZpZXIod2VhcG9uRGF0YTogV2VhcG9uQXR0YWNrSW5mbyk6IG51bWJlciB7XHJcbiAgICAgICAgaWYgKHdlYXBvbkRhdGEud2VhcG9uVHlwZSA9PSBXZWFwb25UeXBlLk1lbGVlIHx8IHdlYXBvbkRhdGEud2VhcG9uVHlwZSA9PSBXZWFwb25UeXBlLkJyYXdsaW5nKSB7XHJcbiAgICAgICAgICAgIGlmICh3ZWFwb25EYXRhLmF0dGFja1R5cGUgPT0gQXR0YWNrVHlwZS5Qb3dlcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh3ZWFwb25EYXRhLmF0dGFja1R5cGUgPT0gQXR0YWNrVHlwZS5MaWdodCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0yO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh3ZWFwb25EYXRhLndlYXBvblR5cGUgPT0gV2VhcG9uVHlwZS5SYW5nZWQpIHtcclxuICAgICAgICAgICAgaWYgKHdlYXBvbkRhdGEuYXR0YWNrVHlwZSA9PSBBdHRhY2tUeXBlLkFpbWVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHdlYXBvbkRhdGEuYXR0YWNrVHlwZSA9PSBBdHRhY2tUeXBlLkhpcCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0yO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAod2VhcG9uRGF0YS5hdHRhY2tUeXBlID09IEF0dGFja1R5cGUuQnVyc3QpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAtMjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gMDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBnZXRBcm1vclJvbGxEYXRhKGl0ZW1JZDogc3RyaW5nKTogUHJvbWlzZTxWZXJldGVub1JvbGxEYXRhIHwgbnVsbD4ge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcbiAgICAgICAgbGV0IGl0ZW0gPSAodGhpcy5pdGVtcy5nZXQoaXRlbUlkKSBhcyB1bmtub3duIGFzIFZlcmV0ZW5vQXJtb3IpO1xyXG5cclxuICAgICAgICBpZiAoIWl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXN1bHQucG9vbCA9IGl0ZW0uc3lzdGVtLmR1cmFiaWxpdHlcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBnZXRJbml0aWF0aXZlUm9sbERhdGEoaXRlbUlkOiBzdHJpbmcpOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERhdGE+IHtcclxuICAgICAgICBsZXQgaXRlbSA9ICh0aGlzLml0ZW1zLmdldChpdGVtSWQpIGFzIHVua25vd24gYXMgVmVyZXRlbm9XZWFwb24pO1xyXG5cclxuICAgICAgICBsZXQgc2tpbGwgPSB0aGlzLlNraWxscy5hZ2lsaXR5O1xyXG5cclxuICAgICAgICBsZXQgYm9udXNlcyA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcbiAgICAgICAgcmVzdWx0LnBvb2wgPSAxO1xyXG4gICAgICAgIHJlc3VsdC5ib251cyA9IHNraWxsLnZhbHVlICsgaXRlbS5zeXN0ZW0ubW9kaWZpZXIgKyBib251c2VzO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGVxdWlwV2VhcG9uKCkgeyB9XHJcblxyXG4gICAgYXN5bmMgZXF1aXBBcm1vcigpIHsgfVxyXG5cclxuICAgIGFzeW5jIHVuZXF1aXBJdGVtKCkgeyB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQWN0b3I8VFBhcmVudD4ge1xyXG4gICAgc3lzdGVtOiBWZXJldGVub0NyZWF0dXJlU3lzdGVtRGF0YSxcclxuICAgIFN0YXRzOiBTdGF0c0Jsb2NrO1xyXG4gICAgQXR0cmlidXRlczogQXR0cmlidXRlc0Jsb2NrO1xyXG4gICAgU2tpbGxzOiBTa2lsbHNCbG9jaztcclxuICAgIE1heEhwOiBudW1iZXI7XHJcbiAgICBNYXhXcDogbnVtYmVyO1xyXG4gICAgV2VhcG9uczogVmVyZXRlbm9XZWFwb25bXTtcclxuICAgIEFybW9yczogVmVyZXRlbm9Bcm1vcltdO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0NyZWF0dXJlIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9DcmVhdHVyZSB9IGZyb20gXCIuLi9pbmRleFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0NoYXJhY3RlclN5c3RlbURhdGEgfSBmcm9tIFwiLi9kYXRhXCI7XHJcblxyXG5jbGFzcyBWZXJldGVub0NoYXJhY3RlcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQ+e1xyXG4gICAgZ2V0IE1vbmV5KCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLm1vbmV5IHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IFJlcHV0YXRpb24oKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ucmVwdXRhdGlvbiB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBFeHAoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uZXhwIHx8IDA7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0NoYXJhY3RlcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQ+IHtcclxuICAgIHN5c3RlbTogVmVyZXRlbm9DaGFyYWN0ZXJTeXN0ZW1EYXRhO1xyXG5cclxuICAgIE1vbmV5OiBudW1iZXI7XHJcbiAgICBSZXB1dGF0aW9uOiBudW1iZXI7XHJcbiAgICBFeHA6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9DaGFyYWN0ZXIgfSIsICJpbXBvcnQgeyBWZXJldGVub0NyZWF0dXJlIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcblxyXG5jbGFzcyBWZXJldGVub01vbnN0ZXI8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZTxUUGFyZW50PntcclxuXHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub01vbnN0ZXI8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZTxUUGFyZW50PiB7XHJcblxyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub01vbnN0ZXIgfSIsICJpbXBvcnQgeyBWZXJldGVub0NyZWF0dXJlIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcblxyXG5jbGFzcyBWZXJldGVub05wYzxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQ+e1xyXG5cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vTnBjPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudD4ge1xyXG5cclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9OcGMgfSIsICJpbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIiRtb2R1bGUvYWN0b3JcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtU291cmNlLCBWZXJldGVub0l0ZW1TeXN0ZW1EYXRhIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW1TaGVldCB9IGZyb20gXCIuL3NoZWV0XCI7XHJcblxyXG5jbGFzcyBWZXJldGVub0l0ZW08VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgSXRlbTxUUGFyZW50PntcclxuICAgIGdldCBkYXRhKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnByZXBhcmVEYXRhKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IERlc2NyaXB0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5zeXN0ZW0uZGVzY3JpcHRpb24gfHwgJycpLnRyaW0oKTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogS2VlcCBgVGV4dEVkaXRvcmAgYW5kIGFueXRoaW5nIGVsc2UgdXAgdG8gbm8gZ29vZCBmcm9tIHNldHRpbmcgdGhpcyBpdGVtJ3MgZGVzY3JpcHRpb24gdG8gYG51bGxgICovXHJcbiAgICBwcm90ZWN0ZWQgb3ZlcnJpZGUgYXN5bmMgX3ByZVVwZGF0ZShcclxuICAgICAgICBjaGFuZ2VkOiBEZWVwUGFydGlhbDx0aGlzW1wiX3NvdXJjZVwiXT4sXHJcbiAgICAgICAgb3B0aW9uczogRG9jdW1lbnRVcGRhdGVDb250ZXh0PFRQYXJlbnQ+LFxyXG4gICAgICAgIHVzZXI6IFVzZXIsXHJcbiAgICApOiBQcm9taXNlPGJvb2xlYW4gfCB2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIHN1cGVyLl9wcmVVcGRhdGUoY2hhbmdlZCwgb3B0aW9ucywgdXNlcik7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKiBSZWZyZXNoIHRoZSBJdGVtIERpcmVjdG9yeSBpZiB0aGlzIGl0ZW0gaXNuJ3QgZW1iZWRkZWQgKi9cclxuICAgIHByb3RlY3RlZCBvdmVycmlkZSBfb25VcGRhdGUoXHJcbiAgICAgICAgZGF0YTogRGVlcFBhcnRpYWw8dGhpc1tcIl9zb3VyY2VcIl0+LFxyXG4gICAgICAgIG9wdGlvbnM6IERvY3VtZW50TW9kaWZpY2F0aW9uQ29udGV4dDxUUGFyZW50PixcclxuICAgICAgICB1c2VySWQ6IHN0cmluZyxcclxuICAgICk6IHZvaWQge1xyXG4gICAgICAgIHN1cGVyLl9vblVwZGF0ZShkYXRhLCBvcHRpb25zLCB1c2VySWQpO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9JdGVtPFRQYXJlbnQgZXh0ZW5kcyBWZXJldGVub0FjdG9yIHwgbnVsbCA9IFZlcmV0ZW5vQWN0b3IgfCBudWxsPiBleHRlbmRzIEl0ZW08VFBhcmVudD4ge1xyXG4gICAgY29uc3RydWN0b3I6IHR5cGVvZiBWZXJldGVub0l0ZW07XHJcbiAgICBzeXN0ZW06IFZlcmV0ZW5vSXRlbVN5c3RlbURhdGE7XHJcblxyXG4gICAgRGVzY3JpcHRpb246IHN0cmluZztcclxuXHJcbiAgICBfc2hlZXQ6IFZlcmV0ZW5vSXRlbVNoZWV0PHRoaXM+IHwgbnVsbDtcclxuXHJcbiAgICBnZXQgc2hlZXQoKTogVmVyZXRlbm9JdGVtU2hlZXQ8dGhpcz47XHJcblxyXG4gICAgcHJlcGFyZVNpYmxpbmdEYXRhPyh0aGlzOiBWZXJldGVub0l0ZW08VmVyZXRlbm9BY3Rvcj4pOiB2b2lkO1xyXG4gICAgcHJlcGFyZUFjdG9yRGF0YT8odGhpczogVmVyZXRlbm9JdGVtPFZlcmV0ZW5vQWN0b3I+KTogdm9pZDtcclxuICAgIC8qKiBPcHRpb25hbCBkYXRhLXByZXBhcmF0aW9uIGNhbGxiYWNrIGV4ZWN1dGVkIGFmdGVyIHJ1bGUtZWxlbWVudCBzeW50aGV0aWNzIGFyZSBwcmVwYXJlZCAqL1xyXG4gICAgb25QcmVwYXJlU3ludGhldGljcz8odGhpczogVmVyZXRlbm9JdGVtPFZlcmV0ZW5vQWN0b3I+KTogdm9pZDtcclxuXHJcbiAgICAvKiogUmV0dXJucyBpdGVtcyB0aGF0IHNob3VsZCBhbHNvIGJlIGFkZGVkIHdoZW4gdGhpcyBpdGVtIGlzIGNyZWF0ZWQgKi9cclxuICAgIGNyZWF0ZUdyYW50ZWRJdGVtcz8ob3B0aW9ucz86IG9iamVjdCk6IFByb21pc2U8VmVyZXRlbm9JdGVtW10+O1xyXG5cclxuICAgIC8qKiBSZXR1cm5zIGl0ZW1zIHRoYXQgc2hvdWxkIGFsc28gYmUgZGVsZXRlZCBzaG91bGQgdGhpcyBpdGVtIGJlIGRlbGV0ZWQgKi9cclxuICAgIGdldExpbmtlZEl0ZW1zPygpOiBWZXJldGVub0l0ZW08VmVyZXRlbm9BY3Rvcj5bXTtcclxufVxyXG5cclxuY29uc3QgVmVyZXRlbm9JdGVtUHJveHkgPSBuZXcgUHJveHkoVmVyZXRlbm9JdGVtLCB7XHJcbiAgICBjb25zdHJ1Y3QoXHJcbiAgICAgICAgX3RhcmdldCxcclxuICAgICAgICBhcmdzOiBbc291cmNlOiBQcmVDcmVhdGU8VmVyZXRlbm9JdGVtU291cmNlPiwgY29udGV4dD86IERvY3VtZW50Q29uc3RydWN0aW9uQ29udGV4dDxWZXJldGVub0FjdG9yIHwgbnVsbD5dLFxyXG4gICAgKSB7XHJcbiAgICAgICAgY29uc3Qgc291cmNlID0gYXJnc1swXTtcclxuICAgICAgICBjb25zdCB0eXBlID0gc291cmNlPy50eXBlO1xyXG4gICAgICAgIGNvbnN0IEl0ZW1DbGFzczogdHlwZW9mIFZlcmV0ZW5vSXRlbSA9IENPTkZJRy5WRVJFVEVOTy5JdGVtLmRvY3VtZW50Q2xhc3Nlc1t0eXBlXSA/PyBWZXJldGVub0l0ZW07XHJcbiAgICAgICAgcmV0dXJuIG5ldyBJdGVtQ2xhc3MoLi4uYXJncyk7XHJcbiAgICB9LFxyXG59KTtcclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vSXRlbSwgVmVyZXRlbm9JdGVtUHJveHkgfSIsICJpbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIiRtb2R1bGUvYWN0b3JcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtIH0gZnJvbSBcIi4uXCI7XHJcbmltcG9ydCB7IFBoeXNpY2FsVmVyZXRlbm9JdGVtU3lzdGVtRGF0YSB9IGZyb20gXCIuL2RhdGFcIjtcclxuXHJcbmNsYXNzIFBoeXNpY2FsVmVyZXRlbm9JdGVtPFRQYXJlbnQgZXh0ZW5kcyBWZXJldGVub0FjdG9yIHwgbnVsbCA9IFZlcmV0ZW5vQWN0b3IgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBnZXQgd2VpZ2h0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS53ZWlnaHQgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgcHJpY2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLnByaWNlIHx8IDA7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBQaHlzaWNhbFZlcmV0ZW5vSXRlbTxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0l0ZW08VFBhcmVudD4ge1xyXG4gICAgc3lzdGVtOiBQaHlzaWNhbFZlcmV0ZW5vSXRlbVN5c3RlbURhdGE7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFBoeXNpY2FsVmVyZXRlbm9JdGVtIH07IiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3IgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5pbXBvcnQgeyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIuLi9pbmRleFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FybW9yU3lzdGVtRGF0YSB9IGZyb20gXCIuL2RhdGFcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vQXJtb3I8VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgUGh5c2ljYWxWZXJldGVub0l0ZW08VFBhcmVudD4ge1xyXG4gICAgZ2V0IGFybW9yQ2xhc3MoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uYXJtb3JDbGFzcyB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBxdWFsaXR5KCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLnF1YWxpdHkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbWF4RHVhcmFiaWxpdHkoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hcm1vckNsYXNzICsgdGhpcy5xdWFsaXR5O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBkdXJhYmlsaXR5KCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmR1cmFiaWxpdHkgfHwgdGhpcy5tYXhEdWFyYWJpbGl0eTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQXJtb3I8VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgUGh5c2ljYWxWZXJldGVub0l0ZW08VFBhcmVudD4ge1xyXG4gICAgc3lzdGVtOiBWZXJldGVub0FybW9yU3lzdGVtRGF0YTtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9Bcm1vciB9IiwgImVudW0gU2tpbGxUeXBlIHtcclxuICAgIE5vbmUgPSBcIm5vbmVcIixcclxuICAgIE1lbGVlID0gXCJtZWxlZVwiLFxyXG4gICAgU3RyZW5ndGggPSBcInN0cmVuZ3RoXCIsXHJcbiAgICBBZ2lsaXR5ID0gXCJhZ2lsaXR5XCIsXHJcbiAgICBQaWxvdGluZyA9IFwicGlsb3RpbmdcIixcclxuICAgIFN0ZWFsdGggPSBcInN0ZWFsdGhcIixcclxuICAgIFJhbmdlZCA9IFwicmFuZ2VkXCIsXHJcbiAgICBDeWJlcnNoYW1hbmlzbSA9IFwiY3liZXJzaGFtYW5pc21cIixcclxuICAgIFN1cnZpdmFsID0gXCJzdXJ2aXZhbFwiLFxyXG4gICAgTWVkaWNpbmUgPSBcIm1lZGljaW5lXCIsXHJcbiAgICBPYnNlcnZhdGlvbiA9IFwib2JzZXJ2YXRpb25cIixcclxuICAgIFNjaWVuY2UgPSBcInNjaWVuY2VcIixcclxuICAgIE1lY2hhbmljcyA9IFwibWVjaGFuaWNzXCIsXHJcbiAgICBNYW5pcHVsYXRpb24gPSBcIm1hbmlwdWxhdGlvblwiLFxyXG4gICAgTGVhZGVyc2hpcCA9IFwibGVhZGVyc2hpcFwiLFxyXG4gICAgV2l0Y2hjcmFmdCA9IFwid2l0Y2hjcmFmdFwiLFxyXG4gICAgQ3VsdHVyZSA9IFwiY3VsdHVyZVwiLFxyXG59O1xyXG5cclxuaW50ZXJmYWNlIElEaWN0aW9uYXJ5PFQ+IHtcclxuICAgIFtpbmRleDogc3RyaW5nXTogVFxyXG59XHJcblxyXG5leHBvcnQgeyBTa2lsbFR5cGUgfVxyXG5leHBvcnQgdHlwZSB7IElEaWN0aW9uYXJ5IH0iLCAiaW1wb3J0IHsgU2tpbGxUeXBlIH0gZnJvbSBcIiRjb21tb25cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9BY3RvciB9IGZyb20gXCIkbW9kdWxlL2FjdG9yXCI7XHJcbmltcG9ydCB7IFBoeXNpY2FsVmVyZXRlbm9JdGVtIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcbmltcG9ydCB7IFdlYXBvblR5cGUsIFJhbmdlVHlwZSwgVmVyZXRlbm9XZWFwb25TeXN0ZW1EYXRhIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9XZWFwb248VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgUGh5c2ljYWxWZXJldGVub0l0ZW08VFBhcmVudD4ge1xyXG4gICAgZ2V0IE1vZGlmaWVyKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLm1vZGlmaWVyO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBEYW1hZ2UoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uZGFtYWdlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBJbml0aWF0aXZlKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmluaXRpYXRpdmU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IENyaXQoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uY3JpdDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgV2VhcG9uVHlwZSgpOiBXZWFwb25UeXBlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ud2VhcG9uVHlwZSB8fCBXZWFwb25UeXBlLk5vbmU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IEF0dGFja1dpdGgoKTogU2tpbGxUeXBlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uYXR0YWNrV2l0aCB8fCBTa2lsbFR5cGUuTm9uZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgUmFuZ2UoKTogUmFuZ2VUeXBlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ucmFuZ2UgfHwgUmFuZ2VUeXBlLk5vbmU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IEhhc0J1cnN0KCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5oYXNCdXJzdCB8fCBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vV2VhcG9uPFRQYXJlbnQgZXh0ZW5kcyBWZXJldGVub0FjdG9yIHwgbnVsbCA9IFZlcmV0ZW5vQWN0b3IgfCBudWxsPiBleHRlbmRzIFBoeXNpY2FsVmVyZXRlbm9JdGVtPFRQYXJlbnQ+IHtcclxuICAgIHN5c3RlbTogVmVyZXRlbm9XZWFwb25TeXN0ZW1EYXRhO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub1dlYXBvbiB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQ2hhcmFjdGVyLCBWZXJldGVub01vbnN0ZXIsIFZlcmV0ZW5vTnBjIH0gZnJvbSBcIiRtb2R1bGUvYWN0b3JcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9Bcm1vciB9IGZyb20gXCIkbW9kdWxlL2l0ZW1cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9XZWFwb24gfSBmcm9tIFwiJG1vZHVsZS9pdGVtL3dlYXBvbi9kb2N1bWVudFwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IFZFUkVURU5PQ09ORklHID0ge1xyXG4gICAgY29tbW9uOiB7XHJcbiAgICAgICAgcHJpY2U6IFwidmVyZXRlbm8uY29tbW9uLnByaWNlXCIsXHJcbiAgICB9LFxyXG4gICAgdGFiczoge1xyXG4gICAgICAgIHN0YXQ6IFwidmVyZXRlbm8udGFiLnN0YXRcIixcclxuICAgICAgICBlcXVpcG1lbnQ6IFwidmVyZXRlbm8udGFiLmVxdWlwbWVudFwiLFxyXG4gICAgICAgIGZpZ2h0OiBcInZlcmV0ZW5vLnRhYi5maWdodFwiLFxyXG4gICAgICAgIGJpbzogXCJ2ZXJldGVuby50YWIuYmlvXCJcclxuICAgIH0sXHJcbiAgICB3ZWFwb25UeXBlczoge1xyXG4gICAgICAgIG5vbmU6IFwidmVyZXRlbm8ud2VhcG9uVHlwZS5ub25lXCIsXHJcbiAgICAgICAgYnJhd2xpbmc6IFwidmVyZXRlbm8ud2VhcG9uVHlwZS5icmF3bGluZ1wiLFxyXG4gICAgICAgIG1lbGVlOiBcInZlcmV0ZW5vLndlYXBvblR5cGUubWVsZWVcIixcclxuICAgICAgICByYW5nZWQ6IFwidmVyZXRlbm8ud2VhcG9uVHlwZS5yYW5nZWRcIixcclxuICAgIH0sXHJcbiAgICByYW5nZVR5cGVzOiB7XHJcbiAgICAgICAgcG9pbnRCbGFuazogXCJ2ZXJldGVuby5yYW5nZS5wb2ludEJsYW5rXCIsXHJcbiAgICAgICAgY2xvc2U6IFwidmVyZXRlbm8ucmFuZ2UuY2xvc2VcIixcclxuICAgICAgICBtZWRpdW06IFwidmVyZXRlbm8ucmFuZ2UubWVkaXVtXCIsXHJcbiAgICAgICAgbG9uZzogXCJ2ZXJldGVuby5yYW5nZS5sb25nXCIsXHJcbiAgICAgICAgdXRtb3N0OiBcInZlcmV0ZW5vLnJhbmdlLnV0bW9zdFwiXHJcbiAgICB9LFxyXG4gICAgc3RhdHM6IHtcclxuICAgICAgICBoaXRQb2ludHM6IFwidmVyZXRlbm8uc3RhdC5oaXRQb2ludFwiLFxyXG4gICAgICAgIHdpbGxQb2ludHM6IFwidmVyZXRlbm8uc3RhdC53aWxsUG9pbnRcIixcclxuICAgICAgICByZXB1dGF0aW9uOiBcInZlcmV0ZW5vLnN0YXQucmVwdXRhdGlvblwiXHJcbiAgICB9LFxyXG4gICAgYXR0cmlidXRlczoge1xyXG4gICAgICAgIGNvbnN0aXR1dGlvbjogXCJ2ZXJldGVuby5hdHRyaWJ1dGUuY29uc3RpdHV0aW9uXCIsXHJcbiAgICAgICAgaW50ZWxsaWdlbmNlOiBcInZlcmV0ZW5vLmF0dHJpYnV0ZS5pbnRlbGxpZ2VuY2VcIixcclxuICAgICAgICBkZXh0ZXJpdHk6IFwidmVyZXRlbm8uYXR0cmlidXRlLmRleHRlcml0eVwiLFxyXG4gICAgICAgIGVtcGF0aHk6IFwidmVyZXRlbm8uYXR0cmlidXRlLmVtcGF0aHlcIlxyXG4gICAgfSxcclxuICAgIHNraWxsczoge1xyXG4gICAgICAgIG1lbGVlOiBcInZlcmV0ZW5vLnNraWxsLm1lbGVlXCIsXHJcbiAgICAgICAgc3RyZW5ndGg6IFwidmVyZXRlbm8uc2tpbGwuc3RyZW5ndGhcIixcclxuICAgICAgICBhZ2lsaXR5OiBcInZlcmV0ZW5vLnNraWxsLmFnaWxpdHlcIixcclxuICAgICAgICBwaWxvdGluZzogXCJ2ZXJldGVuby5za2lsbC5waWxvdGluZ1wiLFxyXG4gICAgICAgIHN0ZWFsdGg6IFwidmVyZXRlbm8uc2tpbGwuc3RlYWx0aFwiLFxyXG4gICAgICAgIHJhbmdlZDogXCJ2ZXJldGVuby5za2lsbC5yYW5nZWRcIixcclxuICAgICAgICBjeWJlcnNoYW1hbmlzbTogXCJ2ZXJldGVuby5za2lsbC5jeWJlcnNoYW1hbmlzbVwiLFxyXG4gICAgICAgIHN1cnZpdmFsOiBcInZlcmV0ZW5vLnNraWxsLnN1cnZpdmFsXCIsXHJcbiAgICAgICAgbWVkaWNpbmU6IFwidmVyZXRlbm8uc2tpbGwubWVkaWNpbmVcIixcclxuICAgICAgICBvYnNlcnZhdGlvbjogXCJ2ZXJldGVuby5za2lsbC5vYnNlcnZhdGlvblwiLFxyXG4gICAgICAgIHNjaWVuY2U6IFwidmVyZXRlbm8uc2tpbGwuc2NpZW5jZVwiLFxyXG4gICAgICAgIG1lY2hhbmljczogXCJ2ZXJldGVuby5za2lsbC5tZWNoYW5pY3NcIixcclxuICAgICAgICBtYW5pcHVsYXRpb246IFwidmVyZXRlbm8uc2tpbGwubWFuaXB1bGF0aW9uXCIsXHJcbiAgICAgICAgbGVhZGVyc2hpcDogXCJ2ZXJldGVuby5za2lsbC5sZWFkZXJzaGlwXCIsXHJcbiAgICAgICAgd2l0Y2hjcmFmdDogXCJ2ZXJldGVuby5za2lsbC53aXRjaGNyYWZ0XCIsXHJcbiAgICAgICAgY3VsdHVyZTogXCJ2ZXJldGVuby5za2lsbC5jdWx0dXJlXCJcclxuICAgIH0sXHJcblxyXG4gICAgSXRlbToge1xyXG4gICAgICAgIGRvY3VtZW50Q2xhc3Nlczoge1xyXG4gICAgICAgICAgICBhcm1vcjogVmVyZXRlbm9Bcm1vcixcclxuICAgICAgICAgICAgd2VhcG9uOiBWZXJldGVub1dlYXBvblxyXG4gICAgICAgIH0sXHJcbiAgICB9LFxyXG5cclxuICAgIEFjdG9yOiB7XHJcbiAgICAgICAgZG9jdW1lbnRDbGFzc2VzOiB7XHJcbiAgICAgICAgICAgIGNoYXJhY3RlcjogVmVyZXRlbm9DaGFyYWN0ZXIsXHJcbiAgICAgICAgICAgIG5wYzogVmVyZXRlbm9OcGMsXHJcbiAgICAgICAgICAgIG1vbnN0ZXI6IFZlcmV0ZW5vTW9uc3RlclxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSIsICJleHBvcnQgY29uc3QgVkVSRVRFTk9fUEFSVElBTFMgPSBbXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9zdGF0cy10YWIuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9zdGF0cy1ibG9jay5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL3NraWxscy1ibG9jay5oYnNcIixcclxuXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9lcXVpcG1lbnQtdGFiLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvaXRlbS93ZWFwb24tcGxhdGUuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9pdGVtL2FybW9yLXBsYXRlLmhic1wiLFxyXG5cclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2ZpZ2h0LXRhYi5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2ZpZ2h0L2JyYXdsaW5nLXdlYXBvbi1wbGF0ZS5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2ZpZ2h0L21lbGVlLXdlYXBvbi1wbGF0ZS5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2ZpZ2h0L3JhbmdlZC13ZWFwb24tcGxhdGUuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9maWdodC9hcm1vci1wbGF0ZS5oYnNcIixcclxuXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9iaW8tdGFiLmhic1wiLFxyXG5cclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2l0ZW0vYmFzZS1pdGVtLWJsb2NrLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvaXRlbS9waHlzaWNhbC1pdGVtLWJsb2NrLmhic1wiLFxyXG5dOyIsICJpbXBvcnQgeyBTa2lsbFR5cGUgfSBmcm9tIFwiJGNvbW1vblwiO1xyXG5pbXBvcnQgeyBJZExhYmVsVHlwZSB9IGZyb20gXCIkbW9kdWxlL2RhdGFcIjtcclxuaW1wb3J0IHsgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0LCBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXREYXRhIH0gZnJvbSBcIi4uL3BoeXNpY2FsLWl0ZW0vc2hlZXRcIjtcclxuaW1wb3J0IHsgV2VhcG9uVHlwZSwgUmFuZ2VUeXBlIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub1dlYXBvbiB9IGZyb20gXCIuL2RvY3VtZW50XCI7XHJcblxyXG5jbGFzcyBWZXJldGVub1dlYXBvblNoZWV0IGV4dGVuZHMgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0PFZlcmV0ZW5vV2VhcG9uPntcclxuICAgIG92ZXJyaWRlIGFzeW5jIGdldERhdGEob3B0aW9ucz86IFBhcnRpYWw8RG9jdW1lbnRTaGVldE9wdGlvbnM+KTogUHJvbWlzZTxWZXJldGVub1dlYXBvblNoZWV0RGF0YT4ge1xyXG4gICAgICAgIGNvbnN0IHNoZWV0RGF0YSA9IGF3YWl0IHN1cGVyLmdldERhdGEob3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgaXRlbSB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIHdlYXBvblR5cGVzID0gT2JqZWN0LnZhbHVlcyhXZWFwb25UeXBlKS5tYXAoKGUsIGkpID0+IHsgcmV0dXJuIHsgaWQ6IGksIGxhYmVsOiBnYW1lLmkxOG4ubG9jYWxpemUoYHZlcmV0ZW5vLndlYXBvblR5cGUuJHtlfWApLCB0eXBlOiBlIH0gfSlcclxuICAgICAgICB2YXIgcmFuZ2VUeXBlcyA9IE9iamVjdC52YWx1ZXMoUmFuZ2VUeXBlKS5tYXAoKGUsIGkpID0+IHsgcmV0dXJuIHsgaWQ6IGksIGxhYmVsOiBnYW1lLmkxOG4ubG9jYWxpemUoYHZlcmV0ZW5vLnJhbmdlLiR7ZX1gKSwgdHlwZTogZSB9IH0pXHJcbiAgICAgICAgdmFyIHNraWxsVHlwZXMgPSBPYmplY3QudmFsdWVzKFNraWxsVHlwZSkubWFwKChlLCBpKSA9PiB7IHJldHVybiB7IGlkOiBpLCBsYWJlbDogZ2FtZS5pMThuLmxvY2FsaXplKGB2ZXJldGVuby5za2lsbC4ke2V9YCksIHR5cGU6IGUgfSB9KVxyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQ6IFZlcmV0ZW5vV2VhcG9uU2hlZXREYXRhID0ge1xyXG4gICAgICAgICAgICAuLi5zaGVldERhdGEsXHJcbiAgICAgICAgICAgIG1vZGlmaWVyOiBpdGVtLk1vZGlmaWVyLFxyXG4gICAgICAgICAgICB3ZWFwb25UeXBlOiBpdGVtLldlYXBvblR5cGUsXHJcbiAgICAgICAgICAgIGF0dGFja1dpdGg6IGl0ZW0uQXR0YWNrV2l0aCxcclxuICAgICAgICAgICAgY3JpdDogaXRlbS5Dcml0LFxyXG4gICAgICAgICAgICBkYW1hZ2U6IGl0ZW0uRGFtYWdlLFxyXG4gICAgICAgICAgICBpbml0aWF0aXZlOiBpdGVtLkluaXRpYXRpdmUsXHJcbiAgICAgICAgICAgIHJhbmdlOiBpdGVtLlJhbmdlLFxyXG4gICAgICAgICAgICB3ZWFwb25UeXBlczogd2VhcG9uVHlwZXMsXHJcbiAgICAgICAgICAgIHJhbmdlczogcmFuZ2VUeXBlcyxcclxuICAgICAgICAgICAgc2tpbGxzOiBza2lsbFR5cGVzLFxyXG4gICAgICAgICAgICBpc1JhbmdlZDogaXRlbS5SYW5nZSA+IFJhbmdlVHlwZS5NZWRpdW0sXHJcbiAgICAgICAgICAgIGhhc0J1cnN0OiBpdGVtLkhhc0J1cnN0XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgdGVtcGxhdGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIGBzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvaXRlbXMvd2VhcG9uLXNoZWV0Lmhic2A7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub1dlYXBvblNoZWV0RGF0YSBleHRlbmRzIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGE8VmVyZXRlbm9XZWFwb24+IHtcclxuICAgIG1vZGlmaWVyOiBudW1iZXI7XHJcbiAgICBkYW1hZ2U6IG51bWJlcjtcclxuICAgIGluaXRpYXRpdmU6IG51bWJlcjtcclxuICAgIGNyaXQ6IG51bWJlcjtcclxuICAgIHdlYXBvblR5cGU6IFdlYXBvblR5cGUsXHJcbiAgICB3ZWFwb25UeXBlczogSWRMYWJlbFR5cGU8V2VhcG9uVHlwZT5bXSxcclxuICAgIGF0dGFja1dpdGg6IFNraWxsVHlwZSxcclxuICAgIHNraWxsczogSWRMYWJlbFR5cGU8U2tpbGxUeXBlPltdO1xyXG4gICAgcmFuZ2U6IFJhbmdlVHlwZVxyXG4gICAgcmFuZ2VzOiBJZExhYmVsVHlwZTxSYW5nZVR5cGU+W107XHJcbiAgICBpc1JhbmdlZDogYm9vbGVhbjtcclxuICAgIGhhc0J1cnN0OiBib29sZWFuXHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vV2VhcG9uU2hlZXQgfTtcclxuZXhwb3J0IHR5cGUgeyBWZXJldGVub1dlYXBvblNoZWV0RGF0YSB9IiwgImltcG9ydCB7IFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIkbW9kdWxlL2l0ZW1cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9BY3RvciB9IGZyb20gXCIuLlwiO1xyXG5cclxuYWJzdHJhY3QgY2xhc3MgVmVyZXRlbm9BY3RvclNoZWV0PFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vQWN0b3I+IGV4dGVuZHMgQWN0b3JTaGVldDxUQWN0b3IsIFZlcmV0ZW5vSXRlbT4ge1xyXG4gICAgc3RhdGljIG92ZXJyaWRlIGdldCBkZWZhdWx0T3B0aW9ucygpOiBBY3RvclNoZWV0T3B0aW9ucyB7XHJcbiAgICAgICAgY29uc3QgaXNSdXNzaWFuTGFuZ3VhZ2UgPSBnYW1lLnNldHRpbmdzLmdldChcImNvcmVcIiwgXCJsYW5ndWFnZVwiKSA9PSAncnUnO1xyXG5cclxuICAgICAgICBjb25zdCBvcHRpb25zID0gbWVyZ2VPYmplY3Qoc3VwZXIuZGVmYXVsdE9wdGlvbnMsIHtcclxuICAgICAgICAgICAgd2lkdGg6IDU2MCxcclxuICAgICAgICAgICAgY2xhc3NlczogWyd2ZXJldGVubycsICdhY3RvcicsICdzaGVldCddXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYoaXNSdXNzaWFuTGFuZ3VhZ2Upe1xyXG4gICAgICAgICAgICBvcHRpb25zLmNsYXNzZXMucHVzaChcImxhbmctcnVcIilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvcHRpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIG92ZXJyaWRlIGFzeW5jIGdldERhdGEob3B0aW9uczogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4gPSB7fSk6IFByb21pc2U8VmVyZXRlbm9BY3RvclNoZWV0RGF0YTxUQWN0b3I+PiB7XHJcbiAgICAgICAgb3B0aW9ucy5pZCA9IHRoaXMuaWQ7XHJcbiAgICAgICAgb3B0aW9ucy5lZGl0YWJsZSA9IHRoaXMuaXNFZGl0YWJsZTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgYWN0b3I6IGFjdG9yLFxyXG4gICAgICAgICAgICBjc3NDbGFzczogdGhpcy5hY3Rvci5pc093bmVyID8gXCJlZGl0YWJsZVwiIDogXCJsb2NrZWRcIixcclxuICAgICAgICAgICAgZGF0YTogYWN0b3Iuc3lzdGVtLFxyXG4gICAgICAgICAgICBkb2N1bWVudDogdGhpcy5hY3RvcixcclxuICAgICAgICAgICAgZWRpdGFibGU6IHRoaXMuaXNFZGl0YWJsZSxcclxuICAgICAgICAgICAgZWZmZWN0czogW10sXHJcbiAgICAgICAgICAgIGxpbWl0ZWQ6IHRoaXMuYWN0b3IubGltaXRlZCxcclxuICAgICAgICAgICAgb3B0aW9ucyxcclxuICAgICAgICAgICAgb3duZXI6IHRoaXMuYWN0b3IuaXNPd25lcixcclxuICAgICAgICAgICAgdGl0bGU6IHRoaXMudGl0bGUsXHJcbiAgICAgICAgICAgIGl0ZW1zOiBhY3Rvci5pdGVtcyxcclxuICAgICAgICAgICAgYWN0b3JUeXBlOiBhY3Rvci50eXBlLFxyXG5cclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGFjdG9yLkRlc2NyaXB0aW9uXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG92ZXJyaWRlIGFjdGl2YXRlTGlzdGVuZXJzKCRodG1sOiBKUXVlcnkpOiB2b2lkIHtcclxuICAgICAgICBzdXBlci5hY3RpdmF0ZUxpc3RlbmVycygkaHRtbCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0FjdG9yU2hlZXREYXRhPFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vQWN0b3I+IGV4dGVuZHMgQWN0b3JTaGVldERhdGE8VEFjdG9yPiB7XHJcbiAgICBhY3RvclR5cGU6IHN0cmluZyB8IG51bGw7XHJcbiAgICBhY3RvcjogVEFjdG9yO1xyXG4gICAgZGF0YTogVEFjdG9yW1wic3lzdGVtXCJdO1xyXG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9BY3RvclNoZWV0IH1cclxuZXhwb3J0IHR5cGUgeyBWZXJldGVub0FjdG9yU2hlZXREYXRhIH1cclxuIiwgImltcG9ydCB7IFZlcmV0ZW5vUm9sbERhdGEsIFZlcmV0ZW5vUm9sbE9wdGlvbnMgfSBmcm9tIFwiJG1vZHVsZS9kYXRhXCI7XHJcbmltcG9ydCB7IENoYXRNZXNzYWdlU2NoZW1hIH0gZnJvbSBcIi4uLy4uLy4uL3R5cGVzL2ZvdW5kcnkvY29tbW9uL2RvY3VtZW50cy9jaGF0LW1lc3NhZ2VcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vUm9sbCBleHRlbmRzIFJvbGwge1xyXG4gICAgc3RhdGljIG92ZXJyaWRlIENIQVRfVEVNUExBVEUgPSBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL2NoYXQvcm9sbHMvdmVyZXRlbm8tcm9sbC1jaGF0LW1lc3NhZ2UuaGJzXCI7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZm9ybXVsYTogc3RyaW5nLCBkYXRhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIG9wdGlvbnM/OiBSb2xsT3B0aW9ucykge1xyXG4gICAgICAgIHN1cGVyKGZvcm11bGEsIGRhdGEsIG9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBvdmVycmlkZSBhc3luYyBfZXZhbHVhdGUoeyBtaW5pbWl6ZSwgbWF4aW1pemUsIH06IE9taXQ8RXZhbHVhdGVSb2xsUGFyYW1zLCBcImFzeW5jXCI+KTogUHJvbWlzZTxSb2xsZWQ8dGhpcz4+IHtcclxuICAgICAgICBjb25zdCBzdXBlckV2YWx1YXRlID0gYXdhaXQgc3VwZXIuX2V2YWx1YXRlKHsgbWluaW1pemUsIG1heGltaXplIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gc3VwZXJFdmFsdWF0ZTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vUm9sbCBleHRlbmRzIFJvbGwgeyB9XHJcblxyXG5jbGFzcyBWZXJldGVub1NraWxsUm9sbCBleHRlbmRzIFZlcmV0ZW5vUm9sbCB7XHJcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zKSB7XHJcbiAgICAgICAgY29uc3Qgcm9sbERhdGEgPSBvcHRpb25zLnJvbGxEYXRhO1xyXG4gICAgICAgIGNvbnN0IGZvcm11bGEgPSBgJHtyb2xsRGF0YS5wb29sfSR7cm9sbERhdGEuZGljZX1gO1xyXG5cclxuICAgICAgICBzdXBlcihmb3JtdWxhLCAocm9sbERhdGEgYXMgUmVjb3JkPHN0cmluZywgYW55PiksIG9wdGlvbnMubWVzc2FnZURhdGEpO1xyXG4gICAgfVxyXG59XHJcbmludGVyZmFjZSBWZXJldGVub1NraWxsUm9sbCBleHRlbmRzIFZlcmV0ZW5vUm9sbCB7IH1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vUm9sbCwgVmVyZXRlbm9Ta2lsbFJvbGwgfVxyXG4iLCAiaW1wb3J0IHsgVmVyZXRlbm9Sb2xsT3B0aW9ucywgVmVyZXRlbm9Sb2xsVHlwZSB9IGZyb20gXCIkbW9kdWxlL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9Sb2xsIH0gZnJvbSBcIiRtb2R1bGUvc3lzdGVtL3JvbGxcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vUm9sbGVyIHtcclxuICAgIHJvbGxPYmplY3Q6IFZlcmV0ZW5vUm9sbCB8IG51bGwgPSBudWxsO1xyXG4gICAgb3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucyB8IG51bGwgPSBudWxsO1xyXG4gICAgdmVyZXRlbm9SZXN1bHQ6IFZlcmV0ZW5vUmVzdWx0ID0gbmV3IFZlcmV0ZW5vUmVzdWx0KCk7XHJcbiAgICB2ZXJldGVub1JvbGxzOiBWZXJldGVub0RpZVJlc3VsdFtdID0gW107XHJcblxyXG4gICAgYXN5bmMgcm9sbChyb2xsT3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHJvbGxPcHRpb25zO1xyXG4gICAgICAgIGlmIChyb2xsT3B0aW9ucy5yb2xsRGF0YS5wb29sIDw9IDAgJiYgcm9sbE9wdGlvbnMudHlwZSAhPSBWZXJldGVub1JvbGxUeXBlLkFybW9yQmxvY2spIHtcclxuICAgICAgICAgICAgLy9yZXR1cm4gYXdhaXQgdGhpcy5yb2xsRGVzcGVyYXRpb24ocm9sbE9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJvbGxGb3JtdWxhID0gYCR7cm9sbE9wdGlvbnMucm9sbERhdGEucG9vbH0ke3JvbGxPcHRpb25zLnJvbGxEYXRhLmRpY2V9YDtcclxuXHJcbiAgICAgICAgbGV0IHJvbGwgPSBuZXcgVmVyZXRlbm9Sb2xsKHJvbGxGb3JtdWxhKTtcclxuICAgICAgICB0aGlzLnJvbGxPYmplY3QgPSByb2xsO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMucm9sbE9iamVjdC5fZXZhbHVhdGVkKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucm9sbE9iamVjdC5ldmFsdWF0ZSh7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLnJlZXZhbHVhdGVUb3RhbCgpO1xyXG4gICAgICAgIHRoaXMudG9NZXNzYWdlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcm9sbEluaXRpYXRpdmUocm9sbE9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSByb2xsT3B0aW9ucztcclxuXHJcbiAgICAgICAgbGV0IHJvbGxGb3JtdWxhID0gYCR7cm9sbE9wdGlvbnMucm9sbERhdGEucG9vbH0ke3JvbGxPcHRpb25zLnJvbGxEYXRhLmRpY2V9YDtcclxuXHJcbiAgICAgICAgY29uc3QgYm9udXMgPSByb2xsT3B0aW9ucy5yb2xsRGF0YS5ib251cztcclxuICAgICAgICBpZiAoYm9udXMgIT09IG51bGwgJiYgYm9udXMgIT09IDApIHtcclxuICAgICAgICAgICAgaWYgKGJvbnVzID4gMCkge1xyXG4gICAgICAgICAgICAgICAgcm9sbEZvcm11bGEgPSByb2xsRm9ybXVsYSArIGArJHtib251c31gXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByb2xsRm9ybXVsYSA9IHJvbGxGb3JtdWxhICsgYCR7Ym9udXN9YFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcm9sbCA9IG5ldyBWZXJldGVub1JvbGwocm9sbEZvcm11bGEpO1xyXG4gICAgICAgIHRoaXMucm9sbE9iamVjdCA9IHJvbGw7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5yb2xsT2JqZWN0Ll9ldmFsdWF0ZWQpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5yb2xsT2JqZWN0LmV2YWx1YXRlKHt9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVldmFsdWF0ZVRvdGFsKCk7XHJcbiAgICAgICAgdGhpcy50b01lc3NhZ2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWV2YWx1YXRlVG90YWwoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnJvbGxPYmplY3QgfHwgIXRoaXMub3B0aW9ucykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMucm9sbE9iamVjdCEuX2V2YWx1YXRlZCkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJvbGxPYmplY3QhLmV2YWx1YXRlKHt9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucm9sbERhdGEuaXNTZXJpYWwpIHtcclxuICAgICAgICAgICAgdGhpcy5yb2xsT2JqZWN0Ll9mb3JtdWxhICs9ICcrJ1xyXG4gICAgICAgICAgICBsZXQgaXNJbnRlcnJ1cHRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB3aGlsZSAoIWlzSW50ZXJydXB0ZWQpIHtcclxuICAgICAgICAgICAgICAgIGxldCBhZGRpdGlvbmFsUm9sbCA9IG5ldyBSb2xsKCcxZDIwJyk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBhZGRpdGlvbmFsUm9sbC5ldmFsdWF0ZSh7fSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhZGRpdGlvbmFsUm9sbFJlc3VsdDogRGllUmVzdWx0ID0gKGFkZGl0aW9uYWxSb2xsLnRlcm1zWzBdIGFzIGFueSkucmVzdWx0c1swXTtcclxuICAgICAgICAgICAgICAgICh0aGlzLnJvbGxPYmplY3QudGVybXNbMF0gYXMgYW55KS5yZXN1bHRzLnB1c2goYWRkaXRpb25hbFJvbGxSZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFkZGl0aW9uYWxSb2xsUmVzdWx0LnJlc3VsdCA8PSA0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNJbnRlcnJ1cHRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCByb2xsRGljZXNSZXN1bHRzID0gKHRoaXMucm9sbE9iamVjdC50ZXJtc1swXSBhcyBhbnkpLnJlc3VsdHMgYXMgRGllUmVzdWx0W107XHJcbiAgICAgICAgbGV0IHJvbGxSZXN1bHQgPSB0aGlzLmNhbGN1bGF0ZURpY2VzVG90YWwocm9sbERpY2VzUmVzdWx0cyk7XHJcblxyXG4gICAgICAgIHRoaXMudmVyZXRlbm9SZXN1bHQgPSByb2xsUmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGNhbGN1bGF0ZURpY2VzVG90YWwoZGljZXM6IERpZVJlc3VsdFtdKTogVmVyZXRlbm9SZXN1bHQge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogVmVyZXRlbm9SZXN1bHQgPSB7XHJcbiAgICAgICAgICAgIHRvdGFsOiAwLFxyXG4gICAgICAgICAgICBzdWNjZXNzZXM6IDAsXHJcbiAgICAgICAgICAgIGNyaXRGYWlsczogMFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGljZXMuZm9yRWFjaChyID0+IHtcclxuICAgICAgICAgICAgbGV0IHJvbGxSZXN1bHQ6IFZlcmV0ZW5vRGllUmVzdWx0ID0ge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0OiByLnJlc3VsdCxcclxuICAgICAgICAgICAgICAgIGNsYXNzZXM6ICdkMjAnXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAoci5yZXN1bHQgPT09IDIwKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQudG90YWwgKz0gMjtcclxuICAgICAgICAgICAgICAgIHJvbGxSZXN1bHQuY2xhc3NlcyArPSAnIG1heCc7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuc3VjY2Vzc2VzICs9IDI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyLnJlc3VsdCA+PSAxNyAmJiByLnJlc3VsdCA8PSAxOSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRvdGFsKys7XHJcbiAgICAgICAgICAgICAgICByb2xsUmVzdWx0LmNsYXNzZXMgKz0gJyBnb29kJztcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5zdWNjZXNzZXMrKztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHIucmVzdWx0ID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQudG90YWwtLTtcclxuICAgICAgICAgICAgICAgIHJvbGxSZXN1bHQuY2xhc3NlcyArPSAnIG1pbic7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuY3JpdEZhaWxzKys7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudmVyZXRlbm9Sb2xscy5wdXNoKHJvbGxSZXN1bHQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHRvTWVzc2FnZSgpOiBQcm9taXNlPENoYXRNZXNzYWdlIHwgdW5kZWZpbmVkPiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY2hhdERhdGEgPSB0aGlzLm9wdGlvbnMubWVzc2FnZURhdGE7XHJcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSB0aGlzLmdldFRlbXBsYXRlKHRoaXMub3B0aW9ucy50eXBlKTtcclxuICAgICAgICBjb25zdCB2ZXJldGVub1JvbGxEYXRhID0gdGhpcy5nZXRWZXJldGVub1JvbGxEYXRhKCk7XHJcblxyXG4gICAgICAgIGNoYXREYXRhLmNvbnRlbnQgPSBhd2FpdCByZW5kZXJUZW1wbGF0ZSh0ZW1wbGF0ZSwgdmVyZXRlbm9Sb2xsRGF0YSk7XHJcbiAgICAgICAgY2hhdERhdGEucm9sbCA9IHRoaXMucm9sbE9iamVjdDtcclxuXHJcbiAgICAgICAgcmV0dXJuIENoYXRNZXNzYWdlLmNyZWF0ZShjaGF0RGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VGVtcGxhdGUodHlwZTogVmVyZXRlbm9Sb2xsVHlwZSk6IHN0cmluZyB7XHJcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgVmVyZXRlbm9Sb2xsVHlwZS5SZWd1bGFyOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvY2hhdC9yb2xscy92ZXJldGVuby1yb2xsLWNoYXQtbWVzc2FnZS5oYnNcIjtcclxuICAgICAgICAgICAgY2FzZSBWZXJldGVub1JvbGxUeXBlLkFybW9yQmxvY2s6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9jaGF0L3JvbGxzL3ZlcmV0ZW5vLWFybW9yLXJvbGwtY2hhdC1tZXNzYWdlLmhic1wiO1xyXG4gICAgICAgICAgICBjYXNlIFZlcmV0ZW5vUm9sbFR5cGUuSW5pdGlhdGl2ZTpcclxuICAgICAgICAgICAgICAgIHJldHVybiBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL2NoYXQvcm9sbHMvdmVyZXRlbm8taW5pdGlhdGl2ZS1yb2xsLWNoYXQtbWVzc2FnZS5oYnNcIjtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL2NoYXQvcm9sbHMvdmVyZXRlbm8tcm9sbC1jaGF0LW1lc3NhZ2UuaGJzXCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldFZlcmV0ZW5vUm9sbERhdGEoKTogVmVyZXRlbm9Sb2xsUmVzdWx0IHtcclxuICAgICAgICBsZXQgcm9sbERhdGEgPSB7XHJcbiAgICAgICAgICAgIGZvcm11bGE6IHRoaXMucm9sbE9iamVjdCEuX2Zvcm11bGEsXHJcbiAgICAgICAgICAgIHRvdGFsOiB0aGlzLnJvbGxPYmplY3QhLnRvdGFsISxcclxuICAgICAgICAgICAgdmVyZXRlbm9Ub3RhbDogdGhpcy52ZXJldGVub1Jlc3VsdC50b3RhbCxcclxuICAgICAgICAgICAgdmVyZXRlbm9TdWNjZXNzZXM6IHRoaXMudmVyZXRlbm9SZXN1bHQuc3VjY2Vzc2VzLFxyXG4gICAgICAgICAgICB2ZXJldGVub0NyaXRGYWlsczogdGhpcy52ZXJldGVub1Jlc3VsdC5jcml0RmFpbHMsXHJcbiAgICAgICAgICAgIHJvbGxzOiB0aGlzLnZlcmV0ZW5vUm9sbHNcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByb2xsRGF0YTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIERpZVJlc3VsdCB7XHJcbiAgICBhY3RpdmU6IGJvb2xlYW47XHJcbiAgICByZXN1bHQ6IG51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vRGllUmVzdWx0IHtcclxuICAgIHJlc3VsdDogbnVtYmVyO1xyXG4gICAgY2xhc3Nlczogc3RyaW5nO1xyXG59XHJcblxyXG5jbGFzcyBWZXJldGVub1Jlc3VsdCB7XHJcbiAgICB0b3RhbDogbnVtYmVyID0gMDtcclxuICAgIHN1Y2Nlc3NlczogbnVtYmVyID0gMDtcclxuICAgIGNyaXRGYWlsczogbnVtYmVyID0gMDtcclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vUm9sbFJlc3VsdCB7XHJcbiAgICBmb3JtdWxhOiBzdHJpbmc7XHJcbiAgICB0b3RhbDogbnVtYmVyO1xyXG4gICAgdmVyZXRlbm9Ub3RhbDogbnVtYmVyO1xyXG4gICAgdmVyZXRlbm9TdWNjZXNzZXM6IG51bWJlcjtcclxuICAgIHZlcmV0ZW5vQ3JpdEZhaWxzOiBudW1iZXI7XHJcbiAgICByb2xsczogVmVyZXRlbm9EaWVSZXN1bHRbXTtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9Sb2xsZXIgfSIsICJleHBvcnQgY2xhc3MgVmVyZXRlbm9Sb2xsRGlhbG9nIHtcclxuICAgIHRlbXBsYXRlOiBzdHJpbmcgPSAnc3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvY2hhdC9kaWFsb2cvcm9sbC1kaWFsb2cuaGJzJztcclxuXHJcbiAgICBhc3luYyBnZXRUYXNrQ2hlY2tPcHRpb25zKCk6IFByb21pc2U8VmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQ+IHtcclxuICAgICAgICBjb25zdCBodG1sID0gYXdhaXQgcmVuZGVyVGVtcGxhdGUodGhpcy50ZW1wbGF0ZSwge30pO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJcdTA0MUNcdTA0M0VcdTA0MzRcdTA0MzhcdTA0NDRcdTA0MzhcdTA0M0FcdTA0MzBcdTA0NDJcdTA0M0VcdTA0NDBcdTA0NEIgXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDQxXHUwNDNBXHUwNDMwXCIsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiBodG1sLFxyXG4gICAgICAgICAgICAgICAgYnV0dG9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vcm1hbDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJcdTA0MTRcdTA0MzBcdTA0M0JcdTA0MzVcdTA0MzVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGh0bWwgPT4gcmVzb2x2ZSh0aGlzLl9wcm9jZXNzVGFza0NoZWNrT3B0aW9ucygoaHRtbFswXSBhcyB1bmtub3duIGFzIEhUTUxBbmNob3JFbGVtZW50KS5xdWVyeVNlbGVjdG9yKFwiZm9ybVwiKSkpXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBjYW5jZWw6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiXHUwNDFFXHUwNDQyXHUwNDNDXHUwNDM1XHUwNDNEXHUwNDMwXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogXCJub3JtYWxcIixcclxuICAgICAgICAgICAgICAgIGNsb3NlOiAoKSA9PiByZXNvbHZlKHsgbW9kaWZpZXI6IDAsIGJsaW5kUm9sbDogZmFsc2UsIGNhbmNlbGxlZDogdHJ1ZSB9KVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgbmV3IERpYWxvZyhkYXRhKS5yZW5kZXIodHJ1ZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgX3Byb2Nlc3NUYXNrQ2hlY2tPcHRpb25zKGZvcm06IEpRdWVyeSk6IFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBtb2RpZmllcjogcGFyc2VJbnQoZm9ybS5tb2RpZmllci52YWx1ZSksXHJcbiAgICAgICAgICAgIGJsaW5kUm9sbDogZm9ybS5ibGluZFJvbGwuY2hlY2tlZCxcclxuICAgICAgICAgICAgY2FuY2VsbGVkOiBmYWxzZVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBWZXJldGVub1JvbGxEaWFsb2dBcmd1bWVudCB7XHJcbiAgICBtb2RpZmllcjogbnVtYmVyID0gMDtcclxuICAgIGJsaW5kUm9sbDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgY2FuY2VsbGVkOiBib29sZWFuID0gdHJ1ZTtcclxufSIsICJpbXBvcnQgeyBWZXJldGVub0NyZWF0dXJlIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQWN0b3JTaGVldCwgVmVyZXRlbm9BY3RvclNoZWV0RGF0YSB9IGZyb20gXCIuLi9iYXNlL3NoZWV0XCI7XHJcbmltcG9ydCB7IEF0dHJpYnV0ZVdpdGhTa2lsbHMsIEF0dHJpYnV0ZXNCbG9jaywgSXRlbUFjdGlvbkluZm8sIFNraWxsLCBTa2lsbHNCbG9jaywgU3RhdCwgU3RhdHNCbG9jaywgV2VhcG9uQXR0YWNrSW5mbyB9IGZyb20gXCIuL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9DaGF0T3B0aW9ucywgVmVyZXRlbm9NZXNzYWdlRGF0YSwgVmVyZXRlbm9Sb2xsRGF0YSwgVmVyZXRlbm9Sb2xsT3B0aW9ucywgVmVyZXRlbm9Sb2xsVHlwZSB9IGZyb20gXCIkbW9kdWxlL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9Sb2xsZXIgfSBmcm9tIFwiJG1vZHVsZS91dGlscy92ZXJldGVuby1yb2xsZXJcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9XZWFwb24gfSBmcm9tIFwiJG1vZHVsZS9pdGVtL3dlYXBvbi9kb2N1bWVudFwiO1xyXG5pbXBvcnQgeyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSwgVmVyZXRlbm9Bcm1vciwgVmVyZXRlbm9JdGVtIH0gZnJvbSBcIiRtb2R1bGUvaXRlbVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW1UeXBlIH0gZnJvbSBcIiRtb2R1bGUvaXRlbS9iYXNlL2RhdGFcIjtcclxuaW1wb3J0IHsgQXR0YWNrVHlwZSwgV2VhcG9uVHlwZSB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vd2VhcG9uL2RhdGFcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9Sb2xsRGlhbG9nLCBWZXJldGVub1JvbGxEaWFsb2dBcmd1bWVudCB9IGZyb20gXCIkbW9kdWxlL2RpYWxvZ1wiO1xyXG5cclxuYWJzdHJhY3QgY2xhc3MgVmVyZXRlbm9DcmVhdHVyZVNoZWV0PFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU+IGV4dGVuZHMgVmVyZXRlbm9BY3RvclNoZWV0PFRBY3Rvcj57XHJcbiAgICBvdmVycmlkZSBhc3luYyBnZXREYXRhKG9wdGlvbnM6IFBhcnRpYWw8RG9jdW1lbnRTaGVldE9wdGlvbnM+ID0ge30pOiBQcm9taXNlPFZlcmV0ZW5vQ3JlYXR1cmVTaGVldERhdGE8VEFjdG9yPj4ge1xyXG4gICAgICAgIGNvbnN0IHNoZWV0RGF0YSA9IGF3YWl0IHN1cGVyLmdldERhdGEob3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGZvciAobGV0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhhY3Rvci5TdGF0cykpIHtcclxuICAgICAgICAgICAgKHYgYXMgU3RhdCkubGFiZWwgPSBnYW1lLmkxOG4ubG9jYWxpemUoYHZlcmV0ZW5vLnN0YXQuJHtrfWApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKGFjdG9yLkF0dHJpYnV0ZXMpKSB7XHJcbiAgICAgICAgICAgICh2IGFzIEF0dHJpYnV0ZVdpdGhTa2lsbHMpLmxhYmVsID0gZ2FtZS5pMThuLmxvY2FsaXplKGB2ZXJldGVuby5hdHRyaWJ1dGUuJHtrfWApO1xyXG4gICAgICAgICAgICAodiBhcyBBdHRyaWJ1dGVXaXRoU2tpbGxzKS5za2lsbHMgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IFtrMSwgdjFdIG9mIE9iamVjdC5lbnRyaWVzKGFjdG9yLlNraWxscykuZmlsdGVyKHggPT4geFsxXS5hdHRyaWJ1dGUgPT09IGspKSB7XHJcbiAgICAgICAgICAgICAgICAodjEgYXMgU2tpbGwpLmxhYmVsID0gZ2FtZS5pMThuLmxvY2FsaXplKGB2ZXJldGVuby5za2lsbC4ke2sxfWApO1xyXG4gICAgICAgICAgICAgICAgKHYgYXMgQXR0cmlidXRlV2l0aFNraWxscykuc2tpbGxzW2sxXSA9IHYxO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBlcXVpcHBlZFdlYXBvbnMgPSBhY3Rvci5FcXVpcHBlZFdlYXBvbnMubWFwKHggPT4ge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHguV2VhcG9uVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBXZWFwb25UeXBlLkJyYXdsaW5nOlxyXG4gICAgICAgICAgICAgICAgICAgIHguc3lzdGVtW1wiaXNCcmF3bGluZ1wiXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBXZWFwb25UeXBlLk1lbGVlOlxyXG4gICAgICAgICAgICAgICAgICAgIHguc3lzdGVtW1wiaXNNZWxlZVwiXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBXZWFwb25UeXBlLlJhbmdlZDpcclxuICAgICAgICAgICAgICAgICAgICB4LnN5c3RlbVtcImlzUmFuZ2VkXCJdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHg7XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgLi4uc2hlZXREYXRhLFxyXG4gICAgICAgICAgICBzdGF0czogYWN0b3IuU3RhdHMsXHJcbiAgICAgICAgICAgIGF0dHJpYnV0ZXM6IGFjdG9yLkF0dHJpYnV0ZXMsXHJcbiAgICAgICAgICAgIHNraWxsczogYWN0b3IuU2tpbGxzLFxyXG4gICAgICAgICAgICBtYXhIcDogYWN0b3IuTWF4SHAsXHJcbiAgICAgICAgICAgIG1heFdwOiBhY3Rvci5NYXhXcCxcclxuICAgICAgICAgICAgd2VhcG9uczogYWN0b3IuV2VhcG9ucyxcclxuICAgICAgICAgICAgZXF1aXBwZWRXZWFwb25zOiBlcXVpcHBlZFdlYXBvbnMsXHJcbiAgICAgICAgICAgIGFybW9yczogYWN0b3IuQXJtb3JzLFxyXG4gICAgICAgICAgICBlcXVpcHBlZEFybW9yOiBhY3Rvci5FcXVpcHBlZEFybW9yLFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvdmVycmlkZSBhY3RpdmF0ZUxpc3RlbmVycygkaHRtbDogSlF1ZXJ5KTogdm9pZCB7XHJcbiAgICAgICAgc3VwZXIuYWN0aXZhdGVMaXN0ZW5lcnMoJGh0bWwpO1xyXG4gICAgICAgIGNvbnN0IGh0bWwgPSAkaHRtbFswXTtcclxuXHJcbiAgICAgICAgJGh0bWwub24oJ2NsaWNrJywgJy5za2lsbC1jaGVjaycsIHRoaXMuI29uU2tpbGxDaGVja1JvbGwuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgJGh0bWwub24oJ2NsaWNrJywgJy5pdGVtLWFjdGlvbicsIHRoaXMuI29uSXRlbUFjdGlvbi5iaW5kKHRoaXMpKTtcclxuICAgICAgICAkaHRtbC5vbignY2xpY2snLCAnLmFybW9yLWFjdGlvbicsIHRoaXMuI29uQXJtb3JBY3Rpb24uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgJGh0bWwub24oJ2NsaWNrJywgJy53ZWFwb24tYWN0aW9uJywgdGhpcy4jb25XZWFwb25BY3Rpb24uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIGh0bWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAnLml0ZW0tYWN0aW9uJywgdGhpcy4jb25JdGVtQWN0aW9uLmJpbmQodGhpcykpO1xyXG4gICAgICAgIC8vIGh0bWwub24oJ2NsaWNrJywgJy53ZWFwb24tYWN0aW9uJywgdGhpcy4jb25XZWFwb25BY3Rpb24uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgI29uU2tpbGxDaGVja1JvbGwoZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG4gICAgICAgIGNvbnN0IGRhdGFzZXQgPSAoZWxlbWVudCBhcyBIVE1MQW5jaG9yRWxlbWVudCk/LmRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGNvbnN0IHNob3dEaWFsb2cgPSAoQ09ORklHLlNFVFRJTkdTLlNob3dUYXNrQ2hlY2tPcHRpb25zICE9PSBldmVudC5jdHJsS2V5KTtcclxuICAgICAgICBsZXQgZGlhbG9nUmVzdWx0ID0gbmV3IFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50KCk7XHJcbiAgICAgICAgaWYgKHNob3dEaWFsb2cpIHtcclxuICAgICAgICAgICAgZGlhbG9nUmVzdWx0ID0gYXdhaXQgKG5ldyBWZXJldGVub1JvbGxEaWFsb2coKSkuZ2V0VGFza0NoZWNrT3B0aW9ucygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRpYWxvZ1Jlc3VsdC5jYW5jZWxsZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHsgbGFiZWwsIHJvbGxLZXksIHJvbGxUeXBlIH0gPSBkYXRhc2V0O1xyXG5cclxuICAgICAgICBpZiAocm9sbEtleSA9PSBudWxsIHx8IHJvbGxUeXBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJvbGxEYXRhID0gbmV3IFZlcmV0ZW5vUm9sbERhdGEoKTtcclxuICAgICAgICBpZiAocm9sbFR5cGUgPT0gXCJhdHRyaWJ1dGVcIikge1xyXG4gICAgICAgICAgICByb2xsRGF0YSA9IGF3YWl0IGFjdG9yLmdldEF0dHJpYnV0ZVJvbGxEYXRhKHJvbGxLZXkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJvbGxEYXRhID0gYXdhaXQgYWN0b3IuZ2V0U2tpbGxSb2xsRGF0YShyb2xsS2V5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJvbGxEYXRhLnBvb2wgKz0gZGlhbG9nUmVzdWx0Lm1vZGlmaWVyO1xyXG5cclxuXHJcbiAgICAgICAgbGV0IG1lc3NhZ2VEYXRhID0ge1xyXG4gICAgICAgICAgICB1c2VySWQ6IGdhbWUudXNlci5faWQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBzcGVha2VyOiBDaGF0TWVzc2FnZS5nZXRTcGVha2VyKCksXHJcbiAgICAgICAgICAgIGZsYXZvcjogbGFiZWwgfHwgJycsXHJcbiAgICAgICAgICAgIHNvdW5kOiBDT05GSUcuc291bmRzLmRpY2UsXHJcbiAgICAgICAgICAgIGJsaW5kOiBmYWxzZSB8fCBkaWFsb2dSZXN1bHQuYmxpbmRSb2xsIHx8IGV2ZW50LnNoaWZ0S2V5XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3Qgcm9sbE9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFZlcmV0ZW5vUm9sbFR5cGUuUmVndWxhcixcclxuICAgICAgICAgICAgbWVzc2FnZURhdGE6IG1lc3NhZ2VEYXRhLFxyXG4gICAgICAgICAgICByb2xsRGF0YTogcm9sbERhdGFcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJvbGxlciA9IG5ldyBWZXJldGVub1JvbGxlcigpO1xyXG4gICAgICAgIGF3YWl0IHJvbGxlci5yb2xsKHJvbGxPcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyAjb25XZWFwb25BY3Rpb24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG4gICAgICAgIGNvbnN0IGRhdGFzZXQgPSAoZWxlbWVudCBhcyBIVE1MQW5jaG9yRWxlbWVudCk/LmRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgaXRlbVR5cGUsIGFjdGlvblR5cGUsIGl0ZW1JZCwgd2VhcG9uVHlwZSwgYXR0YWNrVHlwZSB9ID0gZGF0YXNldDtcclxuXHJcbiAgICAgICAgaWYgKGl0ZW1JZCA9PSBudWxsIHx8IGl0ZW1JZCA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgY2hhdE9wdGlvbnM6IFZlcmV0ZW5vQ2hhdE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGlzQmxpbmQ6IGZhbHNlIHx8IGV2ZW50LnNoaWZ0S2V5LFxyXG4gICAgICAgICAgICBzaG93RGlhbG9nOiAoQ09ORklHLlNFVFRJTkdTLlNob3dUYXNrQ2hlY2tPcHRpb25zICE9PSBldmVudC5jdHJsS2V5KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFjdGlvblR5cGUgPT09ICdpbml0aWF0aXZlJykge1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yb2xsV2VhcG9uSW5pdGlhdGl2ZShpdGVtSWQsIGNoYXRPcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoYWN0aW9uVHlwZSA9PT0gJ2F0dGFjaycpIHtcclxuICAgICAgICAgICAgbGV0IHdlYXBvbkRhdGE6IFdlYXBvbkF0dGFja0luZm8gPSB7XHJcbiAgICAgICAgICAgICAgICBpZDogaXRlbUlkLFxyXG4gICAgICAgICAgICAgICAgd2VhcG9uVHlwZTogd2VhcG9uVHlwZSBhcyBXZWFwb25UeXBlLFxyXG4gICAgICAgICAgICAgICAgYXR0YWNrVHlwZTogYXR0YWNrVHlwZSBhcyBBdHRhY2tUeXBlXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yb2xsV2VhcG9uQXR0YWNrKHdlYXBvbkRhdGEsIGNoYXRPcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcm9sbFdlYXBvbkluaXRpYXRpdmUod2VhcG9uSWQ6IHN0cmluZywgY2hhdE9wdGlvbnM6IFZlcmV0ZW5vQ2hhdE9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgZGlhbG9nUmVzdWx0ID0gbmV3IFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50KCk7XHJcbiAgICAgICAgaWYgKGNoYXRPcHRpb25zLnNob3dEaWFsb2cpIHtcclxuICAgICAgICAgICAgZGlhbG9nUmVzdWx0ID0gYXdhaXQgKG5ldyBWZXJldGVub1JvbGxEaWFsb2coKSkuZ2V0VGFza0NoZWNrT3B0aW9ucygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRpYWxvZ1Jlc3VsdC5jYW5jZWxsZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbWVzc2FnZURhdGE6IFZlcmV0ZW5vTWVzc2FnZURhdGEgPSB7XHJcbiAgICAgICAgICAgIHVzZXJJZDogZ2FtZS51c2VyLl9pZCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIHNwZWFrZXI6IENoYXRNZXNzYWdlLmdldFNwZWFrZXIoKSxcclxuICAgICAgICAgICAgZmxhdm9yOiAnXHUwNDE4XHUwNDNEXHUwNDM4XHUwNDQ2XHUwNDM4XHUwNDMwXHUwNDQyXHUwNDM4XHUwNDMyXHUwNDMwJyxcclxuICAgICAgICAgICAgc291bmQ6IENPTkZJRy5zb3VuZHMuZGljZSxcclxuICAgICAgICAgICAgYmxpbmQ6IGNoYXRPcHRpb25zLmlzQmxpbmQgfHwgZGlhbG9nUmVzdWx0LmJsaW5kUm9sbFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCBpbml0aWF0aXZlUm9sbERhdGEgPSBhd2FpdCBhY3Rvci5nZXRJbml0aWF0aXZlUm9sbERhdGEod2VhcG9uSWQpO1xyXG4gICAgICAgIGlmIChpbml0aWF0aXZlUm9sbERhdGEgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbml0aWF0aXZlUm9sbERhdGEuYm9udXMgKz0gZGlhbG9nUmVzdWx0Lm1vZGlmaWVyO1xyXG5cclxuICAgICAgICBjb25zdCByb2xsT3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgdHlwZTogVmVyZXRlbm9Sb2xsVHlwZS5Jbml0aWF0aXZlLFxyXG4gICAgICAgICAgICBtZXNzYWdlRGF0YSxcclxuICAgICAgICAgICAgcm9sbERhdGE6IGluaXRpYXRpdmVSb2xsRGF0YVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdmVyZXRlbm9Sb2xsSGFuZGxlciA9IG5ldyBWZXJldGVub1JvbGxlcigpO1xyXG4gICAgICAgIGF3YWl0IHZlcmV0ZW5vUm9sbEhhbmRsZXIucm9sbEluaXRpYXRpdmUocm9sbE9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJvbGxXZWFwb25BdHRhY2sod2VhcG9uRGF0YTogV2VhcG9uQXR0YWNrSW5mbywgY2hhdE9wdGlvbnM6IFZlcmV0ZW5vQ2hhdE9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgZGlhbG9nUmVzdWx0ID0gbmV3IFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50KCk7XHJcbiAgICAgICAgaWYgKGNoYXRPcHRpb25zLnNob3dEaWFsb2cpIHtcclxuICAgICAgICAgICAgZGlhbG9nUmVzdWx0ID0gYXdhaXQgKG5ldyBWZXJldGVub1JvbGxEaWFsb2coKSkuZ2V0VGFza0NoZWNrT3B0aW9ucygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRpYWxvZ1Jlc3VsdC5jYW5jZWxsZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbWVzc2FnZURhdGE6IFZlcmV0ZW5vTWVzc2FnZURhdGEgPSB7XHJcbiAgICAgICAgICAgIHVzZXJJZDogZ2FtZS51c2VyLl9pZCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIHNwZWFrZXI6IENoYXRNZXNzYWdlLmdldFNwZWFrZXIoKSxcclxuICAgICAgICAgICAgZmxhdm9yOiB3ZWFwb25EYXRhLndlYXBvblR5cGUsXHJcbiAgICAgICAgICAgIHNvdW5kOiBDT05GSUcuc291bmRzLmRpY2UsXHJcbiAgICAgICAgICAgIGJsaW5kOiBjaGF0T3B0aW9ucy5pc0JsaW5kIHx8IGRpYWxvZ1Jlc3VsdC5ibGluZFJvbGxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQgd2VhcG9uUm9sbERhdGEgPSBhd2FpdCBhY3Rvci5nZXRXZWFwb25Sb2xsRGF0YSh3ZWFwb25EYXRhKTtcclxuICAgICAgICB3ZWFwb25Sb2xsRGF0YS5wb29sICs9IGRpYWxvZ1Jlc3VsdC5tb2RpZmllcjtcclxuXHJcbiAgICAgICAgY29uc3Qgcm9sbE9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFZlcmV0ZW5vUm9sbFR5cGUuQXR0YWNrLFxyXG4gICAgICAgICAgICBtZXNzYWdlRGF0YSxcclxuICAgICAgICAgICAgcm9sbERhdGE6IHdlYXBvblJvbGxEYXRhXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB2ZXJldGVub1JvbGxIYW5kbGVyID0gbmV3IFZlcmV0ZW5vUm9sbGVyKCk7XHJcbiAgICAgICAgYXdhaXQgdmVyZXRlbm9Sb2xsSGFuZGxlci5yb2xsKHJvbGxPcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyAjb25JdGVtQWN0aW9uKGV2ZW50OiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBjb25zdCBlbGVtZW50ID0gZXZlbnQuY3VycmVudFRhcmdldDtcclxuICAgICAgICBjb25zdCBkYXRhc2V0ID0gKGVsZW1lbnQgYXMgSFRNTEFuY2hvckVsZW1lbnQpPy5kYXRhc2V0O1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW1UeXBlLCBhY3Rpb25UeXBlLCBpdGVtSWQgfSA9IGRhdGFzZXQ7XHJcbiAgICAgICAgY29uc3QgaXRlbUluZm86IEl0ZW1BY3Rpb25JbmZvID0geyB0eXBlOiAoaXRlbVR5cGUhIGFzIFZlcmV0ZW5vSXRlbVR5cGUpLCBpZDogaXRlbUlkISB9O1xyXG5cclxuICAgICAgICBzd2l0Y2ggKGFjdGlvblR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAncmVtb3ZlJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJlbW92ZUl0ZW0oaXRlbUluZm8pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdlcXVpcCc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5lcXVpcEl0ZW0oaXRlbUluZm8pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICd1bmVxdWlwJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnVuZXF1aXBJdGVtKGl0ZW1JbmZvKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVtb3ZlSXRlbShpdGVtSW5mbzogSXRlbUFjdGlvbkluZm8pOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5hY3Rvci5pdGVtcy5nZXQoaXRlbUluZm8uaWQpO1xyXG4gICAgICAgIGlmICghaXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFjdG9yLmRlbGV0ZUVtYmVkZGVkRG9jdW1lbnRzKFwiSXRlbVwiLCBbaXRlbS5faWQhXSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXF1aXBJdGVtKGl0ZW1JbmZvOiBJdGVtQWN0aW9uSW5mbyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHN3aXRjaCAoaXRlbUluZm8udHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlICd3ZWFwb24nOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZXF1aXBXZWFwb24oaXRlbUluZm8uaWQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdhcm1vcic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5lcXVpcEFybW9yKGl0ZW1JbmZvLmlkKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXF1aXBXZWFwb24oaXRlbUlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5hY3Rvci5pdGVtcy5maW5kKHggPT4geC5faWQgPT09IGl0ZW1JZCk7XHJcbiAgICAgICAgaWYgKCFpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQ0M1x1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNlx1MDQzNFx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSwgXHUwNDM1XHUwNDQxXHUwNDNCXHUwNDM4IFx1MDQ0RFx1MDQzQVx1MDQzOFx1MDQzRlx1MDQzOFx1MDQ0MFx1MDQzRVx1MDQzMlx1MDQzMFx1MDQzRFx1MDQzRSBcdTA0MzFcdTA0M0VcdTA0M0JcdTA0NENcdTA0NDhcdTA0MzUgMiBcdTA0NERcdTA0M0JcdTA0MzVcdTA0M0NcdTA0MzVcdTA0M0RcdTA0NDJcdTA0M0VcdTA0MzIgXHUwNDNFXHUwNDQwXHUwNDQzXHUwNDM2XHUwNDM4XHUwNDRGLlxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLmFjdG9yLnVwZGF0ZUVtYmVkZGVkRG9jdW1lbnRzKFwiSXRlbVwiLCBbXHJcbiAgICAgICAgICAgIHsgX2lkOiBpdGVtLl9pZCEsIFwic3lzdGVtLmlzRXF1aXBwZWRcIjogdHJ1ZSB9LFxyXG4gICAgICAgIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGVxdWlwQXJtb3IoaXRlbUlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBlcXVpcHBlZEFybW9yID0gdGhpcy5hY3Rvci5pdGVtcy5maW5kKHggPT4gKHggYXMgdW5rbm93biBhcyBWZXJldGVub0FybW9yKS5zeXN0ZW0uaXNFcXVpcHBlZCAmJiB4LnR5cGUgPT09IFZlcmV0ZW5vSXRlbVR5cGUuQXJtb3IpO1xyXG4gICAgICAgIGlmIChlcXVpcHBlZEFybW9yKSB7XHJcbiAgICAgICAgICAgIC8vIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQ0M1x1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNlx1MDQzNFx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSwgXHUwNDM1XHUwNDQxXHUwNDNCXHUwNDM4IFx1MDQzMVx1MDQ0MFx1MDQzRVx1MDQzRFx1MDQ0RiBcdTA0NDNcdTA0MzZcdTA0MzUgXHUwNDREXHUwNDNBXHUwNDM4XHUwNDNGXHUwNDM4XHUwNDQwXHUwNDNFXHUwNDMyXHUwNDMwXHUwNDNEXHUwNDMwLlxyXG5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuYWN0b3IuaXRlbXMuZmluZCh4ID0+IHguX2lkID09PSBpdGVtSWQpO1xyXG4gICAgICAgIGlmICghaXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLmFjdG9yLnVwZGF0ZUVtYmVkZGVkRG9jdW1lbnRzKFwiSXRlbVwiLCBbXHJcbiAgICAgICAgICAgIHsgX2lkOiBpdGVtLl9pZCEsIFwic3lzdGVtLmlzRXF1aXBwZWRcIjogdHJ1ZSB9LFxyXG4gICAgICAgIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHVuZXF1aXBJdGVtKGl0ZW1JbmZvOiBJdGVtQWN0aW9uSW5mbyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmFjdG9yLml0ZW1zLmZpbmQoeCA9PiB4Ll9pZCA9PT0gaXRlbUluZm8uaWRcclxuICAgICAgICAgICAgJiYgKHggYXMgdW5rbm93biBhcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbSkuc3lzdGVtXHJcbiAgICAgICAgICAgICYmICh4IGFzIHVua25vd24gYXMgUGh5c2ljYWxWZXJldGVub0l0ZW0pLnN5c3RlbS5pc0VxdWlwcGVkXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKCFpdGVtKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMuYWN0b3IudXBkYXRlRW1iZWRkZWREb2N1bWVudHMoXCJJdGVtXCIsIFtcclxuICAgICAgICAgICAgeyBfaWQ6IGl0ZW0uX2lkISwgXCJzeXN0ZW0uaXNFcXVpcHBlZFwiOiBmYWxzZSB9LFxyXG4gICAgICAgIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jICNvbkFybW9yQWN0aW9uKGV2ZW50OiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBjb25zdCBlbGVtZW50ID0gZXZlbnQuY3VycmVudFRhcmdldDtcclxuICAgICAgICBjb25zdCBkYXRhc2V0ID0gKGVsZW1lbnQgYXMgSFRNTEFuY2hvckVsZW1lbnQpPy5kYXRhc2V0O1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW1UeXBlLCBhY3Rpb25UeXBlLCBpdGVtSWQgfSA9IGRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGNvbnN0IGNoYXRPcHRpb25zOiBWZXJldGVub0NoYXRPcHRpb25zID0ge1xyXG4gICAgICAgICAgICBpc0JsaW5kOiBmYWxzZSB8fCBldmVudC5zaGlmdEtleSxcclxuICAgICAgICAgICAgc2hvd0RpYWxvZzogKENPTkZJRy5TRVRUSU5HUy5TaG93VGFza0NoZWNrT3B0aW9ucyAhPT0gZXZlbnQuY3RybEtleSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpdGVtSWQgPT0gbnVsbCB8fCBpdGVtSWQgPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VEYXRhID0ge1xyXG4gICAgICAgICAgICB1c2VySWQ6IGdhbWUudXNlci5faWQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBzcGVha2VyOiBDaGF0TWVzc2FnZS5nZXRTcGVha2VyKCksXHJcbiAgICAgICAgICAgIGZsYXZvcjogJycsXHJcbiAgICAgICAgICAgIHNvdW5kOiBDT05GSUcuc291bmRzLmRpY2UsXHJcbiAgICAgICAgICAgIGJsaW5kOiBmYWxzZVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHN3aXRjaCAoYWN0aW9uVHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlICdibG9jayc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yb2xsQXJtb3JCbG9jayhpdGVtSWQsIGNoYXRPcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdhYmxhdGUnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuYWJsYXRlQXJtb3IoaXRlbUlkKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdyZXBhaXInOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVwYWlyQXJtb3IoaXRlbUlkKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByb2xsQXJtb3JCbG9jayhhcm1vcklkOiBzdHJpbmcsIGNoYXRPcHRpb25zOiBWZXJldGVub0NoYXRPcHRpb25zKSB7XHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGRpYWxvZ1Jlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEaWFsb2dBcmd1bWVudCgpO1xyXG4gICAgICAgIGlmIChjaGF0T3B0aW9ucy5zaG93RGlhbG9nKSB7XHJcbiAgICAgICAgICAgIGRpYWxvZ1Jlc3VsdCA9IGF3YWl0IChuZXcgVmVyZXRlbm9Sb2xsRGlhbG9nKCkpLmdldFRhc2tDaGVja09wdGlvbnMoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkaWFsb2dSZXN1bHQuY2FuY2VsbGVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VEYXRhOiBWZXJldGVub01lc3NhZ2VEYXRhID0ge1xyXG4gICAgICAgICAgICB1c2VySWQ6IGdhbWUudXNlci5faWQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBzcGVha2VyOiBDaGF0TWVzc2FnZS5nZXRTcGVha2VyKCksXHJcbiAgICAgICAgICAgIGZsYXZvcjogJ1x1MDQxN1x1MDQzMFx1MDQ0OVx1MDQzOFx1MDQ0Mlx1MDQzMCcsXHJcbiAgICAgICAgICAgIHNvdW5kOiBDT05GSUcuc291bmRzLmRpY2UsXHJcbiAgICAgICAgICAgIGJsaW5kOiBjaGF0T3B0aW9ucy5pc0JsaW5kIHx8IGRpYWxvZ1Jlc3VsdC5ibGluZFJvbGxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQgYXJtb3JSb2xsRGF0YSA9IGF3YWl0IGFjdG9yLmdldEFybW9yUm9sbERhdGEoYXJtb3JJZCk7XHJcbiAgICAgICAgaWYgKGFybW9yUm9sbERhdGEgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcm1vclJvbGxEYXRhLnBvb2wgKz0gZGlhbG9nUmVzdWx0Lm1vZGlmaWVyO1xyXG5cclxuICAgICAgICBjb25zdCByb2xsT3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgdHlwZTogVmVyZXRlbm9Sb2xsVHlwZS5Bcm1vckJsb2NrLFxyXG4gICAgICAgICAgICBtZXNzYWdlRGF0YSxcclxuICAgICAgICAgICAgcm9sbERhdGE6IGFybW9yUm9sbERhdGFcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyb2xsT3B0aW9ucy5yb2xsRGF0YS5wb29sID09IDApIHtcclxuICAgICAgICAgICAgLy8gXHUwNDQxXHUwNDNFXHUwNDNFXHUwNDMxXHUwNDQ5XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1IFx1MDQzRSBcdTA0NDBcdTA0MzBcdTA0MzdcdTA0MzFcdTA0MzhcdTA0NDJcdTA0M0VcdTA0MzkgXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDNEXHUwNDM1LlxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB2ZXJldGVub1JvbGxIYW5kbGVyID0gbmV3IFZlcmV0ZW5vUm9sbGVyKCk7XHJcbiAgICAgICAgYXdhaXQgdmVyZXRlbm9Sb2xsSGFuZGxlci5yb2xsKHJvbGxPcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBhYmxhdGVBcm1vcihhcm1vcklkOiBzdHJpbmcsIHZhbHVlOiBudW1iZXIgPSAxKSB7XHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHZhbHVlIDwgMSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBhcm1vciA9ICh0aGlzLmFjdG9yLml0ZW1zLmZpbmQoeCA9PiB4Ll9pZCA9PT0gYXJtb3JJZCkgYXMgdW5rbm93biBhcyBWZXJldGVub0FybW9yKTtcclxuICAgICAgICBpZiAoIWFybW9yKSB7XHJcbiAgICAgICAgICAgIC8vIFx1MDQ0MVx1MDQzRVx1MDQzRVx1MDQzMVx1MDQ0OVx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSBcdTA0M0VcdTA0MzEgXHUwNDNFXHUwNDQxXHUwNDQyXHUwNDQzXHUwNDQyXHUwNDQxXHUwNDQyXHUwNDMyXHUwNDQzXHUwNDRFXHUwNDQ5XHUwNDM1XHUwNDNDIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQzQ1x1MDQzNVx1MDQ0Mlx1MDQzNS5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFybW9yLnN5c3RlbS5kdXJhYmlsaXR5ID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQ0M1x1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNlx1MDQzNFx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSBcdTA0M0UgXHUwNDQwXHUwNDMwXHUwNDM3XHUwNDMxXHUwNDM4XHUwNDQyXHUwNDNFXHUwNDM5IFx1MDQzMVx1MDQ0MFx1MDQzRVx1MDQzRFx1MDQzNS5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgLT0gdmFsdWU7XHJcblxyXG4gICAgICAgIGlmIChhcm1vci5zeXN0ZW0uZHVyYWJpbGl0eSA8IDApIHtcclxuICAgICAgICAgICAgYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGFybW9yLnN5c3RlbS5kdXJhYmlsaXR5ID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQ0M1x1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNlx1MDQzNFx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSBcdTA0M0UgXHUwNDQwXHUwNDMwXHUwNDM3XHUwNDMxXHUwNDM4XHUwNDQyXHUwNDNFXHUwNDM5IFx1MDQzMVx1MDQ0MFx1MDQzRVx1MDQzRFx1MDQzNS5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMuYWN0b3IudXBkYXRlRW1iZWRkZWREb2N1bWVudHMoXCJJdGVtXCIsIFtcclxuICAgICAgICAgICAgeyBfaWQ6IGFybW9yLl9pZCEsIFwic3lzdGVtLmR1cmFiaWxpdHlcIjogYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgfSxcclxuICAgICAgICBdKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZXBhaXJBcm1vcihhcm1vcklkOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBhcm1vciA9ICh0aGlzLmFjdG9yLml0ZW1zLmZpbmQoeCA9PiB4Ll9pZCA9PT0gYXJtb3JJZCkgYXMgdW5rbm93biBhcyBWZXJldGVub0FybW9yKTtcclxuICAgICAgICBpZiAoIWFybW9yKSB7XHJcbiAgICAgICAgICAgIC8vIFx1MDQ0MVx1MDQzRVx1MDQzRVx1MDQzMVx1MDQ0OVx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSBcdTA0M0VcdTA0MzEgXHUwNDNFXHUwNDQxXHUwNDQyXHUwNDQzXHUwNDQyXHUwNDQxXHUwNDQyXHUwNDMyXHUwNDQzXHUwNDRFXHUwNDQ5XHUwNDM1XHUwNDNDIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQzQ1x1MDQzNVx1MDQ0Mlx1MDQzNVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbWF4RHVyYWJpbGl0eSA9IGFybW9yLnN5c3RlbS5hcm1vckNsYXNzICsgYXJtb3Iuc3lzdGVtLnF1YWxpdHlcclxuICAgICAgICBpZiAoYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgPT09IG1heER1cmFiaWxpdHkpIHtcclxuICAgICAgICAgICAgLy8gXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM0XHUwNDQzXHUwNDNGXHUwNDQwXHUwNDM1XHUwNDM2XHUwNDM0XHUwNDM1XHUwNDNEXHUwNDM4XHUwNDM1IFx1MDQzRSBcdTA0NDZcdTA0MzVcdTA0M0JcdTA0M0VcdTA0MzkgXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDNEXHUwNDM1LlxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5hY3Rvci51cGRhdGVFbWJlZGRlZERvY3VtZW50cyhcIkl0ZW1cIiwgW1xyXG4gICAgICAgICAgICB7IF9pZDogYXJtb3IuX2lkISwgXCJzeXN0ZW0uZHVyYWJpbGl0eVwiOiBtYXhEdXJhYmlsaXR5IH0sXHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0NyZWF0dXJlU2hlZXREYXRhPFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU+IGV4dGVuZHMgVmVyZXRlbm9BY3RvclNoZWV0RGF0YTxUQWN0b3I+IHtcclxuICAgIHN0YXRzOiBTdGF0c0Jsb2NrO1xyXG4gICAgYXR0cmlidXRlczogQXR0cmlidXRlc0Jsb2NrO1xyXG4gICAgc2tpbGxzOiBTa2lsbHNCbG9jaztcclxuICAgIG1heEhwOiBudW1iZXI7XHJcbiAgICBtYXhXcDogbnVtYmVyO1xyXG4gICAgd2VhcG9uczogVmVyZXRlbm9XZWFwb25bXTtcclxuICAgIGVxdWlwcGVkV2VhcG9uczogVmVyZXRlbm9XZWFwb25bXTtcclxuICAgIGFybW9yczogVmVyZXRlbm9Bcm1vcltdO1xyXG4gICAgZXF1aXBwZWRBcm1vcjogVmVyZXRlbm9Bcm1vcjtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9DcmVhdHVyZVNoZWV0IH1cclxuZXhwb3J0IHR5cGUgeyBWZXJldGVub0NyZWF0dXJlU2hlZXREYXRhIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9DaGFyYWN0ZXIgfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9DcmVhdHVyZVNoZWV0LCBWZXJldGVub0NyZWF0dXJlU2hlZXREYXRhIH0gZnJvbSBcIi4uL2NyZWF0dXJlL3NoZWV0XCI7XHJcblxyXG5jbGFzcyBWZXJldGVub0NoYXJhY3RlclNoZWV0PFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vQ2hhcmFjdGVyPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmVTaGVldDxUQWN0b3I+e1xyXG4gICAgc3RhdGljIG92ZXJyaWRlIGdldCBkZWZhdWx0T3B0aW9ucygpOiBBY3RvclNoZWV0T3B0aW9ucyB7XHJcbiAgICAgICAgY29uc3Qgc3VwZXJPcHRpb25zID0gc3VwZXIuZGVmYXVsdE9wdGlvbnM7XHJcbiAgICAgICAgY29uc3QgbWVyZ2VkT2JqZWN0ID0gbWVyZ2VPYmplY3Qoc3VwZXJPcHRpb25zLCB7XHJcbiAgICAgICAgICAgIHdpZHRoOiA1NjAsXHJcbiAgICAgICAgICAgIGNsYXNzZXM6IFsuLi5zdXBlck9wdGlvbnMuY2xhc3NlcywgJ2NoYXJhY3Rlci1zaGVldCddLFxyXG4gICAgICAgICAgICB0YWJzOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmF2U2VsZWN0b3I6IFwiLnNoZWV0LXRhYnNcIixcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50U2VsZWN0b3I6IFwiLnNoZWV0LWJvZHlcIixcclxuICAgICAgICAgICAgICAgICAgICBpbml0aWFsOiBcIm1haW5cIixcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG1lcmdlZE9iamVjdDtcclxuICAgIH1cclxuXHJcbiAgICBvdmVycmlkZSBhc3luYyBnZXREYXRhKG9wdGlvbnM6IFBhcnRpYWw8RG9jdW1lbnRTaGVldE9wdGlvbnM+ID0ge30pOiBQcm9taXNlPFZlcmV0ZW5vQ2hhcmFjdGVyU2hlZXREYXRhPFRBY3Rvcj4+IHtcclxuICAgICAgICBjb25zdCBzaGVldERhdGEgPSBhd2FpdCBzdXBlci5nZXREYXRhKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAuLi5zaGVldERhdGEsXHJcbiAgICAgICAgICAgIG1vbmV5OiBhY3Rvci5Nb25leSxcclxuICAgICAgICAgICAgcmVwdXRhdGlvbjogYWN0b3IuUmVwdXRhdGlvbixcclxuICAgICAgICAgICAgZXhwOiBhY3Rvci5FeHBcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB0ZW1wbGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gYHN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9hY3RvcnMvY2hhcmFjdGVyLXNoZWV0Lmhic2A7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0NoYXJhY3RlclNoZWV0RGF0YTxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub0NoYXJhY3Rlcj4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlU2hlZXREYXRhPFRBY3Rvcj4ge1xyXG4gICAgbW9uZXk6IG51bWJlcjtcclxuICAgIHJlcHV0YXRpb246IG51bWJlcjtcclxuICAgIGV4cDogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0NoYXJhY3RlclNoZWV0IH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9Nb25zdGVyIH0gZnJvbSBcIi4uXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmVTaGVldCB9IGZyb20gXCIuLi9jcmVhdHVyZS9zaGVldFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9Nb25zdGVyU2hlZXQ8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9Nb25zdGVyPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmVTaGVldDxUQWN0b3I+e1xyXG5cclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9Nb25zdGVyU2hlZXQgfSIsICJpbXBvcnQgeyBWZXJldGVub05wYyB9IGZyb20gXCIuLlwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0NyZWF0dXJlU2hlZXQgfSBmcm9tIFwiLi4vY3JlYXR1cmUvc2hlZXRcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vTnBjU2hlZXQ8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9OcGM+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZVNoZWV0PFRBY3Rvcj57XHJcblxyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub05wY1NoZWV0IH0iLCAiZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyU2V0dGluZ3MoKTogdm9pZCB7XHJcbiAgICBnYW1lLnNldHRpbmdzLnJlZ2lzdGVyKFwidmVyZXRlbm9cIiwgXCJ2aXNpYmlsaXR5LnNob3dUYXNrQ2hlY2tPcHRpb25zXCIsIHtcclxuICAgICAgICBuYW1lOiBcInZlcmV0ZW5vLnNldHRpbmdzLnNob3dUYXNrQ2hlY2tPcHRpb25zLm5hbWVcIixcclxuICAgICAgICBoaW50OiBcInZlcmV0ZW5vLnNldHRpbmdzLnNob3dUYXNrQ2hlY2tPcHRpb25zLmhpbnRcIixcclxuICAgICAgICBzY29wZTogXCJjbGllbnRcIixcclxuICAgICAgICBjb25maWc6IHRydWUsXHJcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcclxuICAgICAgICB0eXBlOiBCb29sZWFuXHJcbiAgICB9KTtcclxufSIsICJjbGFzcyBWZXJldGVub0NsaWVudFNldHRpbmdzIHtcclxuICAgIGdldCBTaG93VGFza0NoZWNrT3B0aW9ucygpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gZ2FtZS5zZXR0aW5ncy5nZXQoXCJ2ZXJldGVub1wiLCBcInZpc2liaWxpdHkuc2hvd1Rhc2tDaGVja09wdGlvbnNcIikgYXMgYm9vbGVhbjtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQ2xpZW50U2V0dGluZ3Mge1xyXG4gICAgU2hvd1Rhc2tDaGVja09wdGlvbnM6IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQ2xpZW50U2V0dGluZ3MgfTsiLCAiaW1wb3J0IHsgVmVyZXRlbm9Bcm1vclNoZWV0IH0gZnJvbSAnJG1vZHVsZS9pdGVtL2FybW9yL3NoZWV0JztcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtU2hlZXQgfSBmcm9tICckbW9kdWxlL2l0ZW0vYmFzZS9zaGVldCc7XHJcbmltcG9ydCB7IFZFUkVURU5PQ09ORklHIH0gZnJvbSAnLi4vLi4vdmVyZXRlbm9Db25maWcnO1xyXG5pbXBvcnQgeyBWRVJFVEVOT19QQVJUSUFMUyB9IGZyb20gJy4uLy4uL3BhcnRpYWxzJztcclxuaW1wb3J0IHsgVmVyZXRlbm9XZWFwb25TaGVldCB9IGZyb20gJyRtb2R1bGUvaXRlbS93ZWFwb24vc2hlZXQnO1xyXG5pbXBvcnQgeyBWZXJldGVub0NoYXJhY3RlclNoZWV0IH0gZnJvbSAnJG1vZHVsZS9hY3Rvci9jaGFyYWN0ZXIvc2hlZXQnO1xyXG5pbXBvcnQgeyBWZXJldGVub01vbnN0ZXJTaGVldCB9IGZyb20gJyRtb2R1bGUvYWN0b3IvbW9uc3Rlci9zaGVldCc7XHJcbmltcG9ydCB7IFZlcmV0ZW5vTnBjU2hlZXQgfSBmcm9tICckbW9kdWxlL2FjdG9yL25wYy9zaGVldCc7XHJcbmltcG9ydCB7IHJlZ2lzdGVyU2V0dGluZ3MgfSBmcm9tICckbW9kdWxlL3N5c3RlbS9zZXR0aW5ncyc7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ2xpZW50U2V0dGluZ3MgfSBmcm9tICckbW9kdWxlL3N5c3RlbS9zZXR0aW5ncy9jbGllbnQtc2V0dGluZ3MnO1xyXG5cclxuZnVuY3Rpb24gcHJlbG9hZEhhbmRsZWJhcnNUZW1wbGF0ZXMoKSB7XHJcbiAgICByZXR1cm4gbG9hZFRlbXBsYXRlcyhWRVJFVEVOT19QQVJUSUFMUyk7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBJbml0ID0ge1xyXG4gICAgbGlzdGVuKCk6IHZvaWQge1xyXG4gICAgICAgIEhvb2tzLm9uY2UoJ2luaXQnLCBhc3luYyBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVmVyZXRlbm8gfCBTeXN0ZW0gaW5pdCBiZWdpbi5cIik7XHJcblxyXG4gICAgICAgICAgICBDT05GSUcuVkVSRVRFTk8gPSBWRVJFVEVOT0NPTkZJRztcclxuICAgICAgICAgICAgQ09ORklHLlNFVFRJTkdTID0gbmV3IFZlcmV0ZW5vQ2xpZW50U2V0dGluZ3MoKTtcclxuXHJcbiAgICAgICAgICAgIEFjdG9ycy51bnJlZ2lzdGVyU2hlZXQoJ2NvcmUnLCBBY3RvclNoZWV0KTtcclxuICAgICAgICAgICAgQWN0b3JzLnJlZ2lzdGVyU2hlZXQoJ3ZlcmV0ZW5vJywgVmVyZXRlbm9DaGFyYWN0ZXJTaGVldCwge1xyXG4gICAgICAgICAgICAgICAgdHlwZXM6IFsnY2hhcmFjdGVyJ10sXHJcbiAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgQWN0b3JzLnJlZ2lzdGVyU2hlZXQoJ3ZlcmV0ZW5vJywgVmVyZXRlbm9Nb25zdGVyU2hlZXQsIHtcclxuICAgICAgICAgICAgICAgIHR5cGVzOiBbJ21vbnN0ZXInXSxcclxuICAgICAgICAgICAgICAgIG1ha2VEZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBBY3RvcnMucmVnaXN0ZXJTaGVldCgndmVyZXRlbm8nLCBWZXJldGVub05wY1NoZWV0LCB7XHJcbiAgICAgICAgICAgICAgICB0eXBlczogWyducGMnXSxcclxuICAgICAgICAgICAgICAgIG1ha2VEZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgSXRlbXMudW5yZWdpc3RlclNoZWV0KCdjb3JlJywgSXRlbVNoZWV0KTtcclxuICAgICAgICAgICAgSXRlbXMucmVnaXN0ZXJTaGVldCgndmVyZXRlbm8nLCBWZXJldGVub0l0ZW1TaGVldCwge1xyXG4gICAgICAgICAgICAgICAgbWFrZURlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIEl0ZW1zLnJlZ2lzdGVyU2hlZXQoJ3ZlcmV0ZW5vJywgVmVyZXRlbm9Bcm1vclNoZWV0LCB7XHJcbiAgICAgICAgICAgICAgICB0eXBlczogWydhcm1vciddLFxyXG4gICAgICAgICAgICAgICAgbWFrZURlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIEl0ZW1zLnJlZ2lzdGVyU2hlZXQoJ3ZlcmV0ZW5vJywgVmVyZXRlbm9XZWFwb25TaGVldCwge1xyXG4gICAgICAgICAgICAgICAgdHlwZXM6IFsnd2VhcG9uJ10sXHJcbiAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHByZWxvYWRIYW5kbGViYXJzVGVtcGxhdGVzKCk7XHJcblxyXG4gICAgICAgICAgICByZWdpc3RlclNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlZlcmV0ZW5vIHwgU3lzdGVtIGluaXQgZG9uZS5cIik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbiIsICJpbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIiRtb2R1bGUvYWN0b3JcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBWZXJldGVub0FjdG9yczxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub0FjdG9yPG51bGw+PiBleHRlbmRzIEFjdG9yczxUQWN0b3I+IHtcclxuXHJcbn0iLCAiaW1wb3J0IHsgVmVyZXRlbm9BY3RvclByb3h5IH0gZnJvbSBcIiRtb2R1bGUvYWN0b3IvYmFzZS9kb2N1bWVudFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FjdG9ycyB9IGZyb20gXCIkbW9kdWxlL2NvbGxlY3Rpb25cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtUHJveHkgfSBmcm9tIFwiJG1vZHVsZS9pdGVtL2Jhc2UvZG9jdW1lbnRcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9Sb2xsIH0gZnJvbSBcIiRtb2R1bGUvc3lzdGVtL3JvbGxcIjtcclxuXHJcbmV4cG9ydCBjb25zdCBMb2FkID0ge1xyXG4gICAgbGlzdGVuKCk6IHZvaWQge1xyXG4gICAgICAgIENPTkZJRy5BY3Rvci5jb2xsZWN0aW9uID0gVmVyZXRlbm9BY3RvcnM7XHJcbiAgICAgICAgQ09ORklHLkFjdG9yLmRvY3VtZW50Q2xhc3MgPSBWZXJldGVub0FjdG9yUHJveHk7XHJcbiAgICAgICAgQ09ORklHLkl0ZW0uZG9jdW1lbnRDbGFzcyA9IFZlcmV0ZW5vSXRlbVByb3h5O1xyXG5cclxuICAgICAgICBDT05GSUcuRGljZS5yb2xscy5wdXNoKFZlcmV0ZW5vUm9sbCk7XHJcbiAgICB9XHJcbn0iLCAiaW1wb3J0IHsgSW5pdCB9IGZyb20gJy4vaW5pdCc7XHJcbmltcG9ydCB7IExvYWQgfSBmcm9tICcuL2xvYWQnO1xyXG5cclxuZXhwb3J0IGNvbnN0IEhvb2tzVmVyZXRlbm8gPSB7XHJcbiAgICBsaXN0ZW4oKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgbGlzdGVuZXJzOiB7IGxpc3RlbigpOiB2b2lkIH1bXSA9IFtcclxuICAgICAgICAgICAgSW5pdCxcclxuICAgICAgICAgICAgTG9hZCxcclxuICAgICAgICBdO1xyXG4gICAgICAgIGZvciAoY29uc3QgTGlzdGVuZXIgb2YgbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgICAgIExpc3RlbmVyLmxpc3RlbigpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbn07XHJcbiIsICJpbXBvcnQgeyBIb29rc1ZlcmV0ZW5vIH0gZnJvbSAnLi9zY3JpcHRzL2hvb2tzL2luZGV4JztcclxuXHJcbkhvb2tzVmVyZXRlbm8ubGlzdGVuKCk7Il0sCiAgIm1hcHBpbmdzIjogIjs7O0FBRUEsTUFBTSxvQkFBTixjQUE0RCxVQUFpQjtBQUFBLElBQ3pFLElBQUksV0FBVztBQUNYLGFBQU8sS0FBSyxLQUFLO0FBQUEsSUFDckI7QUFBQSxJQUVBLElBQUksaUJBQWlCO0FBQ2pCLGFBQU8sS0FBSyxLQUFLO0FBQUEsSUFDckI7QUFBQSxJQUVBLFdBQVcsaUJBQWlCO0FBQ3hCLFlBQU0sb0JBQW9CLEtBQUssU0FBUyxJQUFJLFFBQVEsVUFBVSxLQUFLO0FBRW5FLFlBQU0sVUFBVSxZQUFZLE1BQU0sZ0JBQWdCO0FBQUEsUUFDOUMsT0FBTztBQUFBLFFBQ1AsU0FBUyxDQUFDLFlBQVksUUFBUSxPQUFPO0FBQUEsTUFDekMsQ0FBQztBQUNELFVBQUcsbUJBQWtCO0FBQ2pCLGdCQUFRLFFBQVEsS0FBSyxTQUFTO0FBQUEsTUFDbEM7QUFFQSxhQUFPO0FBQUEsSUFDWDtBQUFBLElBRUEsSUFBSSxXQUFXO0FBQ1gsYUFBTywyQ0FBMkMsS0FBSyxLQUFLLElBQUk7QUFBQSxJQUNwRTtBQUFBLElBRUEsTUFBZSxRQUFRLFVBQXlDLENBQUMsR0FBMEM7QUFDdkcsY0FBUSxLQUFLLEtBQUs7QUFDbEIsY0FBUSxXQUFXLEtBQUs7QUFFeEIsWUFBTSxFQUFFLEtBQUssSUFBSTtBQUdqQixZQUFNLGtCQUEwQyxDQUFDO0FBQ2pELFlBQU0sV0FBVyxFQUFFLEdBQUcsS0FBSyxLQUFLLFlBQVksR0FBRyxHQUFHLEtBQUssT0FBTyxZQUFZLEVBQUU7QUFFNUUsYUFBTztBQUFBLFFBQ0gsVUFBVTtBQUFBLFFBQ1Y7QUFBQSxRQUNBLE1BQU0sS0FBSztBQUFBLFFBQ1gsWUFBWTtBQUFBLFFBQ1osYUFBYSxLQUFLO0FBQUEsUUFDbEIsVUFBVSxLQUFLLGFBQWEsYUFBYTtBQUFBLFFBQ3pDLFVBQVUsS0FBSztBQUFBLFFBQ2YsVUFBVTtBQUFBLFFBQ1YsU0FBUyxLQUFLLEtBQUs7QUFBQSxRQUNuQixTQUFTLEtBQUs7QUFBQSxRQUNkLE9BQU8sS0FBSyxLQUFLO0FBQUEsUUFDakIsT0FBTyxLQUFLO0FBQUEsTUFDaEI7QUFBQSxJQUNKO0FBQUEsSUFFQSxNQUF5QixjQUFjLE9BQWMsVUFBa0Q7QUFDbkcsYUFBTyxNQUFNLGNBQWMsT0FBTyxRQUFRO0FBQUEsSUFDOUM7QUFBQSxFQUNKOzs7QUN2REEsTUFBTSwyQkFBTixjQUEyRSxrQkFBeUI7QUFBQSxJQUNoRyxNQUFlLFFBQVEsU0FBdUY7QUFDMUcsWUFBTSxZQUFZLE1BQU0sTUFBTSxRQUFRLE9BQU87QUFDN0MsWUFBTSxFQUFFLEtBQUssSUFBSTtBQUVqQixhQUFPO0FBQUEsUUFDSCxHQUFHO0FBQUEsUUFDSCxZQUFZO0FBQUEsUUFDWixRQUFRLEtBQUs7QUFBQSxRQUNiLE9BQU8sS0FBSztBQUFBLE1BQ2hCO0FBQUEsSUFDSjtBQUFBLEVBQ0o7OztBQ1pBLE1BQU0scUJBQU4sY0FBaUMseUJBQXdDO0FBQUEsSUFDckUsTUFBZSxRQUFRLFNBQTBFO0FBQzdGLFlBQU0sWUFBWSxNQUFNLE1BQU0sUUFBUSxPQUFPO0FBRTdDLFlBQU0sRUFBRSxLQUFLLElBQUk7QUFFakIsWUFBTSxTQUFpQztBQUFBLFFBQ25DLEdBQUc7QUFBQSxRQUNILFlBQVksS0FBSztBQUFBLFFBQ2pCLFNBQVMsS0FBSztBQUFBLFFBQ2QsWUFBWSxLQUFLO0FBQUEsUUFDakIsZUFBZSxLQUFLO0FBQUEsTUFDeEI7QUFFQSxhQUFPO0FBQUEsSUFDWDtBQUFBLElBRUEsSUFBSSxXQUFXO0FBQ1gsYUFBTztBQUFBLElBQ1g7QUFBQSxFQUNKOzs7QUNyQkEsTUFBTSxnQkFBTixjQUF5RixNQUFjO0FBQUEsSUFDbkcsSUFBSSxjQUFzQjtBQUN0QixjQUFRLEtBQUssT0FBTyxlQUFlLElBQUksS0FBSztBQUFBLElBQ2hEO0FBQUEsRUFDSjtBQVNBLE1BQU0scUJBQXFCLElBQUksTUFBTSxlQUFlO0FBQUEsSUFDaEQsVUFDSSxTQUNBLE1BQ0Y7QUFDRSxZQUFNLFNBQVMsS0FBSyxDQUFDO0FBQ3JCLFlBQU0sT0FBTyxRQUFRO0FBQ3JCLGFBQU8sSUFBSSxPQUFPLFNBQVMsTUFBTSxnQkFBZ0IsSUFBSSxFQUFFLEdBQUcsSUFBSTtBQUFBLElBQ2xFO0FBQUEsRUFDSixDQUFDOzs7QUNNRCxNQUFNLG1CQUFOLE1BQXVCO0FBQUEsSUFDbkIsT0FBZTtBQUFBLElBQ2YsT0FBZTtBQUFBLElBQ2YsUUFBZ0I7QUFBQSxJQUNoQixXQUFvQjtBQUFBLEVBQ3hCOzs7QUNSQSxNQUFLLGFBQUwsa0JBQUtBLGdCQUFMO0FBQ0ksSUFBQUEsWUFBQSxVQUFPO0FBQ1AsSUFBQUEsWUFBQSxjQUFXO0FBQ1gsSUFBQUEsWUFBQSxXQUFRO0FBQ1IsSUFBQUEsWUFBQSxZQUFTO0FBSlIsV0FBQUE7QUFBQSxLQUFBO0FBT0wsTUFBSyxZQUFMLGtCQUFLQyxlQUFMO0FBQ0ksSUFBQUEsV0FBQSxVQUFPO0FBQ1AsSUFBQUEsV0FBQSxnQkFBYTtBQUNiLElBQUFBLFdBQUEsV0FBUTtBQUNSLElBQUFBLFdBQUEsWUFBUztBQUNULElBQUFBLFdBQUEsVUFBTztBQUNQLElBQUFBLFdBQUEsWUFBUztBQU5SLFdBQUFBO0FBQUEsS0FBQTs7O0FDMUJMLE1BQU0sbUJBQU4sY0FBNEYsY0FBc0I7QUFBQSxJQUM5RyxJQUFJLFFBQW9CO0FBQ3BCLFlBQU0sS0FBSyxLQUFLLE9BQU8sTUFBTSxVQUFVO0FBQ3ZDLFVBQUksS0FBSyxLQUFLLE9BQU87QUFDakIsYUFBSyxPQUFPLE1BQU0sVUFBVSxRQUFRLEtBQUs7QUFBQSxNQUM3QztBQUVBLFlBQU0sS0FBSyxLQUFLLE9BQU8sTUFBTSxXQUFXO0FBQ3hDLFVBQUksS0FBSyxLQUFLLE9BQU87QUFDakIsYUFBSyxPQUFPLE1BQU0sV0FBVyxRQUFRLEtBQUs7QUFBQSxNQUM5QztBQUVBLGFBQU8sS0FBSyxPQUFPO0FBQUEsSUFDdkI7QUFBQSxJQUVBLElBQUksYUFBOEI7QUFDOUIsYUFBTyxLQUFLLE9BQU87QUFBQSxJQUN2QjtBQUFBLElBRUEsSUFBSSxTQUFzQjtBQUN0QixhQUFPLEtBQUssT0FBTztBQUFBLElBQ3ZCO0FBQUEsSUFFQSxJQUFJLFFBQWdCO0FBQ2hCLFlBQU0sb0JBQW9CLEtBQUssV0FBVyxhQUFhO0FBQ3ZELFlBQU0saUJBQWlCLEtBQUssV0FBVyxVQUFVO0FBQ2pELFlBQU0sVUFBVTtBQUVoQixhQUFPLG9CQUFvQixpQkFBaUI7QUFBQSxJQUNoRDtBQUFBLElBRUEsSUFBSSxRQUFnQjtBQUNoQixZQUFNLG9CQUFvQixLQUFLLFdBQVcsYUFBYTtBQUN2RCxZQUFNLGVBQWUsS0FBSyxXQUFXLFFBQVE7QUFDN0MsWUFBTSxVQUFVO0FBRWhCLGFBQU8sb0JBQW9CLGVBQWU7QUFBQSxJQUM5QztBQUFBO0FBQUE7QUFBQTtBQUFBLElBS0EsSUFBSSxVQUE0QjtBQUM1QixhQUFPLEtBQUssTUFBTSxJQUFJLE9BQUssQ0FBNEIsRUFBRSxPQUFPLE9BQUssRUFBRSw2QkFBK0IsRUFBRSxJQUFJLE9BQUssQ0FBbUI7QUFBQSxJQUN4STtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS0EsSUFBSSxrQkFBb0M7QUFDcEMsYUFBTyxLQUFLLFFBQVEsT0FBTyxPQUFLLEVBQUUsT0FBTyxVQUFVO0FBQUEsSUFDdkQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtBLElBQUksU0FBMEI7QUFDMUIsYUFBTyxLQUFLLE1BQU0sSUFBSSxPQUFLLENBQTRCLEVBQUUsT0FBTyxPQUFLLEVBQUUsMkJBQThCLEVBQUUsSUFBSSxPQUFLLENBQWtCO0FBQUEsSUFDdEk7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtBLElBQUksZ0JBQStCO0FBQy9CLGFBQU8sS0FBSyxPQUFPLE9BQU8sT0FBSyxFQUFFLE9BQU8sVUFBVSxFQUFFLENBQUMsS0FBSztBQUFBLElBQzlEO0FBQUEsSUFFQSxNQUFNLHFCQUFxQixLQUF3QztBQUMvRCxZQUFNLFlBQVksS0FBSyxXQUFXLEdBQUc7QUFDckMsWUFBTSxTQUFTLElBQUksaUJBQWlCO0FBQ3BDLFVBQUksYUFBYSxNQUFNO0FBQ25CLGVBQU87QUFBQSxNQUNYO0FBRUEsWUFBTSxRQUFRLFVBQVU7QUFDeEIsWUFBTSxVQUFVO0FBQ2hCLGFBQU8sT0FBTyxRQUFRO0FBRXRCLGFBQU87QUFBQSxJQUNYO0FBQUEsSUFFQSxNQUFNLGlCQUFpQixLQUF3QztBQUMzRCxZQUFNLFNBQVMsSUFBSSxpQkFBaUI7QUFFcEMsWUFBTSxRQUFRLEtBQUssT0FBTyxHQUFHO0FBQzdCLFVBQUksU0FBUyxNQUFNO0FBQ2YsZUFBTztBQUFBLE1BQ1g7QUFFQSxZQUFNLG9CQUFvQixNQUFNLEtBQUsscUJBQXFCLE1BQU0sU0FBUztBQUV6RSxZQUFNLFFBQVEsTUFBTTtBQUNwQixZQUFNLFVBQVU7QUFDaEIsYUFBTyxPQUFPLGtCQUFrQixPQUFPLFFBQVE7QUFFL0MsYUFBTztBQUFBLElBQ1g7QUFBQSxJQUVBLE1BQU0sa0JBQWtCLFlBQXlEO0FBQzdFLFVBQUksT0FBTyxLQUFLLE1BQU0sSUFBSSxXQUFXLEVBQUU7QUFFdkMsVUFBSSxZQUFZLEtBQUssT0FBTztBQUM1QixVQUFJLGdCQUFnQixNQUFNLEtBQUssaUJBQWlCLFNBQVM7QUFFekQsVUFBSSwyQkFBMkIsS0FBSyw0QkFBNEIsVUFBVTtBQUUxRSxVQUFJLHVCQUF1QixLQUFLLE9BQU87QUFFdkMsVUFBSSxlQUFlLEtBQUssT0FBTztBQUUvQixZQUFNLFdBQTZCO0FBQUEsUUFBWTtBQUFBLFFBQzNDO0FBQUEsVUFDSSxNQUFNLGNBQWMsT0FBTywyQkFBMkI7QUFBQSxVQUN0RDtBQUFBLFVBQ0E7QUFBQSxRQUNKO0FBQUEsTUFBQztBQUVMLFVBQUksV0FBVyxtQ0FBZ0M7QUFDM0MsaUJBQVMsV0FBVztBQUFBLE1BQ3hCO0FBRUEsYUFBTztBQUFBLElBQ1g7QUFBQSxJQUVBLDRCQUE0QixZQUFzQztBQUM5RCxVQUFJLFdBQVcscUNBQWtDLFdBQVcseUNBQW1DO0FBQzNGLFlBQUksV0FBVyxtQ0FBZ0M7QUFDM0MsaUJBQU87QUFBQSxRQUNYO0FBRUEsWUFBSSxXQUFXLG1DQUFnQztBQUMzQyxpQkFBTztBQUFBLFFBQ1g7QUFFQSxlQUFPO0FBQUEsTUFDWDtBQUVBLFVBQUksV0FBVyxxQ0FBaUM7QUFDNUMsWUFBSSxXQUFXLG1DQUFnQztBQUMzQyxpQkFBTztBQUFBLFFBQ1g7QUFFQSxZQUFJLFdBQVcsK0JBQThCO0FBQ3pDLGlCQUFPO0FBQUEsUUFDWDtBQUVBLFlBQUksV0FBVyxtQ0FBZ0M7QUFDM0MsaUJBQU87QUFBQSxRQUNYO0FBRUEsZUFBTztBQUFBLE1BQ1g7QUFFQSxhQUFPO0FBQUEsSUFDWDtBQUFBLElBRUEsTUFBTSxpQkFBaUIsUUFBa0Q7QUFDckUsWUFBTSxTQUFTLElBQUksaUJBQWlCO0FBQ3BDLFVBQUksT0FBUSxLQUFLLE1BQU0sSUFBSSxNQUFNO0FBRWpDLFVBQUksQ0FBQyxNQUFNO0FBQ1AsZUFBTztBQUFBLE1BQ1g7QUFFQSxhQUFPLE9BQU8sS0FBSyxPQUFPO0FBRTFCLGFBQU87QUFBQSxJQUNYO0FBQUEsSUFFQSxNQUFNLHNCQUFzQixRQUEyQztBQUNuRSxVQUFJLE9BQVEsS0FBSyxNQUFNLElBQUksTUFBTTtBQUVqQyxVQUFJLFFBQVEsS0FBSyxPQUFPO0FBRXhCLFVBQUksVUFBVTtBQUVkLFlBQU0sU0FBUyxJQUFJLGlCQUFpQjtBQUNwQyxhQUFPLE9BQU87QUFDZCxhQUFPLFFBQVEsTUFBTSxRQUFRLEtBQUssT0FBTyxXQUFXO0FBRXBELGFBQU87QUFBQSxJQUNYO0FBQUEsSUFFQSxNQUFNLGNBQWM7QUFBQSxJQUFFO0FBQUEsSUFFdEIsTUFBTSxhQUFhO0FBQUEsSUFBRTtBQUFBLElBRXJCLE1BQU0sY0FBYztBQUFBLElBQUU7QUFBQSxFQUMxQjs7O0FDak1BLE1BQU0sb0JBQU4sY0FBNkYsaUJBQXlCO0FBQUEsSUFDbEgsSUFBSSxRQUFnQjtBQUNoQixhQUFPLEtBQUssT0FBTyxTQUFTO0FBQUEsSUFDaEM7QUFBQSxJQUVBLElBQUksYUFBcUI7QUFDckIsYUFBTyxLQUFLLE9BQU8sY0FBYztBQUFBLElBQ3JDO0FBQUEsSUFFQSxJQUFJLE1BQWM7QUFDZCxhQUFPLEtBQUssT0FBTyxPQUFPO0FBQUEsSUFDOUI7QUFBQSxFQUNKOzs7QUNiQSxNQUFNLGtCQUFOLGNBQTJGLGlCQUF5QjtBQUFBLEVBRXBIOzs7QUNGQSxNQUFNLGNBQU4sY0FBdUYsaUJBQXlCO0FBQUEsRUFFaEg7OztBQ0FBLE1BQU0sZUFBTixjQUF3RixLQUFhO0FBQUEsSUFDakcsSUFBSSxPQUFPO0FBQ1AsYUFBTyxLQUFLLFlBQVk7QUFBQSxJQUM1QjtBQUFBLElBRUEsSUFBSSxjQUFjO0FBQ2QsY0FBUSxLQUFLLE9BQU8sZUFBZSxJQUFJLEtBQUs7QUFBQSxJQUNoRDtBQUFBO0FBQUEsSUFHQSxNQUF5QixXQUNyQixTQUNBLFNBQ0EsTUFDdUI7QUFDdkIsYUFBTyxNQUFNLFdBQVcsU0FBUyxTQUFTLElBQUk7QUFBQSxJQUNsRDtBQUFBO0FBQUEsSUFJbUIsVUFDZixNQUNBLFNBQ0EsUUFDSTtBQUNKLFlBQU0sVUFBVSxNQUFNLFNBQVMsTUFBTTtBQUFBLElBQ3pDO0FBQUEsRUFDSjtBQXdCQSxNQUFNLG9CQUFvQixJQUFJLE1BQU0sY0FBYztBQUFBLElBQzlDLFVBQ0ksU0FDQSxNQUNGO0FBQ0UsWUFBTSxTQUFTLEtBQUssQ0FBQztBQUNyQixZQUFNLE9BQU8sUUFBUTtBQUNyQixZQUFNLFlBQWlDLE9BQU8sU0FBUyxLQUFLLGdCQUFnQixJQUFJLEtBQUs7QUFDckYsYUFBTyxJQUFJLFVBQVUsR0FBRyxJQUFJO0FBQUEsSUFDaEM7QUFBQSxFQUNKLENBQUM7OztBQzdERCxNQUFNLHVCQUFOLGNBQWdHLGFBQXNCO0FBQUEsSUFDbEgsSUFBSSxTQUFTO0FBQ1QsYUFBTyxLQUFLLE9BQU8sVUFBVTtBQUFBLElBQ2pDO0FBQUEsSUFFQSxJQUFJLFFBQVE7QUFDUixhQUFPLEtBQUssT0FBTyxTQUFTO0FBQUEsSUFDaEM7QUFBQSxFQUNKOzs7QUNSQSxNQUFNLGdCQUFOLGNBQXlGLHFCQUE4QjtBQUFBLElBQ25ILElBQUksYUFBcUI7QUFDckIsYUFBTyxLQUFLLE9BQU8sY0FBYztBQUFBLElBQ3JDO0FBQUEsSUFFQSxJQUFJLFVBQWtCO0FBQ2xCLGFBQU8sS0FBSyxPQUFPLFdBQVc7QUFBQSxJQUNsQztBQUFBLElBRUEsSUFBSSxpQkFBeUI7QUFDekIsYUFBTyxLQUFLLGFBQWEsS0FBSztBQUFBLElBQ2xDO0FBQUEsSUFFQSxJQUFJLGFBQXFCO0FBQ3JCLGFBQU8sS0FBSyxPQUFPLGNBQWMsS0FBSztBQUFBLElBQzFDO0FBQUEsRUFDSjs7O0FDcEJBLE1BQUssWUFBTCxrQkFBS0MsZUFBTDtBQUNJLElBQUFBLFdBQUEsVUFBTztBQUNQLElBQUFBLFdBQUEsV0FBUTtBQUNSLElBQUFBLFdBQUEsY0FBVztBQUNYLElBQUFBLFdBQUEsYUFBVTtBQUNWLElBQUFBLFdBQUEsY0FBVztBQUNYLElBQUFBLFdBQUEsYUFBVTtBQUNWLElBQUFBLFdBQUEsWUFBUztBQUNULElBQUFBLFdBQUEsb0JBQWlCO0FBQ2pCLElBQUFBLFdBQUEsY0FBVztBQUNYLElBQUFBLFdBQUEsY0FBVztBQUNYLElBQUFBLFdBQUEsaUJBQWM7QUFDZCxJQUFBQSxXQUFBLGFBQVU7QUFDVixJQUFBQSxXQUFBLGVBQVk7QUFDWixJQUFBQSxXQUFBLGtCQUFlO0FBQ2YsSUFBQUEsV0FBQSxnQkFBYTtBQUNiLElBQUFBLFdBQUEsZ0JBQWE7QUFDYixJQUFBQSxXQUFBLGFBQVU7QUFqQlQsV0FBQUE7QUFBQSxLQUFBOzs7QUNLTCxNQUFNLGlCQUFOLGNBQTBGLHFCQUE4QjtBQUFBLElBQ3BILElBQUksV0FBbUI7QUFDbkIsYUFBTyxLQUFLLE9BQU87QUFBQSxJQUN2QjtBQUFBLElBRUEsSUFBSSxTQUFpQjtBQUNqQixhQUFPLEtBQUssT0FBTztBQUFBLElBQ3ZCO0FBQUEsSUFFQSxJQUFJLGFBQXFCO0FBQ3JCLGFBQU8sS0FBSyxPQUFPO0FBQUEsSUFDdkI7QUFBQSxJQUVBLElBQUksT0FBZTtBQUNmLGFBQU8sS0FBSyxPQUFPO0FBQUEsSUFDdkI7QUFBQSxJQUVBLElBQUksYUFBeUI7QUFDekIsYUFBTyxLQUFLLE9BQU87QUFBQSxJQUN2QjtBQUFBLElBRUEsSUFBSSxhQUF3QjtBQUN4QixhQUFPLEtBQUssT0FBTztBQUFBLElBQ3ZCO0FBQUEsSUFFQSxJQUFJLFFBQW1CO0FBQ25CLGFBQU8sS0FBSyxPQUFPO0FBQUEsSUFDdkI7QUFBQSxJQUVBLElBQUksV0FBb0I7QUFDcEIsYUFBTyxLQUFLLE9BQU8sWUFBWTtBQUFBLElBQ25DO0FBQUEsRUFDSjs7O0FDakNPLE1BQU0saUJBQWlCO0FBQUEsSUFDMUIsUUFBUTtBQUFBLE1BQ0osT0FBTztBQUFBLElBQ1g7QUFBQSxJQUNBLE1BQU07QUFBQSxNQUNGLE1BQU07QUFBQSxNQUNOLFdBQVc7QUFBQSxNQUNYLE9BQU87QUFBQSxNQUNQLEtBQUs7QUFBQSxJQUNUO0FBQUEsSUFDQSxhQUFhO0FBQUEsTUFDVCxNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsTUFDVixPQUFPO0FBQUEsTUFDUCxRQUFRO0FBQUEsSUFDWjtBQUFBLElBQ0EsWUFBWTtBQUFBLE1BQ1IsWUFBWTtBQUFBLE1BQ1osT0FBTztBQUFBLE1BQ1AsUUFBUTtBQUFBLE1BQ1IsTUFBTTtBQUFBLE1BQ04sUUFBUTtBQUFBLElBQ1o7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNILFdBQVc7QUFBQSxNQUNYLFlBQVk7QUFBQSxNQUNaLFlBQVk7QUFBQSxJQUNoQjtBQUFBLElBQ0EsWUFBWTtBQUFBLE1BQ1IsY0FBYztBQUFBLE1BQ2QsY0FBYztBQUFBLE1BQ2QsV0FBVztBQUFBLE1BQ1gsU0FBUztBQUFBLElBQ2I7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNKLE9BQU87QUFBQSxNQUNQLFVBQVU7QUFBQSxNQUNWLFNBQVM7QUFBQSxNQUNULFVBQVU7QUFBQSxNQUNWLFNBQVM7QUFBQSxNQUNULFFBQVE7QUFBQSxNQUNSLGdCQUFnQjtBQUFBLE1BQ2hCLFVBQVU7QUFBQSxNQUNWLFVBQVU7QUFBQSxNQUNWLGFBQWE7QUFBQSxNQUNiLFNBQVM7QUFBQSxNQUNULFdBQVc7QUFBQSxNQUNYLGNBQWM7QUFBQSxNQUNkLFlBQVk7QUFBQSxNQUNaLFlBQVk7QUFBQSxNQUNaLFNBQVM7QUFBQSxJQUNiO0FBQUEsSUFFQSxNQUFNO0FBQUEsTUFDRixpQkFBaUI7QUFBQSxRQUNiLE9BQU87QUFBQSxRQUNQLFFBQVE7QUFBQSxNQUNaO0FBQUEsSUFDSjtBQUFBLElBRUEsT0FBTztBQUFBLE1BQ0gsaUJBQWlCO0FBQUEsUUFDYixXQUFXO0FBQUEsUUFDWCxLQUFLO0FBQUEsUUFDTCxTQUFTO0FBQUEsTUFDYjtBQUFBLElBQ0o7QUFBQSxFQUNKOzs7QUN2RU8sTUFBTSxvQkFBb0I7QUFBQSxJQUM3QjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUVBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxFQUNKOzs7QUNiQSxNQUFNLHNCQUFOLGNBQWtDLHlCQUF3QztBQUFBLElBQ3RFLE1BQWUsUUFBUSxTQUEyRTtBQUM5RixZQUFNLFlBQVksTUFBTSxNQUFNLFFBQVEsT0FBTztBQUU3QyxZQUFNLEVBQUUsS0FBSyxJQUFJO0FBRWpCLFVBQUksY0FBYyxPQUFPLE9BQU8sVUFBVSxFQUFFLElBQUksQ0FBQyxHQUFHLE1BQU07QUFBRSxlQUFPLEVBQUUsSUFBSSxHQUFHLE9BQU8sS0FBSyxLQUFLLFNBQVMsdUJBQXVCLENBQUMsRUFBRSxHQUFHLE1BQU0sRUFBRTtBQUFBLE1BQUUsQ0FBQztBQUM5SSxVQUFJLGFBQWEsT0FBTyxPQUFPLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxNQUFNO0FBQUUsZUFBTyxFQUFFLElBQUksR0FBRyxPQUFPLEtBQUssS0FBSyxTQUFTLGtCQUFrQixDQUFDLEVBQUUsR0FBRyxNQUFNLEVBQUU7QUFBQSxNQUFFLENBQUM7QUFDdkksVUFBSSxhQUFhLE9BQU8sT0FBTyxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsTUFBTTtBQUFFLGVBQU8sRUFBRSxJQUFJLEdBQUcsT0FBTyxLQUFLLEtBQUssU0FBUyxrQkFBa0IsQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFO0FBQUEsTUFBRSxDQUFDO0FBRXZJLFlBQU0sU0FBa0M7QUFBQSxRQUNwQyxHQUFHO0FBQUEsUUFDSCxVQUFVLEtBQUs7QUFBQSxRQUNmLFlBQVksS0FBSztBQUFBLFFBQ2pCLFlBQVksS0FBSztBQUFBLFFBQ2pCLE1BQU0sS0FBSztBQUFBLFFBQ1gsUUFBUSxLQUFLO0FBQUEsUUFDYixZQUFZLEtBQUs7QUFBQSxRQUNqQixPQUFPLEtBQUs7QUFBQSxRQUNaO0FBQUEsUUFDQSxRQUFRO0FBQUEsUUFDUixRQUFRO0FBQUEsUUFDUixVQUFVLEtBQUs7QUFBQSxRQUNmLFVBQVUsS0FBSztBQUFBLE1BQ25CO0FBRUEsYUFBTztBQUFBLElBQ1g7QUFBQSxJQUVBLElBQUksV0FBVztBQUNYLGFBQU87QUFBQSxJQUNYO0FBQUEsRUFDSjs7O0FDbkNBLE1BQWUscUJBQWYsY0FBd0UsV0FBaUM7QUFBQSxJQUNyRyxXQUFvQixpQkFBb0M7QUFDcEQsWUFBTSxvQkFBb0IsS0FBSyxTQUFTLElBQUksUUFBUSxVQUFVLEtBQUs7QUFFbkUsWUFBTSxVQUFVLFlBQVksTUFBTSxnQkFBZ0I7QUFBQSxRQUM5QyxPQUFPO0FBQUEsUUFDUCxTQUFTLENBQUMsWUFBWSxTQUFTLE9BQU87QUFBQSxNQUMxQyxDQUFDO0FBQ0QsVUFBRyxtQkFBa0I7QUFDakIsZ0JBQVEsUUFBUSxLQUFLLFNBQVM7QUFBQSxNQUNsQztBQUVBLGFBQU87QUFBQSxJQUNYO0FBQUEsSUFFQSxNQUFlLFFBQVEsVUFBeUMsQ0FBQyxHQUE0QztBQUN6RyxjQUFRLEtBQUssS0FBSztBQUNsQixjQUFRLFdBQVcsS0FBSztBQUV4QixZQUFNLEVBQUUsTUFBTSxJQUFJO0FBRWxCLGFBQU87QUFBQSxRQUNIO0FBQUEsUUFDQSxVQUFVLEtBQUssTUFBTSxVQUFVLGFBQWE7QUFBQSxRQUM1QyxNQUFNLE1BQU07QUFBQSxRQUNaLFVBQVUsS0FBSztBQUFBLFFBQ2YsVUFBVSxLQUFLO0FBQUEsUUFDZixTQUFTLENBQUM7QUFBQSxRQUNWLFNBQVMsS0FBSyxNQUFNO0FBQUEsUUFDcEI7QUFBQSxRQUNBLE9BQU8sS0FBSyxNQUFNO0FBQUEsUUFDbEIsT0FBTyxLQUFLO0FBQUEsUUFDWixPQUFPLE1BQU07QUFBQSxRQUNiLFdBQVcsTUFBTTtBQUFBLFFBRWpCLGFBQWEsTUFBTTtBQUFBLE1BQ3ZCO0FBQUEsSUFDSjtBQUFBLElBRVMsa0JBQWtCLE9BQXFCO0FBQzVDLFlBQU0sa0JBQWtCLEtBQUs7QUFBQSxJQUNqQztBQUFBLEVBQ0o7OztBQzFDQSxNQUFNLGVBQU4sY0FBMkIsS0FBSztBQUFBLElBQzVCLE9BQWdCLGdCQUFnQjtBQUFBLElBRWhDLFlBQVksU0FBaUIsTUFBZ0MsU0FBdUI7QUFDaEYsWUFBTSxTQUFTLE1BQU0sT0FBTztBQUFBLElBQ2hDO0FBQUEsSUFFQSxNQUF5QixVQUFVLEVBQUUsVUFBVSxTQUFVLEdBQTZEO0FBQ2xILFlBQU0sZ0JBQWdCLE1BQU0sTUFBTSxVQUFVLEVBQUUsVUFBVSxTQUFTLENBQUM7QUFFbEUsYUFBTztBQUFBLElBQ1g7QUFBQSxFQUNKOzs7QUNaQSxNQUFNLGlCQUFOLE1BQXFCO0FBQUEsSUFDakIsYUFBa0M7QUFBQSxJQUNsQyxVQUFzQztBQUFBLElBQ3RDLGlCQUFpQyxJQUFJLGVBQWU7QUFBQSxJQUNwRCxnQkFBcUMsQ0FBQztBQUFBLElBRXRDLE1BQU0sS0FBSyxhQUFpRDtBQUN4RCxXQUFLLFVBQVU7QUFDZixVQUFJLFlBQVksU0FBUyxRQUFRLEtBQUssWUFBWSx3Q0FBcUM7QUFBQSxNQUV2RjtBQUVBLFVBQUksY0FBYyxHQUFHLFlBQVksU0FBUyxJQUFJLEdBQUcsWUFBWSxTQUFTLElBQUk7QUFFMUUsVUFBSSxPQUFPLElBQUksYUFBYSxXQUFXO0FBQ3ZDLFdBQUssYUFBYTtBQUVsQixVQUFJLENBQUMsS0FBSyxXQUFXLFlBQVk7QUFDN0IsY0FBTSxLQUFLLFdBQVcsU0FBUyxDQUFDLENBQUM7QUFBQSxNQUNyQztBQUVBLFlBQU0sS0FBSyxnQkFBZ0I7QUFDM0IsV0FBSyxVQUFVO0FBQUEsSUFDbkI7QUFBQSxJQUVBLE1BQU0sZUFBZSxhQUFpRDtBQUNsRSxXQUFLLFVBQVU7QUFFZixVQUFJLGNBQWMsR0FBRyxZQUFZLFNBQVMsSUFBSSxHQUFHLFlBQVksU0FBUyxJQUFJO0FBRTFFLFlBQU0sUUFBUSxZQUFZLFNBQVM7QUFDbkMsVUFBSSxVQUFVLFFBQVEsVUFBVSxHQUFHO0FBQy9CLFlBQUksUUFBUSxHQUFHO0FBQ1gsd0JBQWMsY0FBYyxJQUFJLEtBQUs7QUFBQSxRQUN6QyxPQUFPO0FBQ0gsd0JBQWMsY0FBYyxHQUFHLEtBQUs7QUFBQSxRQUN4QztBQUFBLE1BQ0o7QUFFQSxVQUFJLE9BQU8sSUFBSSxhQUFhLFdBQVc7QUFDdkMsV0FBSyxhQUFhO0FBRWxCLFVBQUksQ0FBQyxLQUFLLFdBQVcsWUFBWTtBQUM3QixjQUFNLEtBQUssV0FBVyxTQUFTLENBQUMsQ0FBQztBQUFBLE1BQ3JDO0FBRUEsWUFBTSxLQUFLLGdCQUFnQjtBQUMzQixXQUFLLFVBQVU7QUFBQSxJQUNuQjtBQUFBLElBRUEsTUFBTSxrQkFBaUM7QUFDbkMsVUFBSSxDQUFDLEtBQUssY0FBYyxDQUFDLEtBQUssU0FBUztBQUNuQztBQUFBLE1BQ0o7QUFFQSxVQUFJLENBQUMsS0FBSyxXQUFZLFlBQVk7QUFDOUIsY0FBTSxLQUFLLFdBQVksU0FBUyxDQUFDLENBQUM7QUFBQSxNQUN0QztBQUVBLFVBQUksS0FBSyxRQUFRLFNBQVMsVUFBVTtBQUNoQyxhQUFLLFdBQVcsWUFBWTtBQUM1QixZQUFJLGdCQUFnQjtBQUNwQixlQUFPLENBQUMsZUFBZTtBQUNuQixjQUFJLGlCQUFpQixJQUFJLEtBQUssTUFBTTtBQUNwQyxnQkFBTSxlQUFlLFNBQVMsQ0FBQyxDQUFDO0FBQ2hDLGdCQUFNLHVCQUFtQyxlQUFlLE1BQU0sQ0FBQyxFQUFVLFFBQVEsQ0FBQztBQUNsRixVQUFDLEtBQUssV0FBVyxNQUFNLENBQUMsRUFBVSxRQUFRLEtBQUssb0JBQW9CO0FBQ25FLGNBQUkscUJBQXFCLFVBQVUsR0FBRztBQUNsQyw0QkFBZ0I7QUFBQSxVQUNwQjtBQUFBLFFBQ0o7QUFBQSxNQUNKO0FBRUEsVUFBSSxtQkFBb0IsS0FBSyxXQUFXLE1BQU0sQ0FBQyxFQUFVO0FBQ3pELFVBQUksYUFBYSxLQUFLLG9CQUFvQixnQkFBZ0I7QUFFMUQsV0FBSyxpQkFBaUI7QUFBQSxJQUMxQjtBQUFBLElBRUEsb0JBQW9CLE9BQW9DO0FBQ3BELFlBQU0sU0FBeUI7QUFBQSxRQUMzQixPQUFPO0FBQUEsUUFDUCxXQUFXO0FBQUEsUUFDWCxXQUFXO0FBQUEsTUFDZjtBQUVBLFlBQU0sUUFBUSxPQUFLO0FBQ2YsWUFBSSxhQUFnQztBQUFBLFVBQ2hDLFFBQVEsRUFBRTtBQUFBLFVBQ1YsU0FBUztBQUFBLFFBQ2I7QUFFQSxZQUFJLEVBQUUsV0FBVyxJQUFJO0FBQ2pCLGlCQUFPLFNBQVM7QUFDaEIscUJBQVcsV0FBVztBQUN0QixpQkFBTyxhQUFhO0FBQUEsUUFDeEI7QUFFQSxZQUFJLEVBQUUsVUFBVSxNQUFNLEVBQUUsVUFBVSxJQUFJO0FBQ2xDLGlCQUFPO0FBQ1AscUJBQVcsV0FBVztBQUN0QixpQkFBTztBQUFBLFFBQ1g7QUFFQSxZQUFJLEVBQUUsV0FBVyxHQUFHO0FBQ2hCLGlCQUFPO0FBQ1AscUJBQVcsV0FBVztBQUN0QixpQkFBTztBQUFBLFFBQ1g7QUFFQSxhQUFLLGNBQWMsS0FBSyxVQUFVO0FBQUEsTUFDdEMsQ0FBQztBQUVELGFBQU87QUFBQSxJQUNYO0FBQUEsSUFFQSxNQUFNLFlBQThDO0FBQ2hELFVBQUksQ0FBQyxLQUFLLFNBQVM7QUFDZjtBQUFBLE1BQ0o7QUFFQSxZQUFNLFdBQVcsS0FBSyxRQUFRO0FBQzlCLFlBQU0sV0FBVyxLQUFLLFlBQVksS0FBSyxRQUFRLElBQUk7QUFDbkQsWUFBTSxtQkFBbUIsS0FBSyxvQkFBb0I7QUFFbEQsZUFBUyxVQUFVLE1BQU0sZUFBZSxVQUFVLGdCQUFnQjtBQUNsRSxlQUFTLE9BQU8sS0FBSztBQUVyQixhQUFPLFlBQVksT0FBTyxRQUFRO0FBQUEsSUFDdEM7QUFBQSxJQUVBLFlBQVksTUFBZ0M7QUFDeEMsY0FBUSxNQUFNO0FBQUEsUUFDVjtBQUNJLGlCQUFPO0FBQUEsUUFDWDtBQUNJLGlCQUFPO0FBQUEsUUFDWDtBQUNJLGlCQUFPO0FBQUEsUUFDWDtBQUNJLGlCQUFPO0FBQUEsTUFDZjtBQUFBLElBQ0o7QUFBQSxJQUVBLHNCQUEwQztBQUN0QyxVQUFJLFdBQVc7QUFBQSxRQUNYLFNBQVMsS0FBSyxXQUFZO0FBQUEsUUFDMUIsT0FBTyxLQUFLLFdBQVk7QUFBQSxRQUN4QixlQUFlLEtBQUssZUFBZTtBQUFBLFFBQ25DLG1CQUFtQixLQUFLLGVBQWU7QUFBQSxRQUN2QyxtQkFBbUIsS0FBSyxlQUFlO0FBQUEsUUFDdkMsT0FBTyxLQUFLO0FBQUEsTUFDaEI7QUFFQSxhQUFPO0FBQUEsSUFDWDtBQUFBLEVBQ0o7QUFZQSxNQUFNLGlCQUFOLE1BQXFCO0FBQUEsSUFDakIsUUFBZ0I7QUFBQSxJQUNoQixZQUFvQjtBQUFBLElBQ3BCLFlBQW9CO0FBQUEsRUFDeEI7OztBQy9LTyxNQUFNLHFCQUFOLE1BQXlCO0FBQUEsSUFDNUIsV0FBbUI7QUFBQSxJQUVuQixNQUFNLHNCQUEyRDtBQUM3RCxZQUFNLE9BQU8sTUFBTSxlQUFlLEtBQUssVUFBVSxDQUFDLENBQUM7QUFFbkQsYUFBTyxJQUFJLFFBQVEsYUFBVztBQUMxQixjQUFNLE9BQU87QUFBQSxVQUNULE9BQU87QUFBQSxVQUNQLFNBQVM7QUFBQSxVQUNULFNBQVM7QUFBQSxZQUNMLFFBQVE7QUFBQSxjQUNKLE9BQU87QUFBQSxjQUNQLFVBQVUsQ0FBQUMsVUFBUSxRQUFRLEtBQUsseUJBQTBCQSxNQUFLLENBQUMsRUFBbUMsY0FBYyxNQUFNLENBQUMsQ0FBQztBQUFBLFlBQzVIO0FBQUEsWUFDQSxRQUFRO0FBQUEsY0FDSixPQUFPO0FBQUEsWUFDWDtBQUFBLFVBQ0o7QUFBQSxVQUNBLFNBQVM7QUFBQSxVQUNULE9BQU8sTUFBTSxRQUFRLEVBQUUsVUFBVSxHQUFHLFdBQVcsT0FBTyxXQUFXLEtBQUssQ0FBQztBQUFBLFFBQzNFO0FBRUEsWUFBSSxPQUFPLElBQUksRUFBRSxPQUFPLElBQUk7QUFBQSxNQUNoQyxDQUFDO0FBQUEsSUFDTDtBQUFBLElBRUEseUJBQXlCLE1BQTBDO0FBQy9ELGFBQU87QUFBQSxRQUNILFVBQVUsU0FBUyxLQUFLLFNBQVMsS0FBSztBQUFBLFFBQ3RDLFdBQVcsS0FBSyxVQUFVO0FBQUEsUUFDMUIsV0FBVztBQUFBLE1BQ2Y7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUVPLE1BQU0sNkJBQU4sTUFBaUM7QUFBQSxJQUNwQyxXQUFtQjtBQUFBLElBQ25CLFlBQXFCO0FBQUEsSUFDckIsWUFBcUI7QUFBQSxFQUN6Qjs7O0FDN0JBLE1BQWUsd0JBQWYsY0FBOEUsbUJBQTBCO0FBQUEsSUFDcEcsTUFBZSxRQUFRLFVBQXlDLENBQUMsR0FBK0M7QUFDNUcsWUFBTSxZQUFZLE1BQU0sTUFBTSxRQUFRLE9BQU87QUFFN0MsWUFBTSxFQUFFLE1BQU0sSUFBSTtBQUVsQixlQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssT0FBTyxRQUFRLE1BQU0sS0FBSyxHQUFHO0FBQzVDLFFBQUMsRUFBVyxRQUFRLEtBQUssS0FBSyxTQUFTLGlCQUFpQixDQUFDLEVBQUU7QUFBQSxNQUMvRDtBQUVBLGVBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxPQUFPLFFBQVEsTUFBTSxVQUFVLEdBQUc7QUFDakQsUUFBQyxFQUEwQixRQUFRLEtBQUssS0FBSyxTQUFTLHNCQUFzQixDQUFDLEVBQUU7QUFDL0UsUUFBQyxFQUEwQixTQUFTLENBQUM7QUFFckMsaUJBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxPQUFPLFFBQVEsTUFBTSxNQUFNLEVBQUUsT0FBTyxPQUFLLEVBQUUsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxHQUFHO0FBQ2pGLFVBQUMsR0FBYSxRQUFRLEtBQUssS0FBSyxTQUFTLGtCQUFrQixFQUFFLEVBQUU7QUFDL0QsVUFBQyxFQUEwQixPQUFPLEVBQUUsSUFBSTtBQUFBLFFBQzVDO0FBQUEsTUFDSjtBQUVBLFlBQU0sa0JBQWtCLE1BQU0sZ0JBQWdCLElBQUksT0FBSztBQUNuRCxnQkFBUSxFQUFFLFlBQVk7QUFBQSxVQUNsQjtBQUNJLGNBQUUsT0FBTyxZQUFZLElBQUk7QUFDekI7QUFBQSxVQUVKO0FBQ0ksY0FBRSxPQUFPLFNBQVMsSUFBSTtBQUN0QjtBQUFBLFVBRUo7QUFDSSxjQUFFLE9BQU8sVUFBVSxJQUFJO0FBQ3ZCO0FBQUEsVUFFSjtBQUFTO0FBQUEsUUFDYjtBQUVBLGVBQU87QUFBQSxNQUNYLENBQUM7QUFFRCxhQUFPO0FBQUEsUUFDSCxHQUFHO0FBQUEsUUFDSCxPQUFPLE1BQU07QUFBQSxRQUNiLFlBQVksTUFBTTtBQUFBLFFBQ2xCLFFBQVEsTUFBTTtBQUFBLFFBQ2QsT0FBTyxNQUFNO0FBQUEsUUFDYixPQUFPLE1BQU07QUFBQSxRQUNiLFNBQVMsTUFBTTtBQUFBLFFBQ2Y7QUFBQSxRQUNBLFFBQVEsTUFBTTtBQUFBLFFBQ2QsZUFBZSxNQUFNO0FBQUEsTUFDekI7QUFBQSxJQUNKO0FBQUEsSUFFUyxrQkFBa0IsT0FBcUI7QUFDNUMsWUFBTSxrQkFBa0IsS0FBSztBQUM3QixZQUFNLE9BQU8sTUFBTSxDQUFDO0FBRXBCLFlBQU0sR0FBRyxTQUFTLGdCQUFnQixLQUFLLGtCQUFrQixLQUFLLElBQUksQ0FBQztBQUNuRSxZQUFNLEdBQUcsU0FBUyxnQkFBZ0IsS0FBSyxjQUFjLEtBQUssSUFBSSxDQUFDO0FBQy9ELFlBQU0sR0FBRyxTQUFTLGlCQUFpQixLQUFLLGVBQWUsS0FBSyxJQUFJLENBQUM7QUFDakUsWUFBTSxHQUFHLFNBQVMsa0JBQWtCLEtBQUssZ0JBQWdCLEtBQUssSUFBSSxDQUFDO0FBQUEsSUFJdkU7QUFBQSxJQUVBLE1BQU0sa0JBQWtCLE9BQW1CO0FBQ3ZDLFlBQU0sZUFBZTtBQUNyQixZQUFNLFVBQVUsTUFBTTtBQUN0QixZQUFNLFVBQVcsU0FBK0I7QUFFaEQsWUFBTSxFQUFFLE1BQU0sSUFBSTtBQUVsQixZQUFNLGFBQWMsT0FBTyxTQUFTLHlCQUF5QixNQUFNO0FBQ25FLFVBQUksZUFBZSxJQUFJLDJCQUEyQjtBQUNsRCxVQUFJLFlBQVk7QUFDWix1QkFBZSxNQUFPLElBQUksbUJBQW1CLEVBQUcsb0JBQW9CO0FBRXBFLFlBQUksYUFBYSxXQUFXO0FBQ3hCO0FBQUEsUUFDSjtBQUFBLE1BQ0o7QUFFQSxVQUFJLEVBQUUsT0FBTyxTQUFTLFNBQVMsSUFBSTtBQUVuQyxVQUFJLFdBQVcsUUFBUSxZQUFZLE1BQU07QUFDckM7QUFBQSxNQUNKO0FBRUEsVUFBSSxXQUFXLElBQUksaUJBQWlCO0FBQ3BDLFVBQUksWUFBWSxhQUFhO0FBQ3pCLG1CQUFXLE1BQU0sTUFBTSxxQkFBcUIsT0FBTztBQUFBLE1BQ3ZELE9BQU87QUFDSCxtQkFBVyxNQUFNLE1BQU0saUJBQWlCLE9BQU87QUFBQSxNQUNuRDtBQUVBLGVBQVMsUUFBUSxhQUFhO0FBRzlCLFVBQUksY0FBYztBQUFBLFFBQ2QsUUFBUSxLQUFLLEtBQUssT0FBTztBQUFBLFFBQ3pCLFNBQVMsWUFBWSxXQUFXO0FBQUEsUUFDaEMsUUFBUSxTQUFTO0FBQUEsUUFDakIsT0FBTyxPQUFPLE9BQU87QUFBQSxRQUNyQixPQUFnQixhQUFhLGFBQWEsTUFBTTtBQUFBLE1BQ3BEO0FBRUEsWUFBTSxjQUFtQztBQUFBLFFBQ3JDO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNKO0FBRUEsWUFBTSxTQUFTLElBQUksZUFBZTtBQUNsQyxZQUFNLE9BQU8sS0FBSyxXQUFXO0FBQUEsSUFDakM7QUFBQSxJQUVBLE1BQU0sZ0JBQWdCLE9BQW1CO0FBQ3JDLFlBQU0sZUFBZTtBQUNyQixZQUFNLFVBQVUsTUFBTTtBQUN0QixZQUFNLFVBQVcsU0FBK0I7QUFFaEQsWUFBTSxFQUFFLFVBQVUsWUFBWSxRQUFRLFlBQVksV0FBVyxJQUFJO0FBRWpFLFVBQUksVUFBVSxRQUFRLFVBQVUsUUFBVztBQUN2QztBQUFBLE1BQ0o7QUFFQSxZQUFNLGNBQW1DO0FBQUEsUUFDckMsU0FBa0IsTUFBTTtBQUFBLFFBQ3hCLFlBQWEsT0FBTyxTQUFTLHlCQUF5QixNQUFNO0FBQUEsTUFDaEU7QUFFQSxVQUFJLGVBQWUsY0FBYztBQUM3QixlQUFPLE1BQU0sS0FBSyxxQkFBcUIsUUFBUSxXQUFXO0FBQUEsTUFDOUQsV0FDUyxlQUFlLFVBQVU7QUFDOUIsWUFBSSxhQUErQjtBQUFBLFVBQy9CLElBQUk7QUFBQSxVQUNKO0FBQUEsVUFDQTtBQUFBLFFBQ0o7QUFFQSxlQUFPLE1BQU0sS0FBSyxpQkFBaUIsWUFBWSxXQUFXO0FBQUEsTUFDOUQ7QUFBQSxJQUNKO0FBQUEsSUFFQSxNQUFNLHFCQUFxQixVQUFrQixhQUFrQztBQUMzRSxZQUFNLEVBQUUsTUFBTSxJQUFJO0FBRWxCLFVBQUksZUFBZSxJQUFJLDJCQUEyQjtBQUNsRCxVQUFJLFlBQVksWUFBWTtBQUN4Qix1QkFBZSxNQUFPLElBQUksbUJBQW1CLEVBQUcsb0JBQW9CO0FBRXBFLFlBQUksYUFBYSxXQUFXO0FBQ3hCO0FBQUEsUUFDSjtBQUFBLE1BQ0o7QUFFQSxZQUFNLGNBQW1DO0FBQUEsUUFDckMsUUFBUSxLQUFLLEtBQUssT0FBTztBQUFBLFFBQ3pCLFNBQVMsWUFBWSxXQUFXO0FBQUEsUUFDaEMsUUFBUTtBQUFBLFFBQ1IsT0FBTyxPQUFPLE9BQU87QUFBQSxRQUNyQixPQUFPLFlBQVksV0FBVyxhQUFhO0FBQUEsTUFDL0M7QUFFQSxVQUFJLHFCQUFxQixNQUFNLE1BQU0sc0JBQXNCLFFBQVE7QUFDbkUsVUFBSSxzQkFBc0IsTUFBTTtBQUM1QjtBQUFBLE1BQ0o7QUFFQSx5QkFBbUIsU0FBUyxhQUFhO0FBRXpDLFlBQU0sY0FBbUM7QUFBQSxRQUNyQztBQUFBLFFBQ0E7QUFBQSxRQUNBLFVBQVU7QUFBQSxNQUNkO0FBRUEsWUFBTSxzQkFBc0IsSUFBSSxlQUFlO0FBQy9DLFlBQU0sb0JBQW9CLGVBQWUsV0FBVztBQUFBLElBQ3hEO0FBQUEsSUFFQSxNQUFNLGlCQUFpQixZQUE4QixhQUFrQztBQUNuRixZQUFNLEVBQUUsTUFBTSxJQUFJO0FBRWxCLFVBQUksZUFBZSxJQUFJLDJCQUEyQjtBQUNsRCxVQUFJLFlBQVksWUFBWTtBQUN4Qix1QkFBZSxNQUFPLElBQUksbUJBQW1CLEVBQUcsb0JBQW9CO0FBRXBFLFlBQUksYUFBYSxXQUFXO0FBQ3hCO0FBQUEsUUFDSjtBQUFBLE1BQ0o7QUFFQSxZQUFNLGNBQW1DO0FBQUEsUUFDckMsUUFBUSxLQUFLLEtBQUssT0FBTztBQUFBLFFBQ3pCLFNBQVMsWUFBWSxXQUFXO0FBQUEsUUFDaEMsUUFBUSxXQUFXO0FBQUEsUUFDbkIsT0FBTyxPQUFPLE9BQU87QUFBQSxRQUNyQixPQUFPLFlBQVksV0FBVyxhQUFhO0FBQUEsTUFDL0M7QUFFQSxVQUFJLGlCQUFpQixNQUFNLE1BQU0sa0JBQWtCLFVBQVU7QUFDN0QscUJBQWUsUUFBUSxhQUFhO0FBRXBDLFlBQU0sY0FBbUM7QUFBQSxRQUNyQztBQUFBLFFBQ0E7QUFBQSxRQUNBLFVBQVU7QUFBQSxNQUNkO0FBRUEsWUFBTSxzQkFBc0IsSUFBSSxlQUFlO0FBQy9DLFlBQU0sb0JBQW9CLEtBQUssV0FBVztBQUFBLElBQzlDO0FBQUEsSUFFQSxNQUFNLGNBQWMsT0FBbUI7QUFDbkMsWUFBTSxlQUFlO0FBQ3JCLFlBQU0sVUFBVSxNQUFNO0FBQ3RCLFlBQU0sVUFBVyxTQUErQjtBQUVoRCxZQUFNLEVBQUUsVUFBVSxZQUFZLE9BQU8sSUFBSTtBQUN6QyxZQUFNLFdBQTJCLEVBQUUsTUFBTyxVQUFnQyxJQUFJLE9BQVE7QUFFdEYsY0FBUSxZQUFZO0FBQUEsUUFDaEIsS0FBSztBQUNELGlCQUFPLE1BQU0sS0FBSyxXQUFXLFFBQVE7QUFDckM7QUFBQSxRQUVKLEtBQUs7QUFDRCxpQkFBTyxNQUFNLEtBQUssVUFBVSxRQUFRO0FBQ3BDO0FBQUEsUUFFSixLQUFLO0FBQ0QsaUJBQU8sTUFBTSxLQUFLLFlBQVksUUFBUTtBQUN0QztBQUFBLFFBRUo7QUFDSTtBQUFBLE1BQ1I7QUFBQSxJQUNKO0FBQUEsSUFFQSxNQUFNLFdBQVcsVUFBeUM7QUFDdEQsWUFBTSxPQUFPLEtBQUssTUFBTSxNQUFNLElBQUksU0FBUyxFQUFFO0FBQzdDLFVBQUksQ0FBQyxNQUFNO0FBQ1A7QUFBQSxNQUNKO0FBRUEsV0FBSyxNQUFNLHdCQUF3QixRQUFRLENBQUMsS0FBSyxHQUFJLENBQUM7QUFBQSxJQUMxRDtBQUFBLElBRUEsTUFBTSxVQUFVLFVBQXlDO0FBQ3JELGNBQVEsU0FBUyxNQUFNO0FBQUEsUUFDbkIsS0FBSztBQUNELGlCQUFPLE1BQU0sS0FBSyxZQUFZLFNBQVMsRUFBRTtBQUN6QztBQUFBLFFBRUosS0FBSztBQUNELGlCQUFPLE1BQU0sS0FBSyxXQUFXLFNBQVMsRUFBRTtBQUN4QztBQUFBLFFBRUo7QUFDSTtBQUFBLE1BQ1I7QUFBQSxJQUNKO0FBQUEsSUFFQSxNQUFNLFlBQVksUUFBK0I7QUFDN0MsWUFBTSxPQUFPLEtBQUssTUFBTSxNQUFNLEtBQUssT0FBSyxFQUFFLFFBQVEsTUFBTTtBQUN4RCxVQUFJLENBQUMsTUFBTTtBQUNQO0FBQUEsTUFDSjtBQUlBLFlBQU0sS0FBSyxNQUFNLHdCQUF3QixRQUFRO0FBQUEsUUFDN0MsRUFBRSxLQUFLLEtBQUssS0FBTSxxQkFBcUIsS0FBSztBQUFBLE1BQ2hELENBQUM7QUFBQSxJQUNMO0FBQUEsSUFFQSxNQUFNLFdBQVcsUUFBK0I7QUFDNUMsWUFBTSxnQkFBZ0IsS0FBSyxNQUFNLE1BQU0sS0FBSyxPQUFNLEVBQStCLE9BQU8sY0FBYyxFQUFFLDRCQUErQjtBQUN2SSxVQUFJLGVBQWU7QUFHZjtBQUFBLE1BQ0o7QUFFQSxZQUFNLE9BQU8sS0FBSyxNQUFNLE1BQU0sS0FBSyxPQUFLLEVBQUUsUUFBUSxNQUFNO0FBQ3hELFVBQUksQ0FBQyxNQUFNO0FBQ1A7QUFBQSxNQUNKO0FBRUEsWUFBTSxLQUFLLE1BQU0sd0JBQXdCLFFBQVE7QUFBQSxRQUM3QyxFQUFFLEtBQUssS0FBSyxLQUFNLHFCQUFxQixLQUFLO0FBQUEsTUFDaEQsQ0FBQztBQUFBLElBQ0w7QUFBQSxJQUVBLE1BQU0sWUFBWSxVQUF5QztBQUN2RCxZQUFNLE9BQU8sS0FBSyxNQUFNLE1BQU07QUFBQSxRQUFLLE9BQUssRUFBRSxRQUFRLFNBQVMsTUFDbkQsRUFBc0MsVUFDdEMsRUFBc0MsT0FBTztBQUFBLE1BQ3JEO0FBRUEsVUFBSSxDQUFDLE1BQU07QUFDUDtBQUFBLE1BQ0o7QUFFQSxZQUFNLEtBQUssTUFBTSx3QkFBd0IsUUFBUTtBQUFBLFFBQzdDLEVBQUUsS0FBSyxLQUFLLEtBQU0scUJBQXFCLE1BQU07QUFBQSxNQUNqRCxDQUFDO0FBQUEsSUFDTDtBQUFBLElBRUEsTUFBTSxlQUFlLE9BQW1CO0FBQ3BDLFlBQU0sZUFBZTtBQUNyQixZQUFNLFVBQVUsTUFBTTtBQUN0QixZQUFNLFVBQVcsU0FBK0I7QUFFaEQsWUFBTSxFQUFFLFVBQVUsWUFBWSxPQUFPLElBQUk7QUFFekMsWUFBTSxjQUFtQztBQUFBLFFBQ3JDLFNBQWtCLE1BQU07QUFBQSxRQUN4QixZQUFhLE9BQU8sU0FBUyx5QkFBeUIsTUFBTTtBQUFBLE1BQ2hFO0FBRUEsVUFBSSxVQUFVLFFBQVEsVUFBVSxRQUFXO0FBQ3ZDO0FBQUEsTUFDSjtBQUVBLFlBQU0sY0FBYztBQUFBLFFBQ2hCLFFBQVEsS0FBSyxLQUFLLE9BQU87QUFBQSxRQUN6QixTQUFTLFlBQVksV0FBVztBQUFBLFFBQ2hDLFFBQVE7QUFBQSxRQUNSLE9BQU8sT0FBTyxPQUFPO0FBQUEsUUFDckIsT0FBTztBQUFBLE1BQ1g7QUFFQSxjQUFRLFlBQVk7QUFBQSxRQUNoQixLQUFLO0FBQ0QsaUJBQU8sTUFBTSxLQUFLLGVBQWUsUUFBUSxXQUFXO0FBQ3BEO0FBQUEsUUFDSixLQUFLO0FBQ0QsaUJBQU8sTUFBTSxLQUFLLFlBQVksTUFBTTtBQUNwQztBQUFBLFFBQ0osS0FBSztBQUNELGlCQUFPLE1BQU0sS0FBSyxZQUFZLE1BQU07QUFDcEM7QUFBQSxRQUNKO0FBQ0k7QUFBQSxNQUNSO0FBQUEsSUFDSjtBQUFBLElBRUEsTUFBTSxlQUFlLFNBQWlCLGFBQWtDO0FBQ3BFLFlBQU0sRUFBRSxNQUFNLElBQUk7QUFFbEIsVUFBSSxlQUFlLElBQUksMkJBQTJCO0FBQ2xELFVBQUksWUFBWSxZQUFZO0FBQ3hCLHVCQUFlLE1BQU8sSUFBSSxtQkFBbUIsRUFBRyxvQkFBb0I7QUFFcEUsWUFBSSxhQUFhLFdBQVc7QUFDeEI7QUFBQSxRQUNKO0FBQUEsTUFDSjtBQUVBLFlBQU0sY0FBbUM7QUFBQSxRQUNyQyxRQUFRLEtBQUssS0FBSyxPQUFPO0FBQUEsUUFDekIsU0FBUyxZQUFZLFdBQVc7QUFBQSxRQUNoQyxRQUFRO0FBQUEsUUFDUixPQUFPLE9BQU8sT0FBTztBQUFBLFFBQ3JCLE9BQU8sWUFBWSxXQUFXLGFBQWE7QUFBQSxNQUMvQztBQUVBLFVBQUksZ0JBQWdCLE1BQU0sTUFBTSxpQkFBaUIsT0FBTztBQUN4RCxVQUFJLGlCQUFpQixNQUFNO0FBQ3ZCO0FBQUEsTUFDSjtBQUVBLG9CQUFjLFFBQVEsYUFBYTtBQUVuQyxZQUFNLGNBQW1DO0FBQUEsUUFDckM7QUFBQSxRQUNBO0FBQUEsUUFDQSxVQUFVO0FBQUEsTUFDZDtBQUVBLFVBQUksWUFBWSxTQUFTLFFBQVEsR0FBRztBQUVoQztBQUFBLE1BQ0o7QUFFQSxZQUFNLHNCQUFzQixJQUFJLGVBQWU7QUFDL0MsWUFBTSxvQkFBb0IsS0FBSyxXQUFXO0FBQUEsSUFDOUM7QUFBQSxJQUVBLE1BQU0sWUFBWSxTQUFpQixRQUFnQixHQUFHO0FBQ2xELFlBQU0sRUFBRSxNQUFNLElBQUk7QUFFbEIsVUFBSSxRQUFRLEdBQUc7QUFDWDtBQUFBLE1BQ0o7QUFFQSxZQUFNLFFBQVMsS0FBSyxNQUFNLE1BQU0sS0FBSyxPQUFLLEVBQUUsUUFBUSxPQUFPO0FBQzNELFVBQUksQ0FBQyxPQUFPO0FBRVI7QUFBQSxNQUNKO0FBRUEsVUFBSSxNQUFNLE9BQU8sZUFBZSxHQUFHO0FBRS9CO0FBQUEsTUFDSjtBQUVBLFlBQU0sT0FBTyxjQUFjO0FBRTNCLFVBQUksTUFBTSxPQUFPLGFBQWEsR0FBRztBQUM3QixjQUFNLE9BQU8sYUFBYTtBQUFBLE1BQzlCO0FBRUEsVUFBSSxNQUFNLE9BQU8sZUFBZSxHQUFHO0FBQUEsTUFFbkM7QUFFQSxZQUFNLEtBQUssTUFBTSx3QkFBd0IsUUFBUTtBQUFBLFFBQzdDLEVBQUUsS0FBSyxNQUFNLEtBQU0scUJBQXFCLE1BQU0sT0FBTyxXQUFXO0FBQUEsTUFDcEUsQ0FBQztBQUFBLElBQ0w7QUFBQSxJQUVBLE1BQU0sWUFBWSxTQUFpQjtBQUMvQixZQUFNLFFBQVMsS0FBSyxNQUFNLE1BQU0sS0FBSyxPQUFLLEVBQUUsUUFBUSxPQUFPO0FBQzNELFVBQUksQ0FBQyxPQUFPO0FBQUEsTUFFWjtBQUVBLFlBQU0sZ0JBQWdCLE1BQU0sT0FBTyxhQUFhLE1BQU0sT0FBTztBQUM3RCxVQUFJLE1BQU0sT0FBTyxlQUFlLGVBQWU7QUFBQSxNQUUvQztBQUVBLFlBQU0sS0FBSyxNQUFNLHdCQUF3QixRQUFRO0FBQUEsUUFDN0MsRUFBRSxLQUFLLE1BQU0sS0FBTSxxQkFBcUIsY0FBYztBQUFBLE1BQzFELENBQUM7QUFBQSxJQUNMO0FBQUEsRUFDSjs7O0FDbmNBLE1BQU0seUJBQU4sY0FBdUUsc0JBQTZCO0FBQUEsSUFDaEcsV0FBb0IsaUJBQW9DO0FBQ3BELFlBQU0sZUFBZSxNQUFNO0FBQzNCLFlBQU0sZUFBZSxZQUFZLGNBQWM7QUFBQSxRQUMzQyxPQUFPO0FBQUEsUUFDUCxTQUFTLENBQUMsR0FBRyxhQUFhLFNBQVMsaUJBQWlCO0FBQUEsUUFDcEQsTUFBTTtBQUFBLFVBQ0Y7QUFBQSxZQUNJLGFBQWE7QUFBQSxZQUNiLGlCQUFpQjtBQUFBLFlBQ2pCLFNBQVM7QUFBQSxVQUNiO0FBQUEsUUFDSjtBQUFBLE1BQ0osQ0FBQztBQUVELGFBQU87QUFBQSxJQUNYO0FBQUEsSUFFQSxNQUFlLFFBQVEsVUFBeUMsQ0FBQyxHQUFnRDtBQUM3RyxZQUFNLFlBQVksTUFBTSxNQUFNLFFBQVEsT0FBTztBQUU3QyxZQUFNLEVBQUUsTUFBTSxJQUFJO0FBRWxCLGFBQU87QUFBQSxRQUNILEdBQUc7QUFBQSxRQUNILE9BQU8sTUFBTTtBQUFBLFFBQ2IsWUFBWSxNQUFNO0FBQUEsUUFDbEIsS0FBSyxNQUFNO0FBQUEsTUFDZjtBQUFBLElBQ0o7QUFBQSxJQUVBLElBQUksV0FBVztBQUNYLGFBQU87QUFBQSxJQUNYO0FBQUEsRUFDSjs7O0FDbENBLE1BQU0sdUJBQU4sY0FBbUUsc0JBQTZCO0FBQUEsRUFFaEc7OztBQ0ZBLE1BQU0sbUJBQU4sY0FBMkQsc0JBQTZCO0FBQUEsRUFFeEY7OztBQ0xPLFdBQVMsbUJBQXlCO0FBQ3JDLFNBQUssU0FBUyxTQUFTLFlBQVksbUNBQW1DO0FBQUEsTUFDbEUsTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLE1BQ1AsUUFBUTtBQUFBLE1BQ1IsU0FBUztBQUFBLE1BQ1QsTUFBTTtBQUFBLElBQ1YsQ0FBQztBQUFBLEVBQ0w7OztBQ1RBLE1BQU0seUJBQU4sTUFBNkI7QUFBQSxJQUN6QixJQUFJLHVCQUFnQztBQUNoQyxhQUFPLEtBQUssU0FBUyxJQUFJLFlBQVksaUNBQWlDO0FBQUEsSUFDMUU7QUFBQSxFQUNKOzs7QUNPQSxXQUFTLDZCQUE2QjtBQUNsQyxXQUFPLGNBQWMsaUJBQWlCO0FBQUEsRUFDMUM7QUFFTyxNQUFNLE9BQU87QUFBQSxJQUNoQixTQUFlO0FBQ1gsWUFBTSxLQUFLLFFBQVEsaUJBQWtCO0FBQ2pDLGdCQUFRLElBQUksK0JBQStCO0FBRTNDLGVBQU8sV0FBVztBQUNsQixlQUFPLFdBQVcsSUFBSSx1QkFBdUI7QUFFN0MsZUFBTyxnQkFBZ0IsUUFBUSxVQUFVO0FBQ3pDLGVBQU8sY0FBYyxZQUFZLHdCQUF3QjtBQUFBLFVBQ3JELE9BQU8sQ0FBQyxXQUFXO0FBQUEsVUFDbkIsYUFBYTtBQUFBLFFBQ2pCLENBQUM7QUFDRCxlQUFPLGNBQWMsWUFBWSxzQkFBc0I7QUFBQSxVQUNuRCxPQUFPLENBQUMsU0FBUztBQUFBLFVBQ2pCLGFBQWE7QUFBQSxRQUNqQixDQUFDO0FBQ0QsZUFBTyxjQUFjLFlBQVksa0JBQWtCO0FBQUEsVUFDL0MsT0FBTyxDQUFDLEtBQUs7QUFBQSxVQUNiLGFBQWE7QUFBQSxRQUNqQixDQUFDO0FBRUQsY0FBTSxnQkFBZ0IsUUFBUSxTQUFTO0FBQ3ZDLGNBQU0sY0FBYyxZQUFZLG1CQUFtQjtBQUFBLFVBQy9DLGFBQWE7QUFBQSxRQUNqQixDQUFDO0FBQ0QsY0FBTSxjQUFjLFlBQVksb0JBQW9CO0FBQUEsVUFDaEQsT0FBTyxDQUFDLE9BQU87QUFBQSxVQUNmLGFBQWE7QUFBQSxRQUNqQixDQUFDO0FBQ0QsY0FBTSxjQUFjLFlBQVkscUJBQXFCO0FBQUEsVUFDakQsT0FBTyxDQUFDLFFBQVE7QUFBQSxVQUNoQixhQUFhO0FBQUEsUUFDakIsQ0FBQztBQUVELG1DQUEyQjtBQUUzQix5QkFBaUI7QUFFakIsZ0JBQVEsSUFBSSw4QkFBOEI7QUFBQSxNQUM5QyxDQUFDO0FBQUEsSUFDTDtBQUFBLEVBQ0o7OztBQ3ZETyxNQUFNLGlCQUFOLGNBQWlFLE9BQWU7QUFBQSxFQUV2Rjs7O0FDQ08sTUFBTSxPQUFPO0FBQUEsSUFDaEIsU0FBZTtBQUNYLGFBQU8sTUFBTSxhQUFhO0FBQzFCLGFBQU8sTUFBTSxnQkFBZ0I7QUFDN0IsYUFBTyxLQUFLLGdCQUFnQjtBQUU1QixhQUFPLEtBQUssTUFBTSxLQUFLLFlBQVk7QUFBQSxJQUN2QztBQUFBLEVBQ0o7OztBQ1ZPLE1BQU0sZ0JBQWdCO0FBQUEsSUFDekIsU0FBZTtBQUNYLFlBQU0sWUFBa0M7QUFBQSxRQUNwQztBQUFBLFFBQ0E7QUFBQSxNQUNKO0FBQ0EsaUJBQVcsWUFBWSxXQUFXO0FBQzlCLGlCQUFTLE9BQU87QUFBQSxNQUNwQjtBQUFBLElBQ0o7QUFBQSxFQUNKOzs7QUNYQSxnQkFBYyxPQUFPOyIsCiAgIm5hbWVzIjogWyJXZWFwb25UeXBlIiwgIlJhbmdlVHlwZSIsICJTa2lsbFR5cGUiLCAiaHRtbCJdCn0K
