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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL21vZHVsZS9pdGVtL2Jhc2Uvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL3BoeXNpY2FsLWl0ZW0vc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL2FybW9yL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvYmFzZS9kb2N1bWVudC50cyIsICIuLi9zcmMvbW9kdWxlL2RhdGEudHMiLCAiLi4vc3JjL21vZHVsZS9pdGVtL3dlYXBvbi9kYXRhLnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvY3JlYXR1cmUvZG9jdW1lbnQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9jaGFyYWN0ZXIvZG9jdW1lbnQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9tb25zdGVyL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvbnBjL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9iYXNlL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9waHlzaWNhbC1pdGVtL2RvY3VtZW50LnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS9hcm1vci9kb2N1bWVudC50cyIsICIuLi9zcmMvY29tbW9uLnRzIiwgIi4uL3NyYy9tb2R1bGUvaXRlbS93ZWFwb24vZG9jdW1lbnQudHMiLCAiLi4vc3JjL3ZlcmV0ZW5vQ29uZmlnLnRzIiwgIi4uL3NyYy9wYXJ0aWFscy50cyIsICIuLi9zcmMvbW9kdWxlL2l0ZW0vd2VhcG9uL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvYmFzZS9zaGVldC50cyIsICIuLi9zcmMvbW9kdWxlL3N5c3RlbS9yb2xsLnRzIiwgIi4uL3NyYy9tb2R1bGUvdXRpbHMvdmVyZXRlbm8tcm9sbGVyLnRzIiwgIi4uL3NyYy9tb2R1bGUvZGlhbG9nL3JvbGwtZGlhbG9nLnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvY3JlYXR1cmUvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9jaGFyYWN0ZXIvc2hlZXQudHMiLCAiLi4vc3JjL21vZHVsZS9hY3Rvci9tb25zdGVyL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvYWN0b3IvbnBjL3NoZWV0LnRzIiwgIi4uL3NyYy9tb2R1bGUvc3lzdGVtL3NldHRpbmdzL2luZGV4LnRzIiwgIi4uL3NyYy9tb2R1bGUvc3lzdGVtL3NldHRpbmdzL2NsaWVudC1zZXR0aW5ncy50cyIsICIuLi9zcmMvc2NyaXB0cy9ob29rcy9pbml0LnRzIiwgIi4uL3NyYy9tb2R1bGUvY29sbGVjdGlvbi9hY3RvcnMudHMiLCAiLi4vc3JjL3NjcmlwdHMvaG9va3MvbG9hZC50cyIsICIuLi9zcmMvc2NyaXB0cy9ob29rcy9pbmRleC50cyIsICIuLi9zcmMvdmVyZXRlbm8udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBoeXNpY2FsVmVyZXRlbm9JdGVtLCBWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vSXRlbVNoZWV0PFRJdGVtIGV4dGVuZHMgVmVyZXRlbm9JdGVtPiBleHRlbmRzIEl0ZW1TaGVldDxUSXRlbT4ge1xyXG4gICAgZ2V0IGl0ZW1EYXRhKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLml0ZW0uZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgaXRlbVByb3BlcnRpZXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbS5zeXN0ZW07XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldCBkZWZhdWx0T3B0aW9ucygpIHtcclxuICAgICAgICBjb25zdCBpc1J1c3NpYW5MYW5ndWFnZSA9IGdhbWUuc2V0dGluZ3MuZ2V0KFwiY29yZVwiLCBcImxhbmd1YWdlXCIpID09ICdydSc7XHJcblxyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBtZXJnZU9iamVjdChzdXBlci5kZWZhdWx0T3B0aW9ucywge1xyXG4gICAgICAgICAgICB3aWR0aDogNTYwLFxyXG4gICAgICAgICAgICBjbGFzc2VzOiBbJ3ZlcmV0ZW5vJywgJ2l0ZW0nLCAnc2hlZXQnXVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGlmKGlzUnVzc2lhbkxhbmd1YWdlKXtcclxuICAgICAgICAgICAgb3B0aW9ucy5jbGFzc2VzLnB1c2goXCJsYW5nLXJ1XCIpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb3B0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgdGVtcGxhdGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIGBzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvaXRlbXMvJHt0aGlzLml0ZW0udHlwZX0tc2hlZXQuaGJzYDtcclxuICAgIH1cclxuXHJcbiAgICBvdmVycmlkZSBhc3luYyBnZXREYXRhKG9wdGlvbnM6IFBhcnRpYWw8RG9jdW1lbnRTaGVldE9wdGlvbnM+ID0ge30pOiBQcm9taXNlPFZlcmV0ZW5vSXRlbVNoZWV0RGF0YTxUSXRlbT4+IHtcclxuICAgICAgICBvcHRpb25zLmlkID0gdGhpcy5pZDtcclxuICAgICAgICBvcHRpb25zLmVkaXRhYmxlID0gdGhpcy5pc0VkaXRhYmxlO1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW0gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIC8vIEVucmljaCBjb250ZW50XHJcbiAgICAgICAgY29uc3QgZW5yaWNoZWRDb250ZW50OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XHJcbiAgICAgICAgY29uc3Qgcm9sbERhdGEgPSB7IC4uLnRoaXMuaXRlbS5nZXRSb2xsRGF0YSgpLCAuLi50aGlzLmFjdG9yPy5nZXRSb2xsRGF0YSgpIH07XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGl0ZW1UeXBlOiBudWxsLFxyXG4gICAgICAgICAgICBpdGVtOiBpdGVtLFxyXG4gICAgICAgICAgICBkYXRhOiBpdGVtLnN5c3RlbSxcclxuICAgICAgICAgICAgaXNQaHlzaWNhbDogZmFsc2UsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBpdGVtLkRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICBjc3NDbGFzczogdGhpcy5pc0VkaXRhYmxlID8gXCJlZGl0YWJsZVwiIDogXCJsb2NrZWRcIixcclxuICAgICAgICAgICAgZWRpdGFibGU6IHRoaXMuaXNFZGl0YWJsZSxcclxuICAgICAgICAgICAgZG9jdW1lbnQ6IGl0ZW0sXHJcbiAgICAgICAgICAgIGxpbWl0ZWQ6IHRoaXMuaXRlbS5saW1pdGVkLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB0aGlzLm9wdGlvbnMsXHJcbiAgICAgICAgICAgIG93bmVyOiB0aGlzLml0ZW0uaXNPd25lcixcclxuICAgICAgICAgICAgdGl0bGU6IHRoaXMudGl0bGUsXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgb3ZlcnJpZGUgYXN5bmMgX3VwZGF0ZU9iamVjdChldmVudDogRXZlbnQsIGZvcm1EYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBzdXBlci5fdXBkYXRlT2JqZWN0KGV2ZW50LCBmb3JtRGF0YSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0l0ZW1TaGVldERhdGE8VEl0ZW0gZXh0ZW5kcyBWZXJldGVub0l0ZW0+IGV4dGVuZHMgSXRlbVNoZWV0RGF0YTxUSXRlbT4ge1xyXG4gICAgaXRlbVR5cGU6IHN0cmluZyB8IG51bGw7XHJcbiAgICBpdGVtOiBUSXRlbTtcclxuICAgIGRhdGE6IFRJdGVtW1wic3lzdGVtXCJdO1xyXG4gICAgaXNQaHlzaWNhbDogYm9vbGVhbjtcclxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbiAgICAvLyBzeXN0ZW06IFZlcmV0ZW5vSXRlbVN5c3RlbURhdGE7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJdGVtU2hlZXRPcHRpb25zIGV4dGVuZHMgRG9jdW1lbnRTaGVldE9wdGlvbnMge1xyXG4gICAgaGFzU2lkZWJhcjogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9JdGVtU2hlZXQgfTtcclxuZXhwb3J0IHR5cGUgeyBWZXJldGVub0l0ZW1TaGVldERhdGEsIEl0ZW1TaGVldE9wdGlvbnMgfTsiLCAiaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtU2hlZXQsIFZlcmV0ZW5vSXRlbVNoZWV0RGF0YSB9IGZyb20gXCIuLi9iYXNlL3NoZWV0XCI7XHJcblxyXG5jbGFzcyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQ8VEl0ZW0gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbT4gZXh0ZW5kcyBWZXJldGVub0l0ZW1TaGVldDxUSXRlbT4ge1xyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zPzogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4pOiBQcm9taXNlPFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGE8VEl0ZW0+PiB7XHJcbiAgICAgICAgY29uc3Qgc2hlZXREYXRhID0gYXdhaXQgc3VwZXIuZ2V0RGF0YShvcHRpb25zKTtcclxuICAgICAgICBjb25zdCB7IGl0ZW0gfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIC4uLnNoZWV0RGF0YSxcclxuICAgICAgICAgICAgaXNQaHlzaWNhbDogdHJ1ZSxcclxuICAgICAgICAgICAgd2VpZ2h0OiBpdGVtLndlaWdodCxcclxuICAgICAgICAgICAgcHJpY2U6IGl0ZW0ucHJpY2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXREYXRhPFRJdGVtIGV4dGVuZHMgUGh5c2ljYWxWZXJldGVub0l0ZW0+IGV4dGVuZHMgVmVyZXRlbm9JdGVtU2hlZXREYXRhPFRJdGVtPiB7XHJcbiAgICBpc1BoeXNpY2FsOiB0cnVlO1xyXG4gICAgd2VpZ2h0OiBudW1iZXI7XHJcbiAgICBwcmljZTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgeyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQgfTtcclxuZXhwb3J0IHR5cGUgeyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXREYXRhIH07IiwgImltcG9ydCB7IFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldCwgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YSB9IGZyb20gXCIuLi9waHlzaWNhbC1pdGVtL3NoZWV0XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQXJtb3IgfSBmcm9tIFwiLi9kb2N1bWVudFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9Bcm1vclNoZWV0IGV4dGVuZHMgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0PFZlcmV0ZW5vQXJtb3I+IHtcclxuICAgIG92ZXJyaWRlIGFzeW5jIGdldERhdGEob3B0aW9ucz86IFBhcnRpYWw8RG9jdW1lbnRTaGVldE9wdGlvbnM+KTogUHJvbWlzZTxWZXJldGVub0FybW9yU2hlZXREYXRhPiB7XHJcbiAgICAgICAgY29uc3Qgc2hlZXREYXRhID0gYXdhaXQgc3VwZXIuZ2V0RGF0YShvcHRpb25zKTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBpdGVtIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBjb25zdCByZXN1bHQ6IFZlcmV0ZW5vQXJtb3JTaGVldERhdGEgPSB7XHJcbiAgICAgICAgICAgIC4uLnNoZWV0RGF0YSxcclxuICAgICAgICAgICAgYXJtb3JDbGFzczogaXRlbS5hcm1vckNsYXNzLFxyXG4gICAgICAgICAgICBxdWFsaXR5OiBpdGVtLnF1YWxpdHksXHJcbiAgICAgICAgICAgIGR1cmFiaWxpdHk6IGl0ZW0uZHVyYWJpbGl0eSxcclxuICAgICAgICAgICAgbWF4RHVyYWJpbGl0eTogaXRlbS5tYXhEdWFyYWJpbGl0eSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB0ZW1wbGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gYHN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9pdGVtcy9hcm1vci1zaGVldC5oYnNgO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Bcm1vclNoZWV0RGF0YSBleHRlbmRzIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGE8VmVyZXRlbm9Bcm1vcj4ge1xyXG4gICAgYXJtb3JDbGFzczogbnVtYmVyO1xyXG4gICAgcXVhbGl0eTogbnVtYmVyO1xyXG4gICAgZHVyYWJpbGl0eTogbnVtYmVyO1xyXG4gICAgbWF4RHVyYWJpbGl0eTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0FybW9yU2hlZXQgfTtcclxuZXhwb3J0IHR5cGUgeyBWZXJldGVub0FybW9yU2hlZXREYXRhIH07IiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3JTb3VyY2UsIFZlcmV0ZW5vQWN0b3JTeXN0ZW1EYXRhIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9BY3RvcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBBY3RvcjxUUGFyZW50PntcclxuICAgIGdldCBEZXNjcmlwdGlvbigpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5zeXN0ZW0uZGVzY3JpcHRpb24gfHwgJycpLnRyaW0oKTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQWN0b3I8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgQWN0b3I8VFBhcmVudD4ge1xyXG4gICAgY29uc3RydWN0b3I6IHR5cGVvZiBWZXJldGVub0FjdG9yO1xyXG4gICAgc3lzdGVtOiBWZXJldGVub0FjdG9yU3lzdGVtRGF0YTtcclxuXHJcbiAgICBEZXNjcmlwdGlvbjogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBWZXJldGVub0FjdG9yUHJveHkgPSBuZXcgUHJveHkoVmVyZXRlbm9BY3Rvciwge1xyXG4gICAgY29uc3RydWN0KFxyXG4gICAgICAgIF90YXJnZXQsXHJcbiAgICAgICAgYXJnczogW3NvdXJjZTogUHJlQ3JlYXRlPFZlcmV0ZW5vQWN0b3JTb3VyY2U+LCBjb250ZXh0PzogRG9jdW1lbnRDb25zdHJ1Y3Rpb25Db250ZXh0PFZlcmV0ZW5vQWN0b3JbXCJwYXJlbnRcIl0+XSxcclxuICAgICkge1xyXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IGFyZ3NbMF07XHJcbiAgICAgICAgY29uc3QgdHlwZSA9IHNvdXJjZT8udHlwZTtcclxuICAgICAgICByZXR1cm4gbmV3IENPTkZJRy5WRVJFVEVOTy5BY3Rvci5kb2N1bWVudENsYXNzZXNbdHlwZV0oLi4uYXJncyk7XHJcbiAgICB9LFxyXG59KTtcclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQWN0b3IsIFZlcmV0ZW5vQWN0b3JQcm94eSB9OyIsICJpbnRlcmZhY2UgSWRMYWJlbFR5cGU8VD4ge1xyXG4gICAgaWQ6IG51bWJlcjtcclxuICAgIGxhYmVsOiBzdHJpbmc7XHJcbiAgICB0eXBlOiBUO1xyXG59XHJcblxyXG5jbGFzcyBWZXJldGVub1JvbGxPcHRpb25zIHtcclxuICAgIHR5cGU6IFZlcmV0ZW5vUm9sbFR5cGUgPSBWZXJldGVub1JvbGxUeXBlLlJlZ3VsYXI7XHJcbiAgICBtZXNzYWdlRGF0YTogVmVyZXRlbm9NZXNzYWdlRGF0YSA9IG5ldyBWZXJldGVub01lc3NhZ2VEYXRhKCk7XHJcbiAgICByb2xsRGF0YTogVmVyZXRlbm9Sb2xsRGF0YSA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcbn1cclxuZW51bSBWZXJldGVub1JvbGxUeXBlIHtcclxuICAgIE5vbmUgPSAnbm9uZScsXHJcbiAgICBSZWd1bGFyID0gJ3JlZ3VsYXInLFxyXG4gICAgQXJtb3JCbG9jayA9ICdhcm1vci1ibG9jaycsXHJcbiAgICBBdHRhY2sgPSAnYXR0YWNrJyxcclxuICAgIEluaXRpYXRpdmUgPSAnaW5pdGlhdGl2ZScsXHJcbiAgICBEZXNwZXJhdGlvbiA9ICdkZXNwZXJhdGlvbidcclxufVxyXG5cclxuY2xhc3MgVmVyZXRlbm9NZXNzYWdlRGF0YSBpbXBsZW1lbnRzIFJvbGxPcHRpb25zIHtcclxuICAgIFtpbmRleDogc3RyaW5nXTogYW55O1xyXG4gICAgdXNlcklkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XHJcbiAgICBzcGVha2VyOiBhbnkgPSB7fTtcclxuICAgIGZsYXZvcjogc3RyaW5nID0gJyc7XHJcbiAgICBzb3VuZDogYW55IHwgbnVsbCA9IG51bGw7XHJcbiAgICBibGluZDogYm9vbGVhbiA9IGZhbHNlXHJcbn1cclxuXHJcbmNsYXNzIFZlcmV0ZW5vUm9sbERhdGEge1xyXG4gICAgZGljZTogc3RyaW5nID0gJ2QyMCc7XHJcbiAgICBwb29sOiBudW1iZXIgPSAxO1xyXG4gICAgYm9udXM6IG51bWJlciA9IDA7XHJcbiAgICBpc1NlcmlhbDogYm9vbGVhbiA9IGZhbHNlO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Sb2xsRGF0YSB7XHJcbiAgICBkaWNlOiBzdHJpbmc7XHJcbiAgICBwb29sOiBudW1iZXI7XHJcbiAgICBib251czogbnVtYmVyO1xyXG4gICAgaXNTZXJpYWw6IGJvb2xlYW47XHJcbn1cclxuXHJcbmNsYXNzIFZlcmV0ZW5vQ2hhdE9wdGlvbnMge1xyXG4gICAgaXNCbGluZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgc2hvd0RpYWxvZzogYm9vbGVhbiA9IGZhbHNlO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9DaGF0T3B0aW9ucyB7XHJcbiAgICBpc0JsaW5kOiBib29sZWFuO1xyXG4gICAgc2hvd0RpYWxvZzogYm9vbGVhbjtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgeyBJZExhYmVsVHlwZSB9XHJcbmV4cG9ydCB0eXBlIHsgVmVyZXRlbm9Sb2xsT3B0aW9ucywgVmVyZXRlbm9NZXNzYWdlRGF0YSB9XHJcbmV4cG9ydCB7IFZlcmV0ZW5vUm9sbFR5cGUsIFZlcmV0ZW5vUm9sbERhdGEsIFZlcmV0ZW5vQ2hhdE9wdGlvbnMgfSIsICJpbXBvcnQgeyBTa2lsbFR5cGUgfSBmcm9tIFwiJGNvbW1vblwiO1xyXG5pbXBvcnQgeyBCYXNlUGh5c2ljYWxJdGVtU291cmNlLCBQaHlzaWNhbFN5c3RlbVNvdXJjZSwgUGh5c2ljYWxWZXJldGVub0l0ZW1TeXN0ZW1EYXRhIH0gZnJvbSBcIi4uL3BoeXNpY2FsLWl0ZW0vZGF0YVwiO1xyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vV2VhcG9uU3lzdGVtRGF0YSBleHRlbmRzIFBoeXNpY2FsVmVyZXRlbm9JdGVtU3lzdGVtRGF0YSB7XHJcbiAgICBtb2RpZmllcjogbnVtYmVyO1xyXG4gICAgZGFtYWdlOiBudW1iZXI7XHJcbiAgICBpbml0aWF0aXZlOiBudW1iZXI7XHJcbiAgICBjcml0OiBudW1iZXI7XHJcbiAgICB3ZWFwb25UeXBlOiBXZWFwb25UeXBlLFxyXG4gICAgYXR0YWNrV2l0aDogU2tpbGxUeXBlLFxyXG4gICAgcmFuZ2U6IFJhbmdlVHlwZSxcclxuICAgIGhhc0J1cnN0OiBib29sZWFuXHJcbn1cclxuXHJcbnR5cGUgV2VhcG9uU291cmNlID0gQmFzZVBoeXNpY2FsSXRlbVNvdXJjZTxcIndlYXBvblwiLCBXZWFwb25TeXN0ZW1Tb3VyY2U+O1xyXG5cclxuaW50ZXJmYWNlIFdlYXBvblN5c3RlbVNvdXJjZSBleHRlbmRzIFBoeXNpY2FsU3lzdGVtU291cmNlIHtcclxuICAgIG1vZGlmaWVyOiBudW1iZXI7XHJcbiAgICBkYW1hZ2U6IG51bWJlcjtcclxuICAgIGluaXRpYXRpdmU6IG51bWJlcjtcclxuICAgIGNyaXQ6IG51bWJlcjtcclxuICAgIHdlYXBvblR5cGU6IFdlYXBvblR5cGUsXHJcbiAgICBhdHRhY2tXaXRoOiBTa2lsbFR5cGUsXHJcbiAgICByYW5nZTogUmFuZ2VUeXBlLFxyXG4gICAgaGFzQnVyc3Q6IGJvb2xlYW5cclxufVxyXG5cclxuZW51bSBXZWFwb25UeXBlIHtcclxuICAgIE5vbmUgPSBcIm5vbmVcIixcclxuICAgIEJyYXdsaW5nID0gXCJicmF3bGluZ1wiLFxyXG4gICAgTWVsZWUgPSBcIm1lbGVlXCIsXHJcbiAgICBSYW5nZWQgPSBcInJhbmdlZFwiXHJcbn1cclxuXHJcbmVudW0gUmFuZ2VUeXBlIHtcclxuICAgIE5vbmUgPSBcIm5vbmVcIixcclxuICAgIFBvaW50QmxhbmsgPSBcInBvaW50QmxhbmtcIixcclxuICAgIENsb3NlID0gXCJjbG9zZVwiLFxyXG4gICAgTWVkaXVtID0gXCJtZWRpdW1cIixcclxuICAgIExvbmcgPSBcImxvbmdcIixcclxuICAgIFV0bW9zdCA9IFwidXRtb3N0XCJcclxufVxyXG5cclxuZW51bSBBdHRhY2tUeXBlIHtcclxuICAgIE5vbmUgPSBcIm5vbmVcIixcclxuICAgIFJlZ3VsYXIgPSBcInJlZ3VsYXJcIixcclxuICAgIFBvd2VyID0gXCJwb3dlclwiLFxyXG4gICAgTGlnaHQgPSBcImxpZ2h0XCIsXHJcbiAgICBBaW1lZCA9IFwiYWltZWRcIixcclxuICAgIEhpcCA9IFwiaGlwXCIsXHJcbiAgICBCdXJzdCA9IFwiYnVyc3RcIlxyXG59XHJcblxyXG5leHBvcnQgeyBXZWFwb25UeXBlLCBSYW5nZVR5cGUsIEF0dGFja1R5cGUgfVxyXG5leHBvcnQgeyBWZXJldGVub1dlYXBvblN5c3RlbURhdGEsIFdlYXBvblNvdXJjZSB9IiwgImltcG9ydCB7IFZlcmV0ZW5vUm9sbERhdGEgfSBmcm9tIFwiJG1vZHVsZS9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQXJtb3IsIFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIkbW9kdWxlL2l0ZW1cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtVHlwZSB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vYmFzZS9kYXRhXCI7XHJcbmltcG9ydCB7IEF0dGFja1R5cGUsIFdlYXBvblR5cGUgfSBmcm9tIFwiJG1vZHVsZS9pdGVtL3dlYXBvbi9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vV2VhcG9uIH0gZnJvbSBcIiRtb2R1bGUvaXRlbS93ZWFwb24vZG9jdW1lbnRcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9BY3RvciB9IGZyb20gXCIuLi9pbmRleFwiO1xyXG5pbXBvcnQgeyBBdHRyaWJ1dGVzQmxvY2ssIFNraWxsc0Jsb2NrLCBTdGF0c0Jsb2NrLCBWZXJldGVub0NyZWF0dXJlU3lzdGVtRGF0YSwgV2VhcG9uQXR0YWNrSW5mbyB9IGZyb20gXCIuL2RhdGFcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9BY3RvcjxUUGFyZW50PntcclxuICAgIGdldCBTdGF0cygpOiBTdGF0c0Jsb2NrIHtcclxuICAgICAgICBjb25zdCBocCA9IHRoaXMuc3lzdGVtLnN0YXRzLmhpdFBvaW50cy52YWx1ZTtcclxuICAgICAgICBpZiAoaHAgPiB0aGlzLk1heEhwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3lzdGVtLnN0YXRzLmhpdFBvaW50cy52YWx1ZSA9IHRoaXMuTWF4SHA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB3cCA9IHRoaXMuc3lzdGVtLnN0YXRzLndpbGxQb2ludHMudmFsdWU7XHJcbiAgICAgICAgaWYgKHdwID4gdGhpcy5NYXhXcCkge1xyXG4gICAgICAgICAgICB0aGlzLnN5c3RlbS5zdGF0cy53aWxsUG9pbnRzLnZhbHVlID0gdGhpcy5NYXhXcDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5zdGF0cztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgQXR0cmlidXRlcygpOiBBdHRyaWJ1dGVzQmxvY2sge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5hdHRyaWJ1dGVzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBTa2lsbHMoKTogU2tpbGxzQmxvY2sge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5za2lsbHM7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IE1heEhwKCk6IG51bWJlciB7XHJcbiAgICAgICAgY29uc3QgY29uc3RpdHV0aW9uVmFsdWUgPSB0aGlzLkF0dHJpYnV0ZXMuY29uc3RpdHV0aW9uLnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IGRleHRlcml0eVZhbHVlID0gdGhpcy5BdHRyaWJ1dGVzLmRleHRlcml0eS52YWx1ZTtcclxuICAgICAgICBjb25zdCBib251c2VzID0gMDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGNvbnN0aXR1dGlvblZhbHVlICsgZGV4dGVyaXR5VmFsdWUgKyBib251c2VzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBNYXhXcCgpOiBudW1iZXIge1xyXG4gICAgICAgIGNvbnN0IGludGVsbGlnZW5jZVZhbHVlID0gdGhpcy5BdHRyaWJ1dGVzLmludGVsbGlnZW5jZS52YWx1ZTtcclxuICAgICAgICBjb25zdCBlbXBhdGh5VmFsdWUgPSB0aGlzLkF0dHJpYnV0ZXMuZW1wYXRoeS52YWx1ZTtcclxuICAgICAgICBjb25zdCBib251c2VzID0gMDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGludGVsbGlnZW5jZVZhbHVlICsgZW1wYXRoeVZhbHVlICsgYm9udXNlcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFx1MDQxOFx1MDQzQ1x1MDQzNVx1MDQ0RVx1MDQ0OVx1MDQzNVx1MDQzNVx1MDQ0MVx1MDQ0RiBcdTA0M0VcdTA0NDBcdTA0NDNcdTA0MzZcdTA0MzhcdTA0MzUuXHJcbiAgICAgKi9cclxuICAgIGdldCBXZWFwb25zKCk6IFZlcmV0ZW5vV2VhcG9uW10ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLml0ZW1zLm1hcCh4ID0+IHggYXMgdW5rbm93biBhcyBWZXJldGVub0l0ZW0pLmZpbHRlcih4ID0+IHgudHlwZSA9PSBWZXJldGVub0l0ZW1UeXBlLldlYXBvbikubWFwKHggPT4geCBhcyBWZXJldGVub1dlYXBvbik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcdTA0MkRcdTA0M0FcdTA0MzhcdTA0M0ZcdTA0MzhcdTA0NDBcdTA0M0VcdTA0MzJcdTA0MzBcdTA0M0RcdTA0M0RcdTA0M0VcdTA0MzUgXHUwNDNFXHUwNDQwXHUwNDQzXHUwNDM2XHUwNDM4XHUwNDM1LlxyXG4gICAgICovXHJcbiAgICBnZXQgRXF1aXBwZWRXZWFwb25zKCk6IFZlcmV0ZW5vV2VhcG9uW10ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLldlYXBvbnMuZmlsdGVyKHggPT4geC5zeXN0ZW0uaXNFcXVpcHBlZCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcdTA0MThcdTA0M0NcdTA0MzVcdTA0NEVcdTA0NDlcdTA0MzBcdTA0NEZcdTA0NDFcdTA0NEYgXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDNEXHUwNDRGLlxyXG4gICAgICovXHJcbiAgICBnZXQgQXJtb3JzKCk6IFZlcmV0ZW5vQXJtb3JbXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXMubWFwKHggPT4geCBhcyB1bmtub3duIGFzIFZlcmV0ZW5vSXRlbSkuZmlsdGVyKHggPT4geC50eXBlID09IFZlcmV0ZW5vSXRlbVR5cGUuQXJtb3IpLm1hcCh4ID0+IHggYXMgVmVyZXRlbm9Bcm1vcik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcdTA0MkRcdTA0M0FcdTA0MzhcdTA0M0ZcdTA0MzhcdTA0NDBcdTA0M0VcdTA0MzJcdTA0MzBcdTA0M0RcdTA0M0RcdTA0MzBcdTA0NEYgXHUwNDMxXHUwNDQwXHUwNDNFXHUwNDNEXHUwNDRGLlxyXG4gICAgICovXHJcbiAgICBnZXQgRXF1aXBwZWRBcm1vcigpOiBWZXJldGVub0FybW9yIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5Bcm1vcnMuZmlsdGVyKHggPT4geC5zeXN0ZW0uaXNFcXVpcHBlZClbMF0gfHwgbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBnZXRBdHRyaWJ1dGVSb2xsRGF0YShrZXk6IHN0cmluZyk6IFByb21pc2U8VmVyZXRlbm9Sb2xsRGF0YT4ge1xyXG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IHRoaXMuQXR0cmlidXRlc1trZXldO1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcbiAgICAgICAgaWYgKGF0dHJpYnV0ZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB2YWx1ZSA9IGF0dHJpYnV0ZS52YWx1ZTtcclxuICAgICAgICBjb25zdCBib251c2VzID0gMDtcclxuICAgICAgICByZXN1bHQucG9vbCA9IHZhbHVlICsgYm9udXNlcztcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBnZXRTa2lsbFJvbGxEYXRhKGtleTogc3RyaW5nKTogUHJvbWlzZTxWZXJldGVub1JvbGxEYXRhPiB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IFZlcmV0ZW5vUm9sbERhdGEoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2tpbGwgPSB0aGlzLlNraWxsc1trZXldO1xyXG4gICAgICAgIGlmIChza2lsbCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBhdHRyaWJ1dGVSb2xsRGF0YSA9IGF3YWl0IHRoaXMuZ2V0QXR0cmlidXRlUm9sbERhdGEoc2tpbGwuYXR0cmlidXRlKTtcclxuXHJcbiAgICAgICAgY29uc3QgdmFsdWUgPSBza2lsbC52YWx1ZTtcclxuICAgICAgICBjb25zdCBib251c2VzID0gMDtcclxuICAgICAgICByZXN1bHQucG9vbCA9IGF0dHJpYnV0ZVJvbGxEYXRhLnBvb2wgKyB2YWx1ZSArIGJvbnVzZXM7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2V0V2VhcG9uUm9sbERhdGEod2VhcG9uRGF0YTogV2VhcG9uQXR0YWNrSW5mbyk6IFByb21pc2U8VmVyZXRlbm9Sb2xsRGF0YT4ge1xyXG4gICAgICAgIGxldCBpdGVtID0gdGhpcy5pdGVtcy5nZXQod2VhcG9uRGF0YS5pZCkgYXMgdW5rbm93biBhcyBWZXJldGVub1dlYXBvbjtcclxuXHJcbiAgICAgICAgbGV0IGl0ZW1Ta2lsbCA9IGl0ZW0uc3lzdGVtLmF0dGFja1dpdGg7XHJcbiAgICAgICAgbGV0IHNraWxsUm9sbERhdGEgPSBhd2FpdCB0aGlzLmdldFNraWxsUm9sbERhdGEoaXRlbVNraWxsKTtcclxuXHJcbiAgICAgICAgbGV0IHdlYXBvbkF0dGFja1R5cGVNb2RpZmllciA9IHRoaXMuZ2V0V2VhcG9uQXR0YWNrVHlwZU1vZGlmaWVyKHdlYXBvbkRhdGEpO1xyXG5cclxuICAgICAgICBsZXQgd2VhcG9uQXR0YWNrTW9kaWZpZXIgPSBpdGVtLnN5c3RlbS5tb2RpZmllcjtcclxuXHJcbiAgICAgICAgbGV0IHdlYXBvbkRhbWFnZSA9IGl0ZW0uc3lzdGVtLmRhbWFnZTtcclxuXHJcbiAgICAgICAgY29uc3Qgcm9sbERhdGE6IFZlcmV0ZW5vUm9sbERhdGEgPSBtZXJnZU9iamVjdChza2lsbFJvbGxEYXRhLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwb29sOiBza2lsbFJvbGxEYXRhLnBvb2wgKyB3ZWFwb25BdHRhY2tUeXBlTW9kaWZpZXIgKyB3ZWFwb25BdHRhY2tNb2RpZmllcixcclxuICAgICAgICAgICAgICAgIHdlYXBvbkRhbWFnZSxcclxuICAgICAgICAgICAgICAgIHdlYXBvbkF0dGFja01vZGlmaWVyXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAod2VhcG9uRGF0YS5hdHRhY2tUeXBlID09IEF0dGFja1R5cGUuQnVyc3QpIHtcclxuICAgICAgICAgICAgcm9sbERhdGEuaXNTZXJpYWwgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJvbGxEYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFdlYXBvbkF0dGFja1R5cGVNb2RpZmllcih3ZWFwb25EYXRhOiBXZWFwb25BdHRhY2tJbmZvKTogbnVtYmVyIHtcclxuICAgICAgICBpZiAod2VhcG9uRGF0YS53ZWFwb25UeXBlID09IFdlYXBvblR5cGUuTWVsZWUgfHwgd2VhcG9uRGF0YS53ZWFwb25UeXBlID09IFdlYXBvblR5cGUuQnJhd2xpbmcpIHtcclxuICAgICAgICAgICAgaWYgKHdlYXBvbkRhdGEuYXR0YWNrVHlwZSA9PSBBdHRhY2tUeXBlLlBvd2VyKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHdlYXBvbkRhdGEuYXR0YWNrVHlwZSA9PSBBdHRhY2tUeXBlLkxpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gLTI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHdlYXBvbkRhdGEud2VhcG9uVHlwZSA9PSBXZWFwb25UeXBlLlJhbmdlZCkge1xyXG4gICAgICAgICAgICBpZiAod2VhcG9uRGF0YS5hdHRhY2tUeXBlID09IEF0dGFja1R5cGUuQWltZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAyO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAod2VhcG9uRGF0YS5hdHRhY2tUeXBlID09IEF0dGFja1R5cGUuSGlwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gLTI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh3ZWFwb25EYXRhLmF0dGFja1R5cGUgPT0gQXR0YWNrVHlwZS5CdXJzdCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIC0yO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGdldEFybW9yUm9sbERhdGEoaXRlbUlkOiBzdHJpbmcpOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERhdGEgfCBudWxsPiB7XHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IFZlcmV0ZW5vUm9sbERhdGEoKTtcclxuICAgICAgICBsZXQgaXRlbSA9ICh0aGlzLml0ZW1zLmdldChpdGVtSWQpIGFzIHVua25vd24gYXMgVmVyZXRlbm9Bcm1vcik7XHJcblxyXG4gICAgICAgIGlmICghaXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc3VsdC5wb29sID0gaXRlbS5zeXN0ZW0uZHVyYWJpbGl0eVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGdldEluaXRpYXRpdmVSb2xsRGF0YShpdGVtSWQ6IHN0cmluZyk6IFByb21pc2U8VmVyZXRlbm9Sb2xsRGF0YT4ge1xyXG4gICAgICAgIGxldCBpdGVtID0gKHRoaXMuaXRlbXMuZ2V0KGl0ZW1JZCkgYXMgdW5rbm93biBhcyBWZXJldGVub1dlYXBvbik7XHJcblxyXG4gICAgICAgIGxldCBza2lsbCA9IHRoaXMuU2tpbGxzLmFnaWxpdHk7XHJcblxyXG4gICAgICAgIGxldCBib251c2VzID0gMDtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IFZlcmV0ZW5vUm9sbERhdGEoKTtcclxuICAgICAgICByZXN1bHQucG9vbCA9IDE7XHJcbiAgICAgICAgcmVzdWx0LmJvbnVzID0gc2tpbGwudmFsdWUgKyBpdGVtLnN5c3RlbS5tb2RpZmllciArIGJvbnVzZXM7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXF1aXBXZWFwb24oKSB7IH1cclxuXHJcbiAgICBhc3luYyBlcXVpcEFybW9yKCkgeyB9XHJcblxyXG4gICAgYXN5bmMgdW5lcXVpcEl0ZW0oKSB7IH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9BY3RvcjxUUGFyZW50PiB7XHJcbiAgICBzeXN0ZW06IFZlcmV0ZW5vQ3JlYXR1cmVTeXN0ZW1EYXRhLFxyXG4gICAgU3RhdHM6IFN0YXRzQmxvY2s7XHJcbiAgICBBdHRyaWJ1dGVzOiBBdHRyaWJ1dGVzQmxvY2s7XHJcbiAgICBTa2lsbHM6IFNraWxsc0Jsb2NrO1xyXG4gICAgTWF4SHA6IG51bWJlcjtcclxuICAgIE1heFdwOiBudW1iZXI7XHJcbiAgICBXZWFwb25zOiBWZXJldGVub1dlYXBvbltdO1xyXG4gICAgQXJtb3JzOiBWZXJldGVub0FybW9yW107XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmUgfSIsICJpbXBvcnQgeyBWZXJldGVub0NyZWF0dXJlIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ2hhcmFjdGVyU3lzdGVtRGF0YSB9IGZyb20gXCIuL2RhdGFcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vQ2hhcmFjdGVyPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudD57XHJcbiAgICBnZXQgTW9uZXkoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ubW9uZXkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgUmVwdXRhdGlvbigpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5yZXB1dGF0aW9uIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IEV4cCgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5leHAgfHwgMDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQ2hhcmFjdGVyPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudD4ge1xyXG4gICAgc3lzdGVtOiBWZXJldGVub0NoYXJhY3RlclN5c3RlbURhdGE7XHJcblxyXG4gICAgTW9uZXk6IG51bWJlcjtcclxuICAgIFJlcHV0YXRpb246IG51bWJlcjtcclxuICAgIEV4cDogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0NoYXJhY3RlciB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmUgfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vTW9uc3RlcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQ+e1xyXG5cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vTW9uc3RlcjxUUGFyZW50IGV4dGVuZHMgVG9rZW5Eb2N1bWVudCB8IG51bGwgPSBUb2tlbkRvY3VtZW50IHwgbnVsbD4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlPFRQYXJlbnQ+IHtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vTW9uc3RlciB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmUgfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vTnBjPFRQYXJlbnQgZXh0ZW5kcyBUb2tlbkRvY3VtZW50IHwgbnVsbCA9IFRva2VuRG9jdW1lbnQgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmU8VFBhcmVudD57XHJcblxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9OcGM8VFBhcmVudCBleHRlbmRzIFRva2VuRG9jdW1lbnQgfCBudWxsID0gVG9rZW5Eb2N1bWVudCB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZTxUUGFyZW50PiB7XHJcblxyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub05wYyB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3IgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW1Tb3VyY2UsIFZlcmV0ZW5vSXRlbVN5c3RlbURhdGEgfSBmcm9tIFwiLi9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vSXRlbVNoZWV0IH0gZnJvbSBcIi4vc2hlZXRcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vSXRlbTxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBJdGVtPFRQYXJlbnQ+e1xyXG4gICAgZ2V0IGRhdGEoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucHJlcGFyZURhdGEoKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgRGVzY3JpcHRpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICh0aGlzLnN5c3RlbS5kZXNjcmlwdGlvbiB8fCAnJykudHJpbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBLZWVwIGBUZXh0RWRpdG9yYCBhbmQgYW55dGhpbmcgZWxzZSB1cCB0byBubyBnb29kIGZyb20gc2V0dGluZyB0aGlzIGl0ZW0ncyBkZXNjcmlwdGlvbiB0byBgbnVsbGAgKi9cclxuICAgIHByb3RlY3RlZCBvdmVycmlkZSBhc3luYyBfcHJlVXBkYXRlKFxyXG4gICAgICAgIGNoYW5nZWQ6IERlZXBQYXJ0aWFsPHRoaXNbXCJfc291cmNlXCJdPixcclxuICAgICAgICBvcHRpb25zOiBEb2N1bWVudFVwZGF0ZUNvbnRleHQ8VFBhcmVudD4sXHJcbiAgICAgICAgdXNlcjogVXNlcixcclxuICAgICk6IFByb21pc2U8Ym9vbGVhbiB8IHZvaWQ+IHtcclxuICAgICAgICByZXR1cm4gc3VwZXIuX3ByZVVwZGF0ZShjaGFuZ2VkLCBvcHRpb25zLCB1c2VyKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqIFJlZnJlc2ggdGhlIEl0ZW0gRGlyZWN0b3J5IGlmIHRoaXMgaXRlbSBpc24ndCBlbWJlZGRlZCAqL1xyXG4gICAgcHJvdGVjdGVkIG92ZXJyaWRlIF9vblVwZGF0ZShcclxuICAgICAgICBkYXRhOiBEZWVwUGFydGlhbDx0aGlzW1wiX3NvdXJjZVwiXT4sXHJcbiAgICAgICAgb3B0aW9uczogRG9jdW1lbnRNb2RpZmljYXRpb25Db250ZXh0PFRQYXJlbnQ+LFxyXG4gICAgICAgIHVzZXJJZDogc3RyaW5nLFxyXG4gICAgKTogdm9pZCB7XHJcbiAgICAgICAgc3VwZXIuX29uVXBkYXRlKGRhdGEsIG9wdGlvbnMsIHVzZXJJZCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0l0ZW08VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgSXRlbTxUUGFyZW50PiB7XHJcbiAgICBjb25zdHJ1Y3RvcjogdHlwZW9mIFZlcmV0ZW5vSXRlbTtcclxuICAgIHN5c3RlbTogVmVyZXRlbm9JdGVtU3lzdGVtRGF0YTtcclxuXHJcbiAgICBEZXNjcmlwdGlvbjogc3RyaW5nO1xyXG5cclxuICAgIF9zaGVldDogVmVyZXRlbm9JdGVtU2hlZXQ8dGhpcz4gfCBudWxsO1xyXG5cclxuICAgIGdldCBzaGVldCgpOiBWZXJldGVub0l0ZW1TaGVldDx0aGlzPjtcclxuXHJcbiAgICBwcmVwYXJlU2libGluZ0RhdGE/KHRoaXM6IFZlcmV0ZW5vSXRlbTxWZXJldGVub0FjdG9yPik6IHZvaWQ7XHJcbiAgICBwcmVwYXJlQWN0b3JEYXRhPyh0aGlzOiBWZXJldGVub0l0ZW08VmVyZXRlbm9BY3Rvcj4pOiB2b2lkO1xyXG4gICAgLyoqIE9wdGlvbmFsIGRhdGEtcHJlcGFyYXRpb24gY2FsbGJhY2sgZXhlY3V0ZWQgYWZ0ZXIgcnVsZS1lbGVtZW50IHN5bnRoZXRpY3MgYXJlIHByZXBhcmVkICovXHJcbiAgICBvblByZXBhcmVTeW50aGV0aWNzPyh0aGlzOiBWZXJldGVub0l0ZW08VmVyZXRlbm9BY3Rvcj4pOiB2b2lkO1xyXG5cclxuICAgIC8qKiBSZXR1cm5zIGl0ZW1zIHRoYXQgc2hvdWxkIGFsc28gYmUgYWRkZWQgd2hlbiB0aGlzIGl0ZW0gaXMgY3JlYXRlZCAqL1xyXG4gICAgY3JlYXRlR3JhbnRlZEl0ZW1zPyhvcHRpb25zPzogb2JqZWN0KTogUHJvbWlzZTxWZXJldGVub0l0ZW1bXT47XHJcblxyXG4gICAgLyoqIFJldHVybnMgaXRlbXMgdGhhdCBzaG91bGQgYWxzbyBiZSBkZWxldGVkIHNob3VsZCB0aGlzIGl0ZW0gYmUgZGVsZXRlZCAqL1xyXG4gICAgZ2V0TGlua2VkSXRlbXM/KCk6IFZlcmV0ZW5vSXRlbTxWZXJldGVub0FjdG9yPltdO1xyXG59XHJcblxyXG5jb25zdCBWZXJldGVub0l0ZW1Qcm94eSA9IG5ldyBQcm94eShWZXJldGVub0l0ZW0sIHtcclxuICAgIGNvbnN0cnVjdChcclxuICAgICAgICBfdGFyZ2V0LFxyXG4gICAgICAgIGFyZ3M6IFtzb3VyY2U6IFByZUNyZWF0ZTxWZXJldGVub0l0ZW1Tb3VyY2U+LCBjb250ZXh0PzogRG9jdW1lbnRDb25zdHJ1Y3Rpb25Db250ZXh0PFZlcmV0ZW5vQWN0b3IgfCBudWxsPl0sXHJcbiAgICApIHtcclxuICAgICAgICBjb25zdCBzb3VyY2UgPSBhcmdzWzBdO1xyXG4gICAgICAgIGNvbnN0IHR5cGUgPSBzb3VyY2U/LnR5cGU7XHJcbiAgICAgICAgY29uc3QgSXRlbUNsYXNzOiB0eXBlb2YgVmVyZXRlbm9JdGVtID0gQ09ORklHLlZFUkVURU5PLkl0ZW0uZG9jdW1lbnRDbGFzc2VzW3R5cGVdID8/IFZlcmV0ZW5vSXRlbTtcclxuICAgICAgICByZXR1cm4gbmV3IEl0ZW1DbGFzcyguLi5hcmdzKTtcclxuICAgIH0sXHJcbn0pO1xyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9JdGVtLCBWZXJldGVub0l0ZW1Qcm94eSB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3IgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW1TeXN0ZW1EYXRhIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgUGh5c2ljYWxWZXJldGVub0l0ZW08VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgVmVyZXRlbm9JdGVtPFRQYXJlbnQ+IHtcclxuICAgIGdldCB3ZWlnaHQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLndlaWdodCB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBwcmljZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ucHJpY2UgfHwgMDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFBoeXNpY2FsVmVyZXRlbm9JdGVtPFRQYXJlbnQgZXh0ZW5kcyBWZXJldGVub0FjdG9yIHwgbnVsbCA9IFZlcmV0ZW5vQWN0b3IgfCBudWxsPiBleHRlbmRzIFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBzeXN0ZW06IFBoeXNpY2FsVmVyZXRlbm9JdGVtU3lzdGVtRGF0YTtcclxufVxyXG5cclxuZXhwb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0gfTsiLCAiaW1wb3J0IHsgVmVyZXRlbm9BY3RvciB9IGZyb20gXCIkbW9kdWxlL2FjdG9yXCI7XHJcbmltcG9ydCB7IFBoeXNpY2FsVmVyZXRlbm9JdGVtIH0gZnJvbSBcIi4uL2luZGV4XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQXJtb3JTeXN0ZW1EYXRhIH0gZnJvbSBcIi4vZGF0YVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9Bcm1vcjxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBnZXQgYXJtb3JDbGFzcygpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5hcm1vckNsYXNzIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHF1YWxpdHkoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ucXVhbGl0eSB8fCAwO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBtYXhEdWFyYWJpbGl0eSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFybW9yQ2xhc3MgKyB0aGlzLnF1YWxpdHk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGR1cmFiaWxpdHkoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uZHVyYWJpbGl0eSB8fCB0aGlzLm1heER1YXJhYmlsaXR5O1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Bcm1vcjxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBzeXN0ZW06IFZlcmV0ZW5vQXJtb3JTeXN0ZW1EYXRhO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0FybW9yIH0iLCAiZW51bSBTa2lsbFR5cGUge1xyXG4gICAgTm9uZSA9IFwibm9uZVwiLFxyXG4gICAgTWVsZWUgPSBcIm1lbGVlXCIsXHJcbiAgICBTdHJlbmd0aCA9IFwic3RyZW5ndGhcIixcclxuICAgIEFnaWxpdHkgPSBcImFnaWxpdHlcIixcclxuICAgIFBpbG90aW5nID0gXCJwaWxvdGluZ1wiLFxyXG4gICAgU3RlYWx0aCA9IFwic3RlYWx0aFwiLFxyXG4gICAgUmFuZ2VkID0gXCJyYW5nZWRcIixcclxuICAgIEN5YmVyc2hhbWFuaXNtID0gXCJjeWJlcnNoYW1hbmlzbVwiLFxyXG4gICAgU3Vydml2YWwgPSBcInN1cnZpdmFsXCIsXHJcbiAgICBNZWRpY2luZSA9IFwibWVkaWNpbmVcIixcclxuICAgIE9ic2VydmF0aW9uID0gXCJvYnNlcnZhdGlvblwiLFxyXG4gICAgU2NpZW5jZSA9IFwic2NpZW5jZVwiLFxyXG4gICAgTWVjaGFuaWNzID0gXCJtZWNoYW5pY3NcIixcclxuICAgIE1hbmlwdWxhdGlvbiA9IFwibWFuaXB1bGF0aW9uXCIsXHJcbiAgICBMZWFkZXJzaGlwID0gXCJsZWFkZXJzaGlwXCIsXHJcbiAgICBXaXRjaGNyYWZ0ID0gXCJ3aXRjaGNyYWZ0XCIsXHJcbiAgICBDdWx0dXJlID0gXCJjdWx0dXJlXCIsXHJcbn07XHJcblxyXG5pbnRlcmZhY2UgSURpY3Rpb25hcnk8VD4ge1xyXG4gICAgW2luZGV4OiBzdHJpbmddOiBUXHJcbn1cclxuXHJcbmV4cG9ydCB7IFNraWxsVHlwZSB9XHJcbmV4cG9ydCB0eXBlIHsgSURpY3Rpb25hcnkgfSIsICJpbXBvcnQgeyBTa2lsbFR5cGUgfSBmcm9tIFwiJGNvbW1vblwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIiRtb2R1bGUvYWN0b3JcIjtcclxuaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0gfSBmcm9tIFwiLi4vaW5kZXhcIjtcclxuaW1wb3J0IHsgV2VhcG9uVHlwZSwgUmFuZ2VUeXBlLCBWZXJldGVub1dlYXBvblN5c3RlbURhdGEgfSBmcm9tIFwiLi9kYXRhXCI7XHJcblxyXG5jbGFzcyBWZXJldGVub1dlYXBvbjxUUGFyZW50IGV4dGVuZHMgVmVyZXRlbm9BY3RvciB8IG51bGwgPSBWZXJldGVub0FjdG9yIHwgbnVsbD4gZXh0ZW5kcyBQaHlzaWNhbFZlcmV0ZW5vSXRlbTxUUGFyZW50PiB7XHJcbiAgICBnZXQgTW9kaWZpZXIoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0ubW9kaWZpZXI7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IERhbWFnZSgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5kYW1hZ2U7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IEluaXRpYXRpdmUoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zeXN0ZW0uaW5pdGlhdGl2ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgQ3JpdCgpOiBudW1iZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5jcml0O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBXZWFwb25UeXBlKCk6IFdlYXBvblR5cGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS53ZWFwb25UeXBlIHx8IFdlYXBvblR5cGUuTm9uZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgQXR0YWNrV2l0aCgpOiBTa2lsbFR5cGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5hdHRhY2tXaXRoIHx8IFNraWxsVHlwZS5Ob25lO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBSYW5nZSgpOiBSYW5nZVR5cGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN5c3RlbS5yYW5nZSB8fCBSYW5nZVR5cGUuTm9uZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgSGFzQnVyc3QoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3lzdGVtLmhhc0J1cnN0IHx8IGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9XZWFwb248VFBhcmVudCBleHRlbmRzIFZlcmV0ZW5vQWN0b3IgfCBudWxsID0gVmVyZXRlbm9BY3RvciB8IG51bGw+IGV4dGVuZHMgUGh5c2ljYWxWZXJldGVub0l0ZW08VFBhcmVudD4ge1xyXG4gICAgc3lzdGVtOiBWZXJldGVub1dlYXBvblN5c3RlbURhdGE7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vV2VhcG9uIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9DaGFyYWN0ZXIsIFZlcmV0ZW5vTW9uc3RlciwgVmVyZXRlbm9OcGMgfSBmcm9tIFwiJG1vZHVsZS9hY3RvclwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FybW9yIH0gZnJvbSBcIiRtb2R1bGUvaXRlbVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub1dlYXBvbiB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vd2VhcG9uL2RvY3VtZW50XCI7XHJcblxyXG5leHBvcnQgY29uc3QgVkVSRVRFTk9DT05GSUcgPSB7XHJcbiAgICBjb21tb246IHtcclxuICAgICAgICBwcmljZTogXCJ2ZXJldGVuby5jb21tb24ucHJpY2VcIixcclxuICAgIH0sXHJcbiAgICB0YWJzOiB7XHJcbiAgICAgICAgc3RhdDogXCJ2ZXJldGVuby50YWIuc3RhdFwiLFxyXG4gICAgICAgIGVxdWlwbWVudDogXCJ2ZXJldGVuby50YWIuZXF1aXBtZW50XCIsXHJcbiAgICAgICAgZmlnaHQ6IFwidmVyZXRlbm8udGFiLmZpZ2h0XCIsXHJcbiAgICAgICAgYmlvOiBcInZlcmV0ZW5vLnRhYi5iaW9cIlxyXG4gICAgfSxcclxuICAgIHdlYXBvblR5cGVzOiB7XHJcbiAgICAgICAgbm9uZTogXCJ2ZXJldGVuby53ZWFwb25UeXBlLm5vbmVcIixcclxuICAgICAgICBicmF3bGluZzogXCJ2ZXJldGVuby53ZWFwb25UeXBlLmJyYXdsaW5nXCIsXHJcbiAgICAgICAgbWVsZWU6IFwidmVyZXRlbm8ud2VhcG9uVHlwZS5tZWxlZVwiLFxyXG4gICAgICAgIHJhbmdlZDogXCJ2ZXJldGVuby53ZWFwb25UeXBlLnJhbmdlZFwiLFxyXG4gICAgfSxcclxuICAgIHJhbmdlVHlwZXM6IHtcclxuICAgICAgICBwb2ludEJsYW5rOiBcInZlcmV0ZW5vLnJhbmdlLnBvaW50QmxhbmtcIixcclxuICAgICAgICBjbG9zZTogXCJ2ZXJldGVuby5yYW5nZS5jbG9zZVwiLFxyXG4gICAgICAgIG1lZGl1bTogXCJ2ZXJldGVuby5yYW5nZS5tZWRpdW1cIixcclxuICAgICAgICBsb25nOiBcInZlcmV0ZW5vLnJhbmdlLmxvbmdcIixcclxuICAgICAgICB1dG1vc3Q6IFwidmVyZXRlbm8ucmFuZ2UudXRtb3N0XCJcclxuICAgIH0sXHJcbiAgICBzdGF0czoge1xyXG4gICAgICAgIGhpdFBvaW50czogXCJ2ZXJldGVuby5zdGF0LmhpdFBvaW50XCIsXHJcbiAgICAgICAgd2lsbFBvaW50czogXCJ2ZXJldGVuby5zdGF0LndpbGxQb2ludFwiLFxyXG4gICAgICAgIHJlcHV0YXRpb246IFwidmVyZXRlbm8uc3RhdC5yZXB1dGF0aW9uXCJcclxuICAgIH0sXHJcbiAgICBhdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgY29uc3RpdHV0aW9uOiBcInZlcmV0ZW5vLmF0dHJpYnV0ZS5jb25zdGl0dXRpb25cIixcclxuICAgICAgICBpbnRlbGxpZ2VuY2U6IFwidmVyZXRlbm8uYXR0cmlidXRlLmludGVsbGlnZW5jZVwiLFxyXG4gICAgICAgIGRleHRlcml0eTogXCJ2ZXJldGVuby5hdHRyaWJ1dGUuZGV4dGVyaXR5XCIsXHJcbiAgICAgICAgZW1wYXRoeTogXCJ2ZXJldGVuby5hdHRyaWJ1dGUuZW1wYXRoeVwiXHJcbiAgICB9LFxyXG4gICAgc2tpbGxzOiB7XHJcbiAgICAgICAgbWVsZWU6IFwidmVyZXRlbm8uc2tpbGwubWVsZWVcIixcclxuICAgICAgICBzdHJlbmd0aDogXCJ2ZXJldGVuby5za2lsbC5zdHJlbmd0aFwiLFxyXG4gICAgICAgIGFnaWxpdHk6IFwidmVyZXRlbm8uc2tpbGwuYWdpbGl0eVwiLFxyXG4gICAgICAgIHBpbG90aW5nOiBcInZlcmV0ZW5vLnNraWxsLnBpbG90aW5nXCIsXHJcbiAgICAgICAgc3RlYWx0aDogXCJ2ZXJldGVuby5za2lsbC5zdGVhbHRoXCIsXHJcbiAgICAgICAgcmFuZ2VkOiBcInZlcmV0ZW5vLnNraWxsLnJhbmdlZFwiLFxyXG4gICAgICAgIGN5YmVyc2hhbWFuaXNtOiBcInZlcmV0ZW5vLnNraWxsLmN5YmVyc2hhbWFuaXNtXCIsXHJcbiAgICAgICAgc3Vydml2YWw6IFwidmVyZXRlbm8uc2tpbGwuc3Vydml2YWxcIixcclxuICAgICAgICBtZWRpY2luZTogXCJ2ZXJldGVuby5za2lsbC5tZWRpY2luZVwiLFxyXG4gICAgICAgIG9ic2VydmF0aW9uOiBcInZlcmV0ZW5vLnNraWxsLm9ic2VydmF0aW9uXCIsXHJcbiAgICAgICAgc2NpZW5jZTogXCJ2ZXJldGVuby5za2lsbC5zY2llbmNlXCIsXHJcbiAgICAgICAgbWVjaGFuaWNzOiBcInZlcmV0ZW5vLnNraWxsLm1lY2hhbmljc1wiLFxyXG4gICAgICAgIG1hbmlwdWxhdGlvbjogXCJ2ZXJldGVuby5za2lsbC5tYW5pcHVsYXRpb25cIixcclxuICAgICAgICBsZWFkZXJzaGlwOiBcInZlcmV0ZW5vLnNraWxsLmxlYWRlcnNoaXBcIixcclxuICAgICAgICB3aXRjaGNyYWZ0OiBcInZlcmV0ZW5vLnNraWxsLndpdGNoY3JhZnRcIixcclxuICAgICAgICBjdWx0dXJlOiBcInZlcmV0ZW5vLnNraWxsLmN1bHR1cmVcIlxyXG4gICAgfSxcclxuXHJcbiAgICBJdGVtOiB7XHJcbiAgICAgICAgZG9jdW1lbnRDbGFzc2VzOiB7XHJcbiAgICAgICAgICAgIGFybW9yOiBWZXJldGVub0FybW9yLFxyXG4gICAgICAgICAgICB3ZWFwb246IFZlcmV0ZW5vV2VhcG9uXHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcblxyXG4gICAgQWN0b3I6IHtcclxuICAgICAgICBkb2N1bWVudENsYXNzZXM6IHtcclxuICAgICAgICAgICAgY2hhcmFjdGVyOiBWZXJldGVub0NoYXJhY3RlcixcclxuICAgICAgICAgICAgbnBjOiBWZXJldGVub05wYyxcclxuICAgICAgICAgICAgbW9uc3RlcjogVmVyZXRlbm9Nb25zdGVyXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwgImV4cG9ydCBjb25zdCBWRVJFVEVOT19QQVJUSUFMUyA9IFtcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL3N0YXRzLXRhYi5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL3N0YXRzLWJsb2NrLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3Ivc2tpbGxzLWJsb2NrLmhic1wiLFxyXG5cclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2VxdWlwbWVudC10YWIuaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9hY3Rvci9pdGVtL3dlYXBvbi1wbGF0ZS5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2l0ZW0vYXJtb3ItcGxhdGUuaGJzXCIsXHJcblxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvZmlnaHQtdGFiLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvZmlnaHQvYnJhd2xpbmctd2VhcG9uLXBsYXRlLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvZmlnaHQvbWVsZWUtd2VhcG9uLXBsYXRlLmhic1wiLFxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvYWN0b3IvZmlnaHQvcmFuZ2VkLXdlYXBvbi1wbGF0ZS5oYnNcIixcclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2ZpZ2h0L2FybW9yLXBsYXRlLmhic1wiLFxyXG5cclxuICAgIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvc2hlZXRzL3BhcnRpYWxzL2FjdG9yL2Jpby10YWIuaGJzXCIsXHJcblxyXG4gICAgXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvcGFydGlhbHMvaXRlbS9iYXNlLWl0ZW0tYmxvY2suaGJzXCIsXHJcbiAgICBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9wYXJ0aWFscy9pdGVtL3BoeXNpY2FsLWl0ZW0tYmxvY2suaGJzXCIsXHJcbl07IiwgImltcG9ydCB7IFNraWxsVHlwZSB9IGZyb20gXCIkY29tbW9uXCI7XHJcbmltcG9ydCB7IElkTGFiZWxUeXBlIH0gZnJvbSBcIiRtb2R1bGUvZGF0YVwiO1xyXG5pbXBvcnQgeyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQsIFBoeXNpY2FsVmVyZXRub0l0ZW1TaGVldERhdGEgfSBmcm9tIFwiLi4vcGh5c2ljYWwtaXRlbS9zaGVldFwiO1xyXG5pbXBvcnQgeyBXZWFwb25UeXBlLCBSYW5nZVR5cGUgfSBmcm9tIFwiLi9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vV2VhcG9uIH0gZnJvbSBcIi4vZG9jdW1lbnRcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vV2VhcG9uU2hlZXQgZXh0ZW5kcyBQaHlzaWNhbFZlcmV0bm9JdGVtU2hlZXQ8VmVyZXRlbm9XZWFwb24+e1xyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zPzogUGFydGlhbDxEb2N1bWVudFNoZWV0T3B0aW9ucz4pOiBQcm9taXNlPFZlcmV0ZW5vV2VhcG9uU2hlZXREYXRhPiB7XHJcbiAgICAgICAgY29uc3Qgc2hlZXREYXRhID0gYXdhaXQgc3VwZXIuZ2V0RGF0YShvcHRpb25zKTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBpdGVtIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgd2VhcG9uVHlwZXMgPSBPYmplY3QudmFsdWVzKFdlYXBvblR5cGUpLm1hcCgoZSwgaSkgPT4geyByZXR1cm4geyBpZDogaSwgbGFiZWw6IGdhbWUuaTE4bi5sb2NhbGl6ZShgdmVyZXRlbm8ud2VhcG9uVHlwZS4ke2V9YCksIHR5cGU6IGUgfSB9KVxyXG4gICAgICAgIHZhciByYW5nZVR5cGVzID0gT2JqZWN0LnZhbHVlcyhSYW5nZVR5cGUpLm1hcCgoZSwgaSkgPT4geyByZXR1cm4geyBpZDogaSwgbGFiZWw6IGdhbWUuaTE4bi5sb2NhbGl6ZShgdmVyZXRlbm8ucmFuZ2UuJHtlfWApLCB0eXBlOiBlIH0gfSlcclxuICAgICAgICB2YXIgc2tpbGxUeXBlcyA9IE9iamVjdC52YWx1ZXMoU2tpbGxUeXBlKS5tYXAoKGUsIGkpID0+IHsgcmV0dXJuIHsgaWQ6IGksIGxhYmVsOiBnYW1lLmkxOG4ubG9jYWxpemUoYHZlcmV0ZW5vLnNraWxsLiR7ZX1gKSwgdHlwZTogZSB9IH0pXHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogVmVyZXRlbm9XZWFwb25TaGVldERhdGEgPSB7XHJcbiAgICAgICAgICAgIC4uLnNoZWV0RGF0YSxcclxuICAgICAgICAgICAgbW9kaWZpZXI6IGl0ZW0uTW9kaWZpZXIsXHJcbiAgICAgICAgICAgIHdlYXBvblR5cGU6IGl0ZW0uV2VhcG9uVHlwZSxcclxuICAgICAgICAgICAgYXR0YWNrV2l0aDogaXRlbS5BdHRhY2tXaXRoLFxyXG4gICAgICAgICAgICBjcml0OiBpdGVtLkNyaXQsXHJcbiAgICAgICAgICAgIGRhbWFnZTogaXRlbS5EYW1hZ2UsXHJcbiAgICAgICAgICAgIGluaXRpYXRpdmU6IGl0ZW0uSW5pdGlhdGl2ZSxcclxuICAgICAgICAgICAgcmFuZ2U6IGl0ZW0uUmFuZ2UsXHJcbiAgICAgICAgICAgIHdlYXBvblR5cGVzOiB3ZWFwb25UeXBlcyxcclxuICAgICAgICAgICAgcmFuZ2VzOiByYW5nZVR5cGVzLFxyXG4gICAgICAgICAgICBza2lsbHM6IHNraWxsVHlwZXMsXHJcbiAgICAgICAgICAgIGlzUmFuZ2VkOiBpdGVtLlJhbmdlID4gUmFuZ2VUeXBlLk1lZGl1bSxcclxuICAgICAgICAgICAgaGFzQnVyc3Q6IGl0ZW0uSGFzQnVyc3RcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB0ZW1wbGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gYHN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL3NoZWV0cy9pdGVtcy93ZWFwb24tc2hlZXQuaGJzYDtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vV2VhcG9uU2hlZXREYXRhIGV4dGVuZHMgUGh5c2ljYWxWZXJldG5vSXRlbVNoZWV0RGF0YTxWZXJldGVub1dlYXBvbj4ge1xyXG4gICAgbW9kaWZpZXI6IG51bWJlcjtcclxuICAgIGRhbWFnZTogbnVtYmVyO1xyXG4gICAgaW5pdGlhdGl2ZTogbnVtYmVyO1xyXG4gICAgY3JpdDogbnVtYmVyO1xyXG4gICAgd2VhcG9uVHlwZTogV2VhcG9uVHlwZSxcclxuICAgIHdlYXBvblR5cGVzOiBJZExhYmVsVHlwZTxXZWFwb25UeXBlPltdLFxyXG4gICAgYXR0YWNrV2l0aDogU2tpbGxUeXBlLFxyXG4gICAgc2tpbGxzOiBJZExhYmVsVHlwZTxTa2lsbFR5cGU+W107XHJcbiAgICByYW5nZTogUmFuZ2VUeXBlXHJcbiAgICByYW5nZXM6IElkTGFiZWxUeXBlPFJhbmdlVHlwZT5bXTtcclxuICAgIGlzUmFuZ2VkOiBib29sZWFuO1xyXG4gICAgaGFzQnVyc3Q6IGJvb2xlYW5cclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9XZWFwb25TaGVldCB9O1xyXG5leHBvcnQgdHlwZSB7IFZlcmV0ZW5vV2VhcG9uU2hlZXREYXRhIH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9JdGVtIH0gZnJvbSBcIiRtb2R1bGUvaXRlbVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FjdG9yIH0gZnJvbSBcIi4uXCI7XHJcblxyXG5hYnN0cmFjdCBjbGFzcyBWZXJldGVub0FjdG9yU2hlZXQ8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9BY3Rvcj4gZXh0ZW5kcyBBY3RvclNoZWV0PFRBY3RvciwgVmVyZXRlbm9JdGVtPiB7XHJcbiAgICBzdGF0aWMgb3ZlcnJpZGUgZ2V0IGRlZmF1bHRPcHRpb25zKCk6IEFjdG9yU2hlZXRPcHRpb25zIHtcclxuICAgICAgICBjb25zdCBpc1J1c3NpYW5MYW5ndWFnZSA9IGdhbWUuc2V0dGluZ3MuZ2V0KFwiY29yZVwiLCBcImxhbmd1YWdlXCIpID09ICdydSc7XHJcblxyXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSBtZXJnZU9iamVjdChzdXBlci5kZWZhdWx0T3B0aW9ucywge1xyXG4gICAgICAgICAgICB3aWR0aDogNTYwLFxyXG4gICAgICAgICAgICBjbGFzc2VzOiBbJ3ZlcmV0ZW5vJywgJ2FjdG9yJywgJ3NoZWV0J11cclxuICAgICAgICB9KTtcclxuICAgICAgICBpZihpc1J1c3NpYW5MYW5ndWFnZSl7XHJcbiAgICAgICAgICAgIG9wdGlvbnMuY2xhc3Nlcy5wdXNoKFwibGFuZy1ydVwiKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zOiBQYXJ0aWFsPERvY3VtZW50U2hlZXRPcHRpb25zPiA9IHt9KTogUHJvbWlzZTxWZXJldGVub0FjdG9yU2hlZXREYXRhPFRBY3Rvcj4+IHtcclxuICAgICAgICBvcHRpb25zLmlkID0gdGhpcy5pZDtcclxuICAgICAgICBvcHRpb25zLmVkaXRhYmxlID0gdGhpcy5pc0VkaXRhYmxlO1xyXG5cclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBhY3RvcjogYWN0b3IsXHJcbiAgICAgICAgICAgIGNzc0NsYXNzOiB0aGlzLmFjdG9yLmlzT3duZXIgPyBcImVkaXRhYmxlXCIgOiBcImxvY2tlZFwiLFxyXG4gICAgICAgICAgICBkYXRhOiBhY3Rvci5zeXN0ZW0sXHJcbiAgICAgICAgICAgIGRvY3VtZW50OiB0aGlzLmFjdG9yLFxyXG4gICAgICAgICAgICBlZGl0YWJsZTogdGhpcy5pc0VkaXRhYmxlLFxyXG4gICAgICAgICAgICBlZmZlY3RzOiBbXSxcclxuICAgICAgICAgICAgbGltaXRlZDogdGhpcy5hY3Rvci5saW1pdGVkLFxyXG4gICAgICAgICAgICBvcHRpb25zLFxyXG4gICAgICAgICAgICBvd25lcjogdGhpcy5hY3Rvci5pc093bmVyLFxyXG4gICAgICAgICAgICB0aXRsZTogdGhpcy50aXRsZSxcclxuICAgICAgICAgICAgaXRlbXM6IGFjdG9yLml0ZW1zLFxyXG4gICAgICAgICAgICBhY3RvclR5cGU6IGFjdG9yLnR5cGUsXHJcblxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYWN0b3IuRGVzY3JpcHRpb25cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb3ZlcnJpZGUgYWN0aXZhdGVMaXN0ZW5lcnMoJGh0bWw6IEpRdWVyeSk6IHZvaWQge1xyXG4gICAgICAgIHN1cGVyLmFjdGl2YXRlTGlzdGVuZXJzKCRodG1sKTtcclxuICAgIH1cclxufVxyXG5cclxuaW50ZXJmYWNlIFZlcmV0ZW5vQWN0b3JTaGVldERhdGE8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9BY3Rvcj4gZXh0ZW5kcyBBY3RvclNoZWV0RGF0YTxUQWN0b3I+IHtcclxuICAgIGFjdG9yVHlwZTogc3RyaW5nIHwgbnVsbDtcclxuICAgIGFjdG9yOiBUQWN0b3I7XHJcbiAgICBkYXRhOiBUQWN0b3JbXCJzeXN0ZW1cIl07XHJcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0FjdG9yU2hlZXQgfVxyXG5leHBvcnQgdHlwZSB7IFZlcmV0ZW5vQWN0b3JTaGVldERhdGEgfVxyXG4iLCAiaW1wb3J0IHsgVmVyZXRlbm9Sb2xsRGF0YSwgVmVyZXRlbm9Sb2xsT3B0aW9ucyB9IGZyb20gXCIkbW9kdWxlL2RhdGFcIjtcclxuaW1wb3J0IHsgQ2hhdE1lc3NhZ2VTY2hlbWEgfSBmcm9tIFwiLi4vLi4vLi4vdHlwZXMvZm91bmRyeS9jb21tb24vZG9jdW1lbnRzL2NoYXQtbWVzc2FnZVwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9Sb2xsIGV4dGVuZHMgUm9sbCB7XHJcbiAgICBzdGF0aWMgb3ZlcnJpZGUgQ0hBVF9URU1QTEFURSA9IFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvY2hhdC9yb2xscy92ZXJldGVuby1yb2xsLWNoYXQtbWVzc2FnZS5oYnNcIjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihmb3JtdWxhOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgb3B0aW9ucz86IFJvbGxPcHRpb25zKSB7XHJcbiAgICAgICAgc3VwZXIoZm9ybXVsYSwgZGF0YSwgb3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvdGVjdGVkIG92ZXJyaWRlIGFzeW5jIF9ldmFsdWF0ZSh7IG1pbmltaXplLCBtYXhpbWl6ZSwgfTogT21pdDxFdmFsdWF0ZVJvbGxQYXJhbXMsIFwiYXN5bmNcIj4pOiBQcm9taXNlPFJvbGxlZDx0aGlzPj4ge1xyXG4gICAgICAgIGNvbnN0IHN1cGVyRXZhbHVhdGUgPSBhd2FpdCBzdXBlci5fZXZhbHVhdGUoeyBtaW5pbWl6ZSwgbWF4aW1pemUgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBzdXBlckV2YWx1YXRlO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9Sb2xsIGV4dGVuZHMgUm9sbCB7IH1cclxuXHJcbmNsYXNzIFZlcmV0ZW5vU2tpbGxSb2xsIGV4dGVuZHMgVmVyZXRlbm9Sb2xsIHtcclxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMpIHtcclxuICAgICAgICBjb25zdCByb2xsRGF0YSA9IG9wdGlvbnMucm9sbERhdGE7XHJcbiAgICAgICAgY29uc3QgZm9ybXVsYSA9IGAke3JvbGxEYXRhLnBvb2x9JHtyb2xsRGF0YS5kaWNlfWA7XHJcblxyXG4gICAgICAgIHN1cGVyKGZvcm11bGEsIChyb2xsRGF0YSBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+KSwgb3B0aW9ucy5tZXNzYWdlRGF0YSk7XHJcbiAgICB9XHJcbn1cclxuaW50ZXJmYWNlIFZlcmV0ZW5vU2tpbGxSb2xsIGV4dGVuZHMgVmVyZXRlbm9Sb2xsIHsgfVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9Sb2xsLCBWZXJldGVub1NraWxsUm9sbCB9XHJcbiIsICJpbXBvcnQgeyBWZXJldGVub1JvbGxPcHRpb25zLCBWZXJldGVub1JvbGxUeXBlIH0gZnJvbSBcIiRtb2R1bGUvZGF0YVwiO1xyXG5pbXBvcnQgeyBWZXJldGVub1JvbGwgfSBmcm9tIFwiJG1vZHVsZS9zeXN0ZW0vcm9sbFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9Sb2xsZXIge1xyXG4gICAgcm9sbE9iamVjdDogVmVyZXRlbm9Sb2xsIHwgbnVsbCA9IG51bGw7XHJcbiAgICBvcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zIHwgbnVsbCA9IG51bGw7XHJcbiAgICB2ZXJldGVub1Jlc3VsdDogVmVyZXRlbm9SZXN1bHQgPSBuZXcgVmVyZXRlbm9SZXN1bHQoKTtcclxuICAgIHZlcmV0ZW5vUm9sbHM6IFZlcmV0ZW5vRGllUmVzdWx0W10gPSBbXTtcclxuXHJcbiAgICBhc3luYyByb2xsKHJvbGxPcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gcm9sbE9wdGlvbnM7XHJcbiAgICAgICAgaWYgKHJvbGxPcHRpb25zLnJvbGxEYXRhLnBvb2wgPD0gMCAmJiByb2xsT3B0aW9ucy50eXBlICE9IFZlcmV0ZW5vUm9sbFR5cGUuQXJtb3JCbG9jaykge1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yb2xsRGVzcGVyYXRpb24ocm9sbE9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJvbGxGb3JtdWxhID0gYCR7cm9sbE9wdGlvbnMucm9sbERhdGEucG9vbH0ke3JvbGxPcHRpb25zLnJvbGxEYXRhLmRpY2V9YDtcclxuXHJcbiAgICAgICAgbGV0IHJvbGwgPSBuZXcgVmVyZXRlbm9Sb2xsKHJvbGxGb3JtdWxhKTtcclxuICAgICAgICB0aGlzLnJvbGxPYmplY3QgPSByb2xsO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMucm9sbE9iamVjdC5fZXZhbHVhdGVkKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucm9sbE9iamVjdC5ldmFsdWF0ZSh7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLnJlZXZhbHVhdGVUb3RhbCgpO1xyXG4gICAgICAgIHRoaXMudG9NZXNzYWdlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcm9sbERlc3BlcmF0aW9uKHJvbGxPcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgbGV0IHJvbGxGb3JtdWxhID0gJzBkMjAnO1xyXG4gICAgICAgIGlmIChyb2xsT3B0aW9ucy5yb2xsRGF0YS5wb29sID09IDApIHtcclxuICAgICAgICAgICAgcm9sbEZvcm11bGEgPSAnMWQyMCc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcm9sbEZvcm11bGEgPSAnMmQyMCdcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCByb2xsID0gbmV3IFZlcmV0ZW5vUm9sbChyb2xsRm9ybXVsYSk7XHJcbiAgICAgICAgdGhpcy5yb2xsT2JqZWN0ID0gcm9sbDtcclxuICAgICAgICB0aGlzLm9wdGlvbnMhLnR5cGUgPSBWZXJldGVub1JvbGxUeXBlLkRlc3BlcmF0aW9uO1xyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLnJlZXZhbHVhdGVEZXNwZXJhdGlvblRvdGFsKCk7XHJcbiAgICAgICAgdGhpcy50b01lc3NhZ2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByb2xsSW5pdGlhdGl2ZShyb2xsT3B0aW9uczogVmVyZXRlbm9Sb2xsT3B0aW9ucyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHJvbGxPcHRpb25zO1xyXG5cclxuICAgICAgICBsZXQgcm9sbEZvcm11bGEgPSBgJHtyb2xsT3B0aW9ucy5yb2xsRGF0YS5wb29sfSR7cm9sbE9wdGlvbnMucm9sbERhdGEuZGljZX1gO1xyXG5cclxuICAgICAgICBjb25zdCBib251cyA9IHJvbGxPcHRpb25zLnJvbGxEYXRhLmJvbnVzO1xyXG4gICAgICAgIGlmIChib251cyAhPT0gbnVsbCAmJiBib251cyAhPT0gMCkge1xyXG4gICAgICAgICAgICBpZiAoYm9udXMgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICByb2xsRm9ybXVsYSA9IHJvbGxGb3JtdWxhICsgYCske2JvbnVzfWBcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJvbGxGb3JtdWxhID0gcm9sbEZvcm11bGEgKyBgJHtib251c31gXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCByb2xsID0gbmV3IFZlcmV0ZW5vUm9sbChyb2xsRm9ybXVsYSk7XHJcbiAgICAgICAgdGhpcy5yb2xsT2JqZWN0ID0gcm9sbDtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnJvbGxPYmplY3QuX2V2YWx1YXRlZCkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJvbGxPYmplY3QuZXZhbHVhdGUoe30pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5yZWV2YWx1YXRlVG90YWwoKTtcclxuICAgICAgICB0aGlzLnRvTWVzc2FnZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlZXZhbHVhdGVUb3RhbCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBpZiAoIXRoaXMucm9sbE9iamVjdCB8fCAhdGhpcy5vcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5yb2xsT2JqZWN0IS5fZXZhbHVhdGVkKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucm9sbE9iamVjdCEuZXZhbHVhdGUoe30pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yb2xsRGF0YS5pc1NlcmlhbCkge1xyXG4gICAgICAgICAgICB0aGlzLnJvbGxPYmplY3QuX2Zvcm11bGEgKz0gJysnXHJcbiAgICAgICAgICAgIGxldCBpc0ludGVycnVwdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHdoaWxlICghaXNJbnRlcnJ1cHRlZCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGFkZGl0aW9uYWxSb2xsID0gbmV3IFJvbGwoJzFkMjAnKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IGFkZGl0aW9uYWxSb2xsLmV2YWx1YXRlKHt9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFkZGl0aW9uYWxSb2xsUmVzdWx0OiBEaWVSZXN1bHQgPSAoYWRkaXRpb25hbFJvbGwudGVybXNbMF0gYXMgYW55KS5yZXN1bHRzWzBdO1xyXG4gICAgICAgICAgICAgICAgKHRoaXMucm9sbE9iamVjdC50ZXJtc1swXSBhcyBhbnkpLnJlc3VsdHMucHVzaChhZGRpdGlvbmFsUm9sbFJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYWRkaXRpb25hbFJvbGxSZXN1bHQucmVzdWx0IDw9IDQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpc0ludGVycnVwdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJvbGxEaWNlc1Jlc3VsdHMgPSAodGhpcy5yb2xsT2JqZWN0LnRlcm1zWzBdIGFzIGFueSkucmVzdWx0cyBhcyBEaWVSZXN1bHRbXTtcclxuICAgICAgICBsZXQgcm9sbFJlc3VsdCA9IHRoaXMuY2FsY3VsYXRlRGljZXNUb3RhbChyb2xsRGljZXNSZXN1bHRzKTtcclxuXHJcbiAgICAgICAgdGhpcy52ZXJldGVub1Jlc3VsdCA9IHJvbGxSZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVldmFsdWF0ZURlc3BlcmF0aW9uVG90YWwoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnJvbGxPYmplY3QpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnJvbGxPYmplY3QuX2V2YWx1YXRlZCkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJvbGxPYmplY3QuZXZhbHVhdGUoe30pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJvbGxEaWNlc1Jlc3VsdHMgPSAodGhpcy5yb2xsT2JqZWN0LnRlcm1zWzBdIGFzIGFueSkucmVzdWx0cztcclxuICAgICAgICBsZXQgcm9sbFJlc3VsdCA9IHRoaXMuY2FsY3VsYXRlRGVzcGVyYXRpb25EaWNlc1RvdGFsKHJvbGxEaWNlc1Jlc3VsdHMpO1xyXG5cclxuICAgICAgICB0aGlzLnZlcmV0ZW5vUmVzdWx0ID0gcm9sbFJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBjYWxjdWxhdGVEaWNlc1RvdGFsKGRpY2VzOiBEaWVSZXN1bHRbXSk6IFZlcmV0ZW5vUmVzdWx0IHtcclxuICAgICAgICBjb25zdCByZXN1bHQ6IFZlcmV0ZW5vUmVzdWx0ID0ge1xyXG4gICAgICAgICAgICB0b3RhbDogMCxcclxuICAgICAgICAgICAgc3VjY2Vzc2VzOiAwLFxyXG4gICAgICAgICAgICBjcml0RmFpbHM6IDBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpY2VzLmZvckVhY2gociA9PiB7XHJcbiAgICAgICAgICAgIGxldCByb2xsUmVzdWx0OiBWZXJldGVub0RpZVJlc3VsdCA9IHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdDogci5yZXN1bHQsXHJcbiAgICAgICAgICAgICAgICBjbGFzc2VzOiAnZDIwJ1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKHIucmVzdWx0ID09PSAyMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRvdGFsICs9IDI7XHJcbiAgICAgICAgICAgICAgICByb2xsUmVzdWx0LmNsYXNzZXMgKz0gJyBtYXgnO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnN1Y2Nlc3NlcyArPSAyO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoci5yZXN1bHQgPj0gMTcgJiYgci5yZXN1bHQgPD0gMTkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC50b3RhbCsrO1xyXG4gICAgICAgICAgICAgICAgcm9sbFJlc3VsdC5jbGFzc2VzICs9ICcgZ29vZCc7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuc3VjY2Vzc2VzKys7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyLnJlc3VsdCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRvdGFsLS07XHJcbiAgICAgICAgICAgICAgICByb2xsUmVzdWx0LmNsYXNzZXMgKz0gJyBtaW4nO1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LmNyaXRGYWlscysrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZlcmV0ZW5vUm9sbHMucHVzaChyb2xsUmVzdWx0KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBjYWxjdWxhdGVEZXNwZXJhdGlvbkRpY2VzVG90YWwoZGljZXM6IERpZVJlc3VsdFtdKTogVmVyZXRlbm9SZXN1bHQge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdDogVmVyZXRlbm9SZXN1bHQgPSB7XHJcbiAgICAgICAgICAgIHRvdGFsOiAwLFxyXG4gICAgICAgICAgICBzdWNjZXNzZXM6IDAsXHJcbiAgICAgICAgICAgIGNyaXRGYWlsczogMFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGljZXMuZm9yRWFjaChyID0+IHtcclxuICAgICAgICAgICAgbGV0IHJvbGxSZXN1bHQgPSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQ6IHIucmVzdWx0LFxyXG4gICAgICAgICAgICAgICAgY2xhc3NlczogJ2QyMCdcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyLnJlc3VsdCA9PT0gMjApIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC50b3RhbCsrO1xyXG4gICAgICAgICAgICAgICAgcm9sbFJlc3VsdC5jbGFzc2VzICs9ICcgbWF4JztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHIucmVzdWx0ID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQudG90YWwtLTtcclxuICAgICAgICAgICAgICAgIHJvbGxSZXN1bHQuY2xhc3NlcyArPSAnIG1pbic7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQuY3JpdEZhaWxzKys7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudmVyZXRlbm9Sb2xscy5wdXNoKHJvbGxSZXN1bHQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBkaWNlc0NvdW50ID0gZGljZXMubGVuZ3RoO1xyXG4gICAgICAgIGlmIChyZXN1bHQudG90YWwgPT0gZGljZXNDb3VudCkge1xyXG4gICAgICAgICAgICByZXN1bHQudG90YWwgPSAxO1xyXG4gICAgICAgICAgICByZXN1bHQuc3VjY2Vzc2VzID0gMTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAocmVzdWx0LnRvdGFsID4gMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRvdGFsID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyB0b01lc3NhZ2UoKTogUHJvbWlzZTxDaGF0TWVzc2FnZSB8IHVuZGVmaW5lZD4ge1xyXG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGNoYXREYXRhID0gdGhpcy5vcHRpb25zLm1lc3NhZ2VEYXRhO1xyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gdGhpcy5nZXRUZW1wbGF0ZSh0aGlzLm9wdGlvbnMudHlwZSk7XHJcbiAgICAgICAgY29uc3QgdmVyZXRlbm9Sb2xsRGF0YSA9IHRoaXMuZ2V0VmVyZXRlbm9Sb2xsRGF0YSgpO1xyXG5cclxuICAgICAgICBjaGF0RGF0YS5jb250ZW50ID0gYXdhaXQgcmVuZGVyVGVtcGxhdGUodGVtcGxhdGUsIHZlcmV0ZW5vUm9sbERhdGEpO1xyXG4gICAgICAgIGNoYXREYXRhLnJvbGwgPSB0aGlzLnJvbGxPYmplY3Q7XHJcblxyXG4gICAgICAgIHJldHVybiBDaGF0TWVzc2FnZS5jcmVhdGUoY2hhdERhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFRlbXBsYXRlKHR5cGU6IFZlcmV0ZW5vUm9sbFR5cGUpOiBzdHJpbmcge1xyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIFZlcmV0ZW5vUm9sbFR5cGUuUmVndWxhcjpcclxuICAgICAgICAgICAgICAgIHJldHVybiBcInN5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL2NoYXQvcm9sbHMvdmVyZXRlbm8tcm9sbC1jaGF0LW1lc3NhZ2UuaGJzXCI7XHJcbiAgICAgICAgICAgIGNhc2UgVmVyZXRlbm9Sb2xsVHlwZS5Bcm1vckJsb2NrOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwic3lzdGVtcy92ZXJldGVuby90ZW1wbGF0ZXMvY2hhdC9yb2xscy92ZXJldGVuby1hcm1vci1yb2xsLWNoYXQtbWVzc2FnZS5oYnNcIjtcclxuICAgICAgICAgICAgY2FzZSBWZXJldGVub1JvbGxUeXBlLkluaXRpYXRpdmU6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9jaGF0L3JvbGxzL3ZlcmV0ZW5vLWluaXRpYXRpdmUtcm9sbC1jaGF0LW1lc3NhZ2UuaGJzXCI7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9jaGF0L3JvbGxzL3ZlcmV0ZW5vLXJvbGwtY2hhdC1tZXNzYWdlLmhic1wiO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRWZXJldGVub1JvbGxEYXRhKCk6IFZlcmV0ZW5vUm9sbFJlc3VsdCB7XHJcbiAgICAgICAgbGV0IHJvbGxEYXRhID0ge1xyXG4gICAgICAgICAgICBmb3JtdWxhOiB0aGlzLnJvbGxPYmplY3QhLl9mb3JtdWxhLFxyXG4gICAgICAgICAgICB0b3RhbDogdGhpcy5yb2xsT2JqZWN0IS50b3RhbCEsXHJcbiAgICAgICAgICAgIHZlcmV0ZW5vVG90YWw6IHRoaXMudmVyZXRlbm9SZXN1bHQudG90YWwsXHJcbiAgICAgICAgICAgIHZlcmV0ZW5vU3VjY2Vzc2VzOiB0aGlzLnZlcmV0ZW5vUmVzdWx0LnN1Y2Nlc3NlcyxcclxuICAgICAgICAgICAgdmVyZXRlbm9Dcml0RmFpbHM6IHRoaXMudmVyZXRlbm9SZXN1bHQuY3JpdEZhaWxzLFxyXG4gICAgICAgICAgICByb2xsczogdGhpcy52ZXJldGVub1JvbGxzXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcm9sbERhdGE7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBEaWVSZXN1bHQge1xyXG4gICAgYWN0aXZlOiBib29sZWFuO1xyXG4gICAgcmVzdWx0OiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0RpZVJlc3VsdCB7XHJcbiAgICByZXN1bHQ6IG51bWJlcjtcclxuICAgIGNsYXNzZXM6IHN0cmluZztcclxufVxyXG5cclxuY2xhc3MgVmVyZXRlbm9SZXN1bHQge1xyXG4gICAgdG90YWw6IG51bWJlciA9IDA7XHJcbiAgICBzdWNjZXNzZXM6IG51bWJlciA9IDA7XHJcbiAgICBjcml0RmFpbHM6IG51bWJlciA9IDA7XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub1JvbGxSZXN1bHQge1xyXG4gICAgZm9ybXVsYTogc3RyaW5nO1xyXG4gICAgdG90YWw6IG51bWJlcjtcclxuICAgIHZlcmV0ZW5vVG90YWw6IG51bWJlcjtcclxuICAgIHZlcmV0ZW5vU3VjY2Vzc2VzOiBudW1iZXI7XHJcbiAgICB2ZXJldGVub0NyaXRGYWlsczogbnVtYmVyO1xyXG4gICAgcm9sbHM6IFZlcmV0ZW5vRGllUmVzdWx0W107XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vUm9sbGVyIH0iLCAiZXhwb3J0IGNsYXNzIFZlcmV0ZW5vUm9sbERpYWxvZyB7XHJcbiAgICB0ZW1wbGF0ZTogc3RyaW5nID0gJ3N5c3RlbXMvdmVyZXRlbm8vdGVtcGxhdGVzL2NoYXQvZGlhbG9nL3JvbGwtZGlhbG9nLmhicyc7XHJcblxyXG4gICAgYXN5bmMgZ2V0VGFza0NoZWNrT3B0aW9ucygpOiBQcm9taXNlPFZlcmV0ZW5vUm9sbERpYWxvZ0FyZ3VtZW50PiB7XHJcbiAgICAgICAgY29uc3QgaHRtbCA9IGF3YWl0IHJlbmRlclRlbXBsYXRlKHRoaXMudGVtcGxhdGUsIHt9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiXHUwNDFDXHUwNDNFXHUwNDM0XHUwNDM4XHUwNDQ0XHUwNDM4XHUwNDNBXHUwNDMwXHUwNDQyXHUwNDNFXHUwNDQwXHUwNDRCIFx1MDQzMVx1MDQ0MFx1MDQzRVx1MDQ0MVx1MDQzQVx1MDQzMFwiLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogaHRtbCxcclxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBub3JtYWw6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiXHUwNDE0XHUwNDMwXHUwNDNCXHUwNDM1XHUwNDM1XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBodG1sID0+IHJlc29sdmUodGhpcy5fcHJvY2Vzc1Rhc2tDaGVja09wdGlvbnMoKGh0bWxbMF0gYXMgdW5rbm93biBhcyBIVE1MQW5jaG9yRWxlbWVudCkucXVlcnlTZWxlY3RvcihcImZvcm1cIikpKVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIlx1MDQxRVx1MDQ0Mlx1MDQzQ1x1MDQzNVx1MDQzRFx1MDQzMFwiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IFwibm9ybWFsXCIsXHJcbiAgICAgICAgICAgICAgICBjbG9zZTogKCkgPT4gcmVzb2x2ZSh7IG1vZGlmaWVyOiAwLCBibGluZFJvbGw6IGZhbHNlLCBjYW5jZWxsZWQ6IHRydWUgfSlcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIG5ldyBEaWFsb2coZGF0YSkucmVuZGVyKHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIF9wcm9jZXNzVGFza0NoZWNrT3B0aW9ucyhmb3JtOiBKUXVlcnkpOiBWZXJldGVub1JvbGxEaWFsb2dBcmd1bWVudCB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbW9kaWZpZXI6IHBhcnNlSW50KGZvcm0ubW9kaWZpZXIudmFsdWUpLFxyXG4gICAgICAgICAgICBibGluZFJvbGw6IGZvcm0uYmxpbmRSb2xsLmNoZWNrZWQsXHJcbiAgICAgICAgICAgIGNhbmNlbGxlZDogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQge1xyXG4gICAgbW9kaWZpZXI6IG51bWJlciA9IDA7XHJcbiAgICBibGluZFJvbGw6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIGNhbmNlbGxlZDogYm9vbGVhbiA9IHRydWU7XHJcbn0iLCAiaW1wb3J0IHsgVmVyZXRlbm9DcmVhdHVyZSB9IGZyb20gXCIuLi9pbmRleFwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0FjdG9yU2hlZXQsIFZlcmV0ZW5vQWN0b3JTaGVldERhdGEgfSBmcm9tIFwiLi4vYmFzZS9zaGVldFwiO1xyXG5pbXBvcnQgeyBBdHRyaWJ1dGVXaXRoU2tpbGxzLCBBdHRyaWJ1dGVzQmxvY2ssIEl0ZW1BY3Rpb25JbmZvLCBTa2lsbCwgU2tpbGxzQmxvY2ssIFN0YXQsIFN0YXRzQmxvY2ssIFdlYXBvbkF0dGFja0luZm8gfSBmcm9tIFwiLi9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ2hhdE9wdGlvbnMsIFZlcmV0ZW5vTWVzc2FnZURhdGEsIFZlcmV0ZW5vUm9sbERhdGEsIFZlcmV0ZW5vUm9sbE9wdGlvbnMsIFZlcmV0ZW5vUm9sbFR5cGUgfSBmcm9tIFwiJG1vZHVsZS9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vUm9sbGVyIH0gZnJvbSBcIiRtb2R1bGUvdXRpbHMvdmVyZXRlbm8tcm9sbGVyXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vV2VhcG9uIH0gZnJvbSBcIiRtb2R1bGUvaXRlbS93ZWFwb24vZG9jdW1lbnRcIjtcclxuaW1wb3J0IHsgUGh5c2ljYWxWZXJldGVub0l0ZW0sIFZlcmV0ZW5vQXJtb3IsIFZlcmV0ZW5vSXRlbSB9IGZyb20gXCIkbW9kdWxlL2l0ZW1cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9JdGVtVHlwZSB9IGZyb20gXCIkbW9kdWxlL2l0ZW0vYmFzZS9kYXRhXCI7XHJcbmltcG9ydCB7IEF0dGFja1R5cGUsIFdlYXBvblR5cGUgfSBmcm9tIFwiJG1vZHVsZS9pdGVtL3dlYXBvbi9kYXRhXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vUm9sbERpYWxvZywgVmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQgfSBmcm9tIFwiJG1vZHVsZS9kaWFsb2dcIjtcclxuXHJcbmFic3RyYWN0IGNsYXNzIFZlcmV0ZW5vQ3JlYXR1cmVTaGVldDxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlPiBleHRlbmRzIFZlcmV0ZW5vQWN0b3JTaGVldDxUQWN0b3I+e1xyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zOiBQYXJ0aWFsPERvY3VtZW50U2hlZXRPcHRpb25zPiA9IHt9KTogUHJvbWlzZTxWZXJldGVub0NyZWF0dXJlU2hlZXREYXRhPFRBY3Rvcj4+IHtcclxuICAgICAgICBjb25zdCBzaGVldERhdGEgPSBhd2FpdCBzdXBlci5nZXREYXRhKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoYWN0b3IuU3RhdHMpKSB7XHJcbiAgICAgICAgICAgICh2IGFzIFN0YXQpLmxhYmVsID0gZ2FtZS5pMThuLmxvY2FsaXplKGB2ZXJldGVuby5zdGF0LiR7a31gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IFtrLCB2XSBvZiBPYmplY3QuZW50cmllcyhhY3Rvci5BdHRyaWJ1dGVzKSkge1xyXG4gICAgICAgICAgICAodiBhcyBBdHRyaWJ1dGVXaXRoU2tpbGxzKS5sYWJlbCA9IGdhbWUuaTE4bi5sb2NhbGl6ZShgdmVyZXRlbm8uYXR0cmlidXRlLiR7a31gKTtcclxuICAgICAgICAgICAgKHYgYXMgQXR0cmlidXRlV2l0aFNraWxscykuc2tpbGxzID0ge307XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBbazEsIHYxXSBvZiBPYmplY3QuZW50cmllcyhhY3Rvci5Ta2lsbHMpLmZpbHRlcih4ID0+IHhbMV0uYXR0cmlidXRlID09PSBrKSkge1xyXG4gICAgICAgICAgICAgICAgKHYxIGFzIFNraWxsKS5sYWJlbCA9IGdhbWUuaTE4bi5sb2NhbGl6ZShgdmVyZXRlbm8uc2tpbGwuJHtrMX1gKTtcclxuICAgICAgICAgICAgICAgICh2IGFzIEF0dHJpYnV0ZVdpdGhTa2lsbHMpLnNraWxsc1trMV0gPSB2MTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZXF1aXBwZWRXZWFwb25zID0gYWN0b3IuRXF1aXBwZWRXZWFwb25zLm1hcCh4ID0+IHtcclxuICAgICAgICAgICAgc3dpdGNoICh4LldlYXBvblR5cGUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgV2VhcG9uVHlwZS5CcmF3bGluZzpcclxuICAgICAgICAgICAgICAgICAgICB4LnN5c3RlbVtcImlzQnJhd2xpbmdcIl0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgV2VhcG9uVHlwZS5NZWxlZTpcclxuICAgICAgICAgICAgICAgICAgICB4LnN5c3RlbVtcImlzTWVsZWVcIl0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgV2VhcG9uVHlwZS5SYW5nZWQ6XHJcbiAgICAgICAgICAgICAgICAgICAgeC5zeXN0ZW1bXCJpc1JhbmdlZFwiXSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB4O1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIC4uLnNoZWV0RGF0YSxcclxuICAgICAgICAgICAgc3RhdHM6IGFjdG9yLlN0YXRzLFxyXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiBhY3Rvci5BdHRyaWJ1dGVzLFxyXG4gICAgICAgICAgICBza2lsbHM6IGFjdG9yLlNraWxscyxcclxuICAgICAgICAgICAgbWF4SHA6IGFjdG9yLk1heEhwLFxyXG4gICAgICAgICAgICBtYXhXcDogYWN0b3IuTWF4V3AsXHJcbiAgICAgICAgICAgIHdlYXBvbnM6IGFjdG9yLldlYXBvbnMsXHJcbiAgICAgICAgICAgIGVxdWlwcGVkV2VhcG9uczogZXF1aXBwZWRXZWFwb25zLFxyXG4gICAgICAgICAgICBhcm1vcnM6IGFjdG9yLkFybW9ycyxcclxuICAgICAgICAgICAgZXF1aXBwZWRBcm1vcjogYWN0b3IuRXF1aXBwZWRBcm1vcixcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb3ZlcnJpZGUgYWN0aXZhdGVMaXN0ZW5lcnMoJGh0bWw6IEpRdWVyeSk6IHZvaWQge1xyXG4gICAgICAgIHN1cGVyLmFjdGl2YXRlTGlzdGVuZXJzKCRodG1sKTtcclxuICAgICAgICBjb25zdCBodG1sID0gJGh0bWxbMF07XHJcblxyXG4gICAgICAgICRodG1sLm9uKCdjbGljaycsICcuc2tpbGwtY2hlY2snLCB0aGlzLiNvblNraWxsQ2hlY2tSb2xsLmJpbmQodGhpcykpO1xyXG4gICAgICAgICRodG1sLm9uKCdjbGljaycsICcuaXRlbS1hY3Rpb24nLCB0aGlzLiNvbkl0ZW1BY3Rpb24uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgJGh0bWwub24oJ2NsaWNrJywgJy5hcm1vci1hY3Rpb24nLCB0aGlzLiNvbkFybW9yQWN0aW9uLmJpbmQodGhpcykpO1xyXG4gICAgICAgICRodG1sLm9uKCdjbGljaycsICcud2VhcG9uLWFjdGlvbicsIHRoaXMuI29uV2VhcG9uQWN0aW9uLmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICAvLyBodG1sLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgJy5pdGVtLWFjdGlvbicsIHRoaXMuI29uSXRlbUFjdGlvbi5iaW5kKHRoaXMpKTtcclxuICAgICAgICAvLyBodG1sLm9uKCdjbGljaycsICcud2VhcG9uLWFjdGlvbicsIHRoaXMuI29uV2VhcG9uQWN0aW9uLmJpbmQodGhpcykpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jICNvblNraWxsQ2hlY2tSb2xsKGV2ZW50OiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBjb25zdCBlbGVtZW50ID0gZXZlbnQuY3VycmVudFRhcmdldDtcclxuICAgICAgICBjb25zdCBkYXRhc2V0ID0gKGVsZW1lbnQgYXMgSFRNTEFuY2hvckVsZW1lbnQpPy5kYXRhc2V0O1xyXG5cclxuICAgICAgICBjb25zdCB7IGFjdG9yIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBjb25zdCBzaG93RGlhbG9nID0gKENPTkZJRy5TRVRUSU5HUy5TaG93VGFza0NoZWNrT3B0aW9ucyAhPT0gZXZlbnQuY3RybEtleSk7XHJcbiAgICAgICAgbGV0IGRpYWxvZ1Jlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEaWFsb2dBcmd1bWVudCgpO1xyXG4gICAgICAgIGlmIChzaG93RGlhbG9nKSB7XHJcbiAgICAgICAgICAgIGRpYWxvZ1Jlc3VsdCA9IGF3YWl0IChuZXcgVmVyZXRlbm9Sb2xsRGlhbG9nKCkpLmdldFRhc2tDaGVja09wdGlvbnMoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkaWFsb2dSZXN1bHQuY2FuY2VsbGVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB7IGxhYmVsLCByb2xsS2V5LCByb2xsVHlwZSB9ID0gZGF0YXNldDtcclxuXHJcbiAgICAgICAgaWYgKHJvbGxLZXkgPT0gbnVsbCB8fCByb2xsVHlwZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCByb2xsRGF0YSA9IG5ldyBWZXJldGVub1JvbGxEYXRhKCk7XHJcbiAgICAgICAgaWYgKHJvbGxUeXBlID09IFwiYXR0cmlidXRlXCIpIHtcclxuICAgICAgICAgICAgcm9sbERhdGEgPSBhd2FpdCBhY3Rvci5nZXRBdHRyaWJ1dGVSb2xsRGF0YShyb2xsS2V5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByb2xsRGF0YSA9IGF3YWl0IGFjdG9yLmdldFNraWxsUm9sbERhdGEocm9sbEtleSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByb2xsRGF0YS5wb29sICs9IGRpYWxvZ1Jlc3VsdC5tb2RpZmllcjtcclxuXHJcblxyXG4gICAgICAgIGxldCBtZXNzYWdlRGF0YSA9IHtcclxuICAgICAgICAgICAgdXNlcklkOiBnYW1lLnVzZXIuX2lkIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgc3BlYWtlcjogQ2hhdE1lc3NhZ2UuZ2V0U3BlYWtlcigpLFxyXG4gICAgICAgICAgICBmbGF2b3I6IGxhYmVsIHx8ICcnLFxyXG4gICAgICAgICAgICBzb3VuZDogQ09ORklHLnNvdW5kcy5kaWNlLFxyXG4gICAgICAgICAgICBibGluZDogZmFsc2UgfHwgZGlhbG9nUmVzdWx0LmJsaW5kUm9sbCB8fCBldmVudC5zaGlmdEtleVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IHJvbGxPcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBWZXJldGVub1JvbGxUeXBlLlJlZ3VsYXIsXHJcbiAgICAgICAgICAgIG1lc3NhZ2VEYXRhOiBtZXNzYWdlRGF0YSxcclxuICAgICAgICAgICAgcm9sbERhdGE6IHJvbGxEYXRhXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCByb2xsZXIgPSBuZXcgVmVyZXRlbm9Sb2xsZXIoKTtcclxuICAgICAgICBhd2FpdCByb2xsZXIucm9sbChyb2xsT3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgI29uV2VhcG9uQWN0aW9uKGV2ZW50OiBNb3VzZUV2ZW50KSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBjb25zdCBlbGVtZW50ID0gZXZlbnQuY3VycmVudFRhcmdldDtcclxuICAgICAgICBjb25zdCBkYXRhc2V0ID0gKGVsZW1lbnQgYXMgSFRNTEFuY2hvckVsZW1lbnQpPy5kYXRhc2V0O1xyXG5cclxuICAgICAgICBjb25zdCB7IGl0ZW1UeXBlLCBhY3Rpb25UeXBlLCBpdGVtSWQsIHdlYXBvblR5cGUsIGF0dGFja1R5cGUgfSA9IGRhdGFzZXQ7XHJcblxyXG4gICAgICAgIGlmIChpdGVtSWQgPT0gbnVsbCB8fCBpdGVtSWQgPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGNoYXRPcHRpb25zOiBWZXJldGVub0NoYXRPcHRpb25zID0ge1xyXG4gICAgICAgICAgICBpc0JsaW5kOiBmYWxzZSB8fCBldmVudC5zaGlmdEtleSxcclxuICAgICAgICAgICAgc2hvd0RpYWxvZzogKENPTkZJRy5TRVRUSU5HUy5TaG93VGFza0NoZWNrT3B0aW9ucyAhPT0gZXZlbnQuY3RybEtleSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhY3Rpb25UeXBlID09PSAnaW5pdGlhdGl2ZScpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucm9sbFdlYXBvbkluaXRpYXRpdmUoaXRlbUlkLCBjaGF0T3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGFjdGlvblR5cGUgPT09ICdhdHRhY2snKSB7XHJcbiAgICAgICAgICAgIGxldCB3ZWFwb25EYXRhOiBXZWFwb25BdHRhY2tJbmZvID0ge1xyXG4gICAgICAgICAgICAgICAgaWQ6IGl0ZW1JZCxcclxuICAgICAgICAgICAgICAgIHdlYXBvblR5cGU6IHdlYXBvblR5cGUgYXMgV2VhcG9uVHlwZSxcclxuICAgICAgICAgICAgICAgIGF0dGFja1R5cGU6IGF0dGFja1R5cGUgYXMgQXR0YWNrVHlwZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucm9sbFdlYXBvbkF0dGFjayh3ZWFwb25EYXRhLCBjaGF0T3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJvbGxXZWFwb25Jbml0aWF0aXZlKHdlYXBvbklkOiBzdHJpbmcsIGNoYXRPcHRpb25zOiBWZXJldGVub0NoYXRPcHRpb25zKSB7XHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGRpYWxvZ1Jlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEaWFsb2dBcmd1bWVudCgpO1xyXG4gICAgICAgIGlmIChjaGF0T3B0aW9ucy5zaG93RGlhbG9nKSB7XHJcbiAgICAgICAgICAgIGRpYWxvZ1Jlc3VsdCA9IGF3YWl0IChuZXcgVmVyZXRlbm9Sb2xsRGlhbG9nKCkpLmdldFRhc2tDaGVja09wdGlvbnMoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkaWFsb2dSZXN1bHQuY2FuY2VsbGVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VEYXRhOiBWZXJldGVub01lc3NhZ2VEYXRhID0ge1xyXG4gICAgICAgICAgICB1c2VySWQ6IGdhbWUudXNlci5faWQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBzcGVha2VyOiBDaGF0TWVzc2FnZS5nZXRTcGVha2VyKCksXHJcbiAgICAgICAgICAgIGZsYXZvcjogJ1x1MDQxOFx1MDQzRFx1MDQzOFx1MDQ0Nlx1MDQzOFx1MDQzMFx1MDQ0Mlx1MDQzOFx1MDQzMlx1MDQzMCcsXHJcbiAgICAgICAgICAgIHNvdW5kOiBDT05GSUcuc291bmRzLmRpY2UsXHJcbiAgICAgICAgICAgIGJsaW5kOiBjaGF0T3B0aW9ucy5pc0JsaW5kIHx8IGRpYWxvZ1Jlc3VsdC5ibGluZFJvbGxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQgaW5pdGlhdGl2ZVJvbGxEYXRhID0gYXdhaXQgYWN0b3IuZ2V0SW5pdGlhdGl2ZVJvbGxEYXRhKHdlYXBvbklkKTtcclxuICAgICAgICBpZiAoaW5pdGlhdGl2ZVJvbGxEYXRhID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5pdGlhdGl2ZVJvbGxEYXRhLmJvbnVzICs9IGRpYWxvZ1Jlc3VsdC5tb2RpZmllcjtcclxuXHJcbiAgICAgICAgY29uc3Qgcm9sbE9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFZlcmV0ZW5vUm9sbFR5cGUuSW5pdGlhdGl2ZSxcclxuICAgICAgICAgICAgbWVzc2FnZURhdGEsXHJcbiAgICAgICAgICAgIHJvbGxEYXRhOiBpbml0aWF0aXZlUm9sbERhdGFcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHZlcmV0ZW5vUm9sbEhhbmRsZXIgPSBuZXcgVmVyZXRlbm9Sb2xsZXIoKTtcclxuICAgICAgICBhd2FpdCB2ZXJldGVub1JvbGxIYW5kbGVyLnJvbGxJbml0aWF0aXZlKHJvbGxPcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByb2xsV2VhcG9uQXR0YWNrKHdlYXBvbkRhdGE6IFdlYXBvbkF0dGFja0luZm8sIGNoYXRPcHRpb25zOiBWZXJldGVub0NoYXRPcHRpb25zKSB7XHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGRpYWxvZ1Jlc3VsdCA9IG5ldyBWZXJldGVub1JvbGxEaWFsb2dBcmd1bWVudCgpO1xyXG4gICAgICAgIGlmIChjaGF0T3B0aW9ucy5zaG93RGlhbG9nKSB7XHJcbiAgICAgICAgICAgIGRpYWxvZ1Jlc3VsdCA9IGF3YWl0IChuZXcgVmVyZXRlbm9Sb2xsRGlhbG9nKCkpLmdldFRhc2tDaGVja09wdGlvbnMoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkaWFsb2dSZXN1bHQuY2FuY2VsbGVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VEYXRhOiBWZXJldGVub01lc3NhZ2VEYXRhID0ge1xyXG4gICAgICAgICAgICB1c2VySWQ6IGdhbWUudXNlci5faWQgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBzcGVha2VyOiBDaGF0TWVzc2FnZS5nZXRTcGVha2VyKCksXHJcbiAgICAgICAgICAgIGZsYXZvcjogd2VhcG9uRGF0YS53ZWFwb25UeXBlLFxyXG4gICAgICAgICAgICBzb3VuZDogQ09ORklHLnNvdW5kcy5kaWNlLFxyXG4gICAgICAgICAgICBibGluZDogY2hhdE9wdGlvbnMuaXNCbGluZCB8fCBkaWFsb2dSZXN1bHQuYmxpbmRSb2xsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbGV0IHdlYXBvblJvbGxEYXRhID0gYXdhaXQgYWN0b3IuZ2V0V2VhcG9uUm9sbERhdGEod2VhcG9uRGF0YSk7XHJcbiAgICAgICAgd2VhcG9uUm9sbERhdGEucG9vbCArPSBkaWFsb2dSZXN1bHQubW9kaWZpZXI7XHJcblxyXG4gICAgICAgIGNvbnN0IHJvbGxPcHRpb25zOiBWZXJldGVub1JvbGxPcHRpb25zID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBWZXJldGVub1JvbGxUeXBlLkF0dGFjayxcclxuICAgICAgICAgICAgbWVzc2FnZURhdGEsXHJcbiAgICAgICAgICAgIHJvbGxEYXRhOiB3ZWFwb25Sb2xsRGF0YVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdmVyZXRlbm9Sb2xsSGFuZGxlciA9IG5ldyBWZXJldGVub1JvbGxlcigpO1xyXG4gICAgICAgIGF3YWl0IHZlcmV0ZW5vUm9sbEhhbmRsZXIucm9sbChyb2xsT3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgI29uSXRlbUFjdGlvbihldmVudDogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcbiAgICAgICAgY29uc3QgZGF0YXNldCA9IChlbGVtZW50IGFzIEhUTUxBbmNob3JFbGVtZW50KT8uZGF0YXNldDtcclxuXHJcbiAgICAgICAgY29uc3QgeyBpdGVtVHlwZSwgYWN0aW9uVHlwZSwgaXRlbUlkIH0gPSBkYXRhc2V0O1xyXG4gICAgICAgIGNvbnN0IGl0ZW1JbmZvOiBJdGVtQWN0aW9uSW5mbyA9IHsgdHlwZTogKGl0ZW1UeXBlISBhcyBWZXJldGVub0l0ZW1UeXBlKSwgaWQ6IGl0ZW1JZCEgfTtcclxuXHJcbiAgICAgICAgc3dpdGNoIChhY3Rpb25UeXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3JlbW92ZSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yZW1vdmVJdGVtKGl0ZW1JbmZvKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZXF1aXAnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZXF1aXBJdGVtKGl0ZW1JbmZvKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAndW5lcXVpcCc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy51bmVxdWlwSXRlbShpdGVtSW5mbyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlbW92ZUl0ZW0oaXRlbUluZm86IEl0ZW1BY3Rpb25JbmZvKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuYWN0b3IuaXRlbXMuZ2V0KGl0ZW1JbmZvLmlkKTtcclxuICAgICAgICBpZiAoIWl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hY3Rvci5kZWxldGVFbWJlZGRlZERvY3VtZW50cyhcIkl0ZW1cIiwgW2l0ZW0uX2lkIV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGVxdWlwSXRlbShpdGVtSW5mbzogSXRlbUFjdGlvbkluZm8pOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBzd2l0Y2ggKGl0ZW1JbmZvLnR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnd2VhcG9uJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmVxdWlwV2VhcG9uKGl0ZW1JbmZvLmlkKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnYXJtb3InOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZXF1aXBBcm1vcihpdGVtSW5mby5pZCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGVxdWlwV2VhcG9uKGl0ZW1JZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuYWN0b3IuaXRlbXMuZmluZCh4ID0+IHguX2lkID09PSBpdGVtSWQpO1xyXG4gICAgICAgIGlmICghaXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzRcdTA0NDNcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzZcdTA0MzRcdTA0MzVcdTA0M0RcdTA0MzhcdTA0MzUsIFx1MDQzNVx1MDQ0MVx1MDQzQlx1MDQzOCBcdTA0NERcdTA0M0FcdTA0MzhcdTA0M0ZcdTA0MzhcdTA0NDBcdTA0M0VcdTA0MzJcdTA0MzBcdTA0M0RcdTA0M0UgXHUwNDMxXHUwNDNFXHUwNDNCXHUwNDRDXHUwNDQ4XHUwNDM1IDIgXHUwNDREXHUwNDNCXHUwNDM1XHUwNDNDXHUwNDM1XHUwNDNEXHUwNDQyXHUwNDNFXHUwNDMyIFx1MDQzRVx1MDQ0MFx1MDQ0M1x1MDQzNlx1MDQzOFx1MDQ0Ri5cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5hY3Rvci51cGRhdGVFbWJlZGRlZERvY3VtZW50cyhcIkl0ZW1cIiwgW1xyXG4gICAgICAgICAgICB7IF9pZDogaXRlbS5faWQhLCBcInN5c3RlbS5pc0VxdWlwcGVkXCI6IHRydWUgfSxcclxuICAgICAgICBdKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBlcXVpcEFybW9yKGl0ZW1JZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgZXF1aXBwZWRBcm1vciA9IHRoaXMuYWN0b3IuaXRlbXMuZmluZCh4ID0+ICh4IGFzIHVua25vd24gYXMgVmVyZXRlbm9Bcm1vcikuc3lzdGVtLmlzRXF1aXBwZWQgJiYgeC50eXBlID09PSBWZXJldGVub0l0ZW1UeXBlLkFybW9yKTtcclxuICAgICAgICBpZiAoZXF1aXBwZWRBcm1vcikge1xyXG4gICAgICAgICAgICAvLyBcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzRcdTA0NDNcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzZcdTA0MzRcdTA0MzVcdTA0M0RcdTA0MzhcdTA0MzUsIFx1MDQzNVx1MDQ0MVx1MDQzQlx1MDQzOCBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0NEYgXHUwNDQzXHUwNDM2XHUwNDM1IFx1MDQ0RFx1MDQzQVx1MDQzOFx1MDQzRlx1MDQzOFx1MDQ0MFx1MDQzRVx1MDQzMlx1MDQzMFx1MDQzRFx1MDQzMC5cclxuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmFjdG9yLml0ZW1zLmZpbmQoeCA9PiB4Ll9pZCA9PT0gaXRlbUlkKTtcclxuICAgICAgICBpZiAoIWl0ZW0pIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5hY3Rvci51cGRhdGVFbWJlZGRlZERvY3VtZW50cyhcIkl0ZW1cIiwgW1xyXG4gICAgICAgICAgICB7IF9pZDogaXRlbS5faWQhLCBcInN5c3RlbS5pc0VxdWlwcGVkXCI6IHRydWUgfSxcclxuICAgICAgICBdKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyB1bmVxdWlwSXRlbShpdGVtSW5mbzogSXRlbUFjdGlvbkluZm8pOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5hY3Rvci5pdGVtcy5maW5kKHggPT4geC5faWQgPT09IGl0ZW1JbmZvLmlkXHJcbiAgICAgICAgICAgICYmICh4IGFzIHVua25vd24gYXMgUGh5c2ljYWxWZXJldGVub0l0ZW0pLnN5c3RlbVxyXG4gICAgICAgICAgICAmJiAoeCBhcyB1bmtub3duIGFzIFBoeXNpY2FsVmVyZXRlbm9JdGVtKS5zeXN0ZW0uaXNFcXVpcHBlZFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghaXRlbSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLmFjdG9yLnVwZGF0ZUVtYmVkZGVkRG9jdW1lbnRzKFwiSXRlbVwiLCBbXHJcbiAgICAgICAgICAgIHsgX2lkOiBpdGVtLl9pZCEsIFwic3lzdGVtLmlzRXF1aXBwZWRcIjogZmFsc2UgfSxcclxuICAgICAgICBdKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyAjb25Bcm1vckFjdGlvbihldmVudDogTW91c2VFdmVudCkge1xyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQ7XHJcbiAgICAgICAgY29uc3QgZGF0YXNldCA9IChlbGVtZW50IGFzIEhUTUxBbmNob3JFbGVtZW50KT8uZGF0YXNldDtcclxuXHJcbiAgICAgICAgY29uc3QgeyBpdGVtVHlwZSwgYWN0aW9uVHlwZSwgaXRlbUlkIH0gPSBkYXRhc2V0O1xyXG5cclxuICAgICAgICBjb25zdCBjaGF0T3B0aW9uczogVmVyZXRlbm9DaGF0T3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgaXNCbGluZDogZmFsc2UgfHwgZXZlbnQuc2hpZnRLZXksXHJcbiAgICAgICAgICAgIHNob3dEaWFsb2c6IChDT05GSUcuU0VUVElOR1MuU2hvd1Rhc2tDaGVja09wdGlvbnMgIT09IGV2ZW50LmN0cmxLZXkpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaXRlbUlkID09IG51bGwgfHwgaXRlbUlkID09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBtZXNzYWdlRGF0YSA9IHtcclxuICAgICAgICAgICAgdXNlcklkOiBnYW1lLnVzZXIuX2lkIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgc3BlYWtlcjogQ2hhdE1lc3NhZ2UuZ2V0U3BlYWtlcigpLFxyXG4gICAgICAgICAgICBmbGF2b3I6ICcnLFxyXG4gICAgICAgICAgICBzb3VuZDogQ09ORklHLnNvdW5kcy5kaWNlLFxyXG4gICAgICAgICAgICBibGluZDogZmFsc2VcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBzd2l0Y2ggKGFjdGlvblR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnYmxvY2snOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucm9sbEFybW9yQmxvY2soaXRlbUlkLCBjaGF0T3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnYWJsYXRlJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmFibGF0ZUFybW9yKGl0ZW1JZCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAncmVwYWlyJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJlcGFpckFybW9yKGl0ZW1JZCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcm9sbEFybW9yQmxvY2soYXJtb3JJZDogc3RyaW5nLCBjaGF0T3B0aW9uczogVmVyZXRlbm9DaGF0T3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBkaWFsb2dSZXN1bHQgPSBuZXcgVmVyZXRlbm9Sb2xsRGlhbG9nQXJndW1lbnQoKTtcclxuICAgICAgICBpZiAoY2hhdE9wdGlvbnMuc2hvd0RpYWxvZykge1xyXG4gICAgICAgICAgICBkaWFsb2dSZXN1bHQgPSBhd2FpdCAobmV3IFZlcmV0ZW5vUm9sbERpYWxvZygpKS5nZXRUYXNrQ2hlY2tPcHRpb25zKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlhbG9nUmVzdWx0LmNhbmNlbGxlZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBtZXNzYWdlRGF0YTogVmVyZXRlbm9NZXNzYWdlRGF0YSA9IHtcclxuICAgICAgICAgICAgdXNlcklkOiBnYW1lLnVzZXIuX2lkIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgc3BlYWtlcjogQ2hhdE1lc3NhZ2UuZ2V0U3BlYWtlcigpLFxyXG4gICAgICAgICAgICBmbGF2b3I6ICdcdTA0MTdcdTA0MzBcdTA0NDlcdTA0MzhcdTA0NDJcdTA0MzAnLFxyXG4gICAgICAgICAgICBzb3VuZDogQ09ORklHLnNvdW5kcy5kaWNlLFxyXG4gICAgICAgICAgICBibGluZDogY2hhdE9wdGlvbnMuaXNCbGluZCB8fCBkaWFsb2dSZXN1bHQuYmxpbmRSb2xsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbGV0IGFybW9yUm9sbERhdGEgPSBhd2FpdCBhY3Rvci5nZXRBcm1vclJvbGxEYXRhKGFybW9ySWQpO1xyXG4gICAgICAgIGlmIChhcm1vclJvbGxEYXRhID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXJtb3JSb2xsRGF0YS5wb29sICs9IGRpYWxvZ1Jlc3VsdC5tb2RpZmllcjtcclxuXHJcbiAgICAgICAgY29uc3Qgcm9sbE9wdGlvbnM6IFZlcmV0ZW5vUm9sbE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFZlcmV0ZW5vUm9sbFR5cGUuQXJtb3JCbG9jayxcclxuICAgICAgICAgICAgbWVzc2FnZURhdGEsXHJcbiAgICAgICAgICAgIHJvbGxEYXRhOiBhcm1vclJvbGxEYXRhXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocm9sbE9wdGlvbnMucm9sbERhdGEucG9vbCA9PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFx1MDQ0MVx1MDQzRVx1MDQzRVx1MDQzMVx1MDQ0OVx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSBcdTA0M0UgXHUwNDQwXHUwNDMwXHUwNDM3XHUwNDMxXHUwNDM4XHUwNDQyXHUwNDNFXHUwNDM5IFx1MDQzMVx1MDQ0MFx1MDQzRVx1MDQzRFx1MDQzNS5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgdmVyZXRlbm9Sb2xsSGFuZGxlciA9IG5ldyBWZXJldGVub1JvbGxlcigpO1xyXG4gICAgICAgIGF3YWl0IHZlcmV0ZW5vUm9sbEhhbmRsZXIucm9sbChyb2xsT3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgYWJsYXRlQXJtb3IoYXJtb3JJZDogc3RyaW5nLCB2YWx1ZTogbnVtYmVyID0gMSkge1xyXG4gICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZSA8IDEpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgYXJtb3IgPSAodGhpcy5hY3Rvci5pdGVtcy5maW5kKHggPT4geC5faWQgPT09IGFybW9ySWQpIGFzIHVua25vd24gYXMgVmVyZXRlbm9Bcm1vcik7XHJcbiAgICAgICAgaWYgKCFhcm1vcikge1xyXG4gICAgICAgICAgICAvLyBcdTA0NDFcdTA0M0VcdTA0M0VcdTA0MzFcdTA0NDlcdTA0MzVcdTA0M0RcdTA0MzhcdTA0MzUgXHUwNDNFXHUwNDMxIFx1MDQzRVx1MDQ0MVx1MDQ0Mlx1MDQ0M1x1MDQ0Mlx1MDQ0MVx1MDQ0Mlx1MDQzMlx1MDQ0M1x1MDQ0RVx1MDQ0OVx1MDQzNVx1MDQzQyBcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzRcdTA0M0NcdTA0MzVcdTA0NDJcdTA0MzUuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcm1vci5zeXN0ZW0uZHVyYWJpbGl0eSA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzRcdTA0NDNcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzZcdTA0MzRcdTA0MzVcdTA0M0RcdTA0MzhcdTA0MzUgXHUwNDNFIFx1MDQ0MFx1MDQzMFx1MDQzN1x1MDQzMVx1MDQzOFx1MDQ0Mlx1MDQzRVx1MDQzOSBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0MzUuXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFybW9yLnN5c3RlbS5kdXJhYmlsaXR5IC09IHZhbHVlO1xyXG5cclxuICAgICAgICBpZiAoYXJtb3Iuc3lzdGVtLmR1cmFiaWxpdHkgPCAwKSB7XHJcbiAgICAgICAgICAgIGFybW9yLnN5c3RlbS5kdXJhYmlsaXR5ID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChhcm1vci5zeXN0ZW0uZHVyYWJpbGl0eSA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzRcdTA0NDNcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzZcdTA0MzRcdTA0MzVcdTA0M0RcdTA0MzhcdTA0MzUgXHUwNDNFIFx1MDQ0MFx1MDQzMFx1MDQzN1x1MDQzMVx1MDQzOFx1MDQ0Mlx1MDQzRVx1MDQzOSBcdTA0MzFcdTA0NDBcdTA0M0VcdTA0M0RcdTA0MzUuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLmFjdG9yLnVwZGF0ZUVtYmVkZGVkRG9jdW1lbnRzKFwiSXRlbVwiLCBbXHJcbiAgICAgICAgICAgIHsgX2lkOiBhcm1vci5faWQhLCBcInN5c3RlbS5kdXJhYmlsaXR5XCI6IGFybW9yLnN5c3RlbS5kdXJhYmlsaXR5IH0sXHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVwYWlyQXJtb3IoYXJtb3JJZDogc3RyaW5nKSB7XHJcbiAgICAgICAgY29uc3QgYXJtb3IgPSAodGhpcy5hY3Rvci5pdGVtcy5maW5kKHggPT4geC5faWQgPT09IGFybW9ySWQpIGFzIHVua25vd24gYXMgVmVyZXRlbm9Bcm1vcik7XHJcbiAgICAgICAgaWYgKCFhcm1vcikge1xyXG4gICAgICAgICAgICAvLyBcdTA0NDFcdTA0M0VcdTA0M0VcdTA0MzFcdTA0NDlcdTA0MzVcdTA0M0RcdTA0MzhcdTA0MzUgXHUwNDNFXHUwNDMxIFx1MDQzRVx1MDQ0MVx1MDQ0Mlx1MDQ0M1x1MDQ0Mlx1MDQ0MVx1MDQ0Mlx1MDQzMlx1MDQ0M1x1MDQ0RVx1MDQ0OVx1MDQzNVx1MDQzQyBcdTA0M0ZcdTA0NDBcdTA0MzVcdTA0MzRcdTA0M0NcdTA0MzVcdTA0NDJcdTA0MzVcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG1heER1cmFiaWxpdHkgPSBhcm1vci5zeXN0ZW0uYXJtb3JDbGFzcyArIGFybW9yLnN5c3RlbS5xdWFsaXR5XHJcbiAgICAgICAgaWYgKGFybW9yLnN5c3RlbS5kdXJhYmlsaXR5ID09PSBtYXhEdXJhYmlsaXR5KSB7XHJcbiAgICAgICAgICAgIC8vIFx1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNFx1MDQ0M1x1MDQzRlx1MDQ0MFx1MDQzNVx1MDQzNlx1MDQzNFx1MDQzNVx1MDQzRFx1MDQzOFx1MDQzNSBcdTA0M0UgXHUwNDQ2XHUwNDM1XHUwNDNCXHUwNDNFXHUwNDM5IFx1MDQzMVx1MDQ0MFx1MDQzRVx1MDQzRFx1MDQzNS5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMuYWN0b3IudXBkYXRlRW1iZWRkZWREb2N1bWVudHMoXCJJdGVtXCIsIFtcclxuICAgICAgICAgICAgeyBfaWQ6IGFybW9yLl9pZCEsIFwic3lzdGVtLmR1cmFiaWxpdHlcIjogbWF4RHVyYWJpbGl0eSB9LFxyXG4gICAgICAgIF0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9DcmVhdHVyZVNoZWV0RGF0YTxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlPiBleHRlbmRzIFZlcmV0ZW5vQWN0b3JTaGVldERhdGE8VEFjdG9yPiB7XHJcbiAgICBzdGF0czogU3RhdHNCbG9jaztcclxuICAgIGF0dHJpYnV0ZXM6IEF0dHJpYnV0ZXNCbG9jaztcclxuICAgIHNraWxsczogU2tpbGxzQmxvY2s7XHJcbiAgICBtYXhIcDogbnVtYmVyO1xyXG4gICAgbWF4V3A6IG51bWJlcjtcclxuICAgIHdlYXBvbnM6IFZlcmV0ZW5vV2VhcG9uW107XHJcbiAgICBlcXVpcHBlZFdlYXBvbnM6IFZlcmV0ZW5vV2VhcG9uW107XHJcbiAgICBhcm1vcnM6IFZlcmV0ZW5vQXJtb3JbXTtcclxuICAgIGVxdWlwcGVkQXJtb3I6IFZlcmV0ZW5vQXJtb3I7XHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmVTaGVldCB9XHJcbmV4cG9ydCB0eXBlIHsgVmVyZXRlbm9DcmVhdHVyZVNoZWV0RGF0YSB9IiwgImltcG9ydCB7IFZlcmV0ZW5vQ2hhcmFjdGVyIH0gZnJvbSBcIi4uXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vQ3JlYXR1cmVTaGVldCwgVmVyZXRlbm9DcmVhdHVyZVNoZWV0RGF0YSB9IGZyb20gXCIuLi9jcmVhdHVyZS9zaGVldFwiO1xyXG5cclxuY2xhc3MgVmVyZXRlbm9DaGFyYWN0ZXJTaGVldDxUQWN0b3IgZXh0ZW5kcyBWZXJldGVub0NoYXJhY3Rlcj4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlU2hlZXQ8VEFjdG9yPntcclxuICAgIHN0YXRpYyBvdmVycmlkZSBnZXQgZGVmYXVsdE9wdGlvbnMoKTogQWN0b3JTaGVldE9wdGlvbnMge1xyXG4gICAgICAgIGNvbnN0IHN1cGVyT3B0aW9ucyA9IHN1cGVyLmRlZmF1bHRPcHRpb25zO1xyXG4gICAgICAgIGNvbnN0IG1lcmdlZE9iamVjdCA9IG1lcmdlT2JqZWN0KHN1cGVyT3B0aW9ucywge1xyXG4gICAgICAgICAgICB3aWR0aDogNTYwLFxyXG4gICAgICAgICAgICBjbGFzc2VzOiBbLi4uc3VwZXJPcHRpb25zLmNsYXNzZXMsICdjaGFyYWN0ZXItc2hlZXQnXSxcclxuICAgICAgICAgICAgdGFiczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hdlNlbGVjdG9yOiBcIi5zaGVldC10YWJzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudFNlbGVjdG9yOiBcIi5zaGVldC1ib2R5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5pdGlhbDogXCJtYWluXCIsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBtZXJnZWRPYmplY3Q7XHJcbiAgICB9XHJcblxyXG4gICAgb3ZlcnJpZGUgYXN5bmMgZ2V0RGF0YShvcHRpb25zOiBQYXJ0aWFsPERvY3VtZW50U2hlZXRPcHRpb25zPiA9IHt9KTogUHJvbWlzZTxWZXJldGVub0NoYXJhY3RlclNoZWV0RGF0YTxUQWN0b3I+PiB7XHJcbiAgICAgICAgY29uc3Qgc2hlZXREYXRhID0gYXdhaXQgc3VwZXIuZ2V0RGF0YShvcHRpb25zKTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBhY3RvciB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgLi4uc2hlZXREYXRhLFxyXG4gICAgICAgICAgICBtb25leTogYWN0b3IuTW9uZXksXHJcbiAgICAgICAgICAgIHJlcHV0YXRpb246IGFjdG9yLlJlcHV0YXRpb24sXHJcbiAgICAgICAgICAgIGV4cDogYWN0b3IuRXhwXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgdGVtcGxhdGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIGBzeXN0ZW1zL3ZlcmV0ZW5vL3RlbXBsYXRlcy9zaGVldHMvYWN0b3JzL2NoYXJhY3Rlci1zaGVldC5oYnNgO1xyXG4gICAgfVxyXG59XHJcblxyXG5pbnRlcmZhY2UgVmVyZXRlbm9DaGFyYWN0ZXJTaGVldERhdGE8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9DaGFyYWN0ZXI+IGV4dGVuZHMgVmVyZXRlbm9DcmVhdHVyZVNoZWV0RGF0YTxUQWN0b3I+IHtcclxuICAgIG1vbmV5OiBudW1iZXI7XHJcbiAgICByZXB1dGF0aW9uOiBudW1iZXI7XHJcbiAgICBleHA6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9DaGFyYWN0ZXJTaGVldCB9IiwgImltcG9ydCB7IFZlcmV0ZW5vTW9uc3RlciB9IGZyb20gXCIuLlwiO1xyXG5pbXBvcnQgeyBWZXJldGVub0NyZWF0dXJlU2hlZXQgfSBmcm9tIFwiLi4vY3JlYXR1cmUvc2hlZXRcIjtcclxuXHJcbmNsYXNzIFZlcmV0ZW5vTW9uc3RlclNoZWV0PFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vTW9uc3Rlcj4gZXh0ZW5kcyBWZXJldGVub0NyZWF0dXJlU2hlZXQ8VEFjdG9yPntcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB7IFZlcmV0ZW5vTW9uc3RlclNoZWV0IH0iLCAiaW1wb3J0IHsgVmVyZXRlbm9OcGMgfSBmcm9tIFwiLi5cIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9DcmVhdHVyZVNoZWV0IH0gZnJvbSBcIi4uL2NyZWF0dXJlL3NoZWV0XCI7XHJcblxyXG5jbGFzcyBWZXJldGVub05wY1NoZWV0PFRBY3RvciBleHRlbmRzIFZlcmV0ZW5vTnBjPiBleHRlbmRzIFZlcmV0ZW5vQ3JlYXR1cmVTaGVldDxUQWN0b3I+e1xyXG5cclxufVxyXG5cclxuZXhwb3J0IHsgVmVyZXRlbm9OcGNTaGVldCB9IiwgImV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclNldHRpbmdzKCk6IHZvaWQge1xyXG4gICAgZ2FtZS5zZXR0aW5ncy5yZWdpc3RlcihcInZlcmV0ZW5vXCIsIFwidmlzaWJpbGl0eS5zaG93VGFza0NoZWNrT3B0aW9uc1wiLCB7XHJcbiAgICAgICAgbmFtZTogXCJ2ZXJldGVuby5zZXR0aW5ncy5zaG93VGFza0NoZWNrT3B0aW9ucy5uYW1lXCIsXHJcbiAgICAgICAgaGludDogXCJ2ZXJldGVuby5zZXR0aW5ncy5zaG93VGFza0NoZWNrT3B0aW9ucy5oaW50XCIsXHJcbiAgICAgICAgc2NvcGU6IFwiY2xpZW50XCIsXHJcbiAgICAgICAgY29uZmlnOiB0cnVlLFxyXG4gICAgICAgIGRlZmF1bHQ6IHRydWUsXHJcbiAgICAgICAgdHlwZTogQm9vbGVhblxyXG4gICAgfSk7XHJcbn0iLCAiY2xhc3MgVmVyZXRlbm9DbGllbnRTZXR0aW5ncyB7XHJcbiAgICBnZXQgU2hvd1Rhc2tDaGVja09wdGlvbnMoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIGdhbWUuc2V0dGluZ3MuZ2V0KFwidmVyZXRlbm9cIiwgXCJ2aXNpYmlsaXR5LnNob3dUYXNrQ2hlY2tPcHRpb25zXCIpIGFzIGJvb2xlYW47XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBWZXJldGVub0NsaWVudFNldHRpbmdzIHtcclxuICAgIFNob3dUYXNrQ2hlY2tPcHRpb25zOiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgeyBWZXJldGVub0NsaWVudFNldHRpbmdzIH07IiwgImltcG9ydCB7IFZlcmV0ZW5vQXJtb3JTaGVldCB9IGZyb20gJyRtb2R1bGUvaXRlbS9hcm1vci9zaGVldCc7XHJcbmltcG9ydCB7IFZlcmV0ZW5vSXRlbVNoZWV0IH0gZnJvbSAnJG1vZHVsZS9pdGVtL2Jhc2Uvc2hlZXQnO1xyXG5pbXBvcnQgeyBWRVJFVEVOT0NPTkZJRyB9IGZyb20gJy4uLy4uL3ZlcmV0ZW5vQ29uZmlnJztcclxuaW1wb3J0IHsgVkVSRVRFTk9fUEFSVElBTFMgfSBmcm9tICcuLi8uLi9wYXJ0aWFscyc7XHJcbmltcG9ydCB7IFZlcmV0ZW5vV2VhcG9uU2hlZXQgfSBmcm9tICckbW9kdWxlL2l0ZW0vd2VhcG9uL3NoZWV0JztcclxuaW1wb3J0IHsgVmVyZXRlbm9DaGFyYWN0ZXJTaGVldCB9IGZyb20gJyRtb2R1bGUvYWN0b3IvY2hhcmFjdGVyL3NoZWV0JztcclxuaW1wb3J0IHsgVmVyZXRlbm9Nb25zdGVyU2hlZXQgfSBmcm9tICckbW9kdWxlL2FjdG9yL21vbnN0ZXIvc2hlZXQnO1xyXG5pbXBvcnQgeyBWZXJldGVub05wY1NoZWV0IH0gZnJvbSAnJG1vZHVsZS9hY3Rvci9ucGMvc2hlZXQnO1xyXG5pbXBvcnQgeyByZWdpc3RlclNldHRpbmdzIH0gZnJvbSAnJG1vZHVsZS9zeXN0ZW0vc2V0dGluZ3MnO1xyXG5pbXBvcnQgeyBWZXJldGVub0NsaWVudFNldHRpbmdzIH0gZnJvbSAnJG1vZHVsZS9zeXN0ZW0vc2V0dGluZ3MvY2xpZW50LXNldHRpbmdzJztcclxuXHJcbmZ1bmN0aW9uIHByZWxvYWRIYW5kbGViYXJzVGVtcGxhdGVzKCkge1xyXG4gICAgcmV0dXJuIGxvYWRUZW1wbGF0ZXMoVkVSRVRFTk9fUEFSVElBTFMpO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgSW5pdCA9IHtcclxuICAgIGxpc3RlbigpOiB2b2lkIHtcclxuICAgICAgICBIb29rcy5vbmNlKCdpbml0JywgYXN5bmMgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlZlcmV0ZW5vIHwgU3lzdGVtIGluaXQgYmVnaW4uXCIpO1xyXG5cclxuICAgICAgICAgICAgQ09ORklHLlZFUkVURU5PID0gVkVSRVRFTk9DT05GSUc7XHJcbiAgICAgICAgICAgIENPTkZJRy5TRVRUSU5HUyA9IG5ldyBWZXJldGVub0NsaWVudFNldHRpbmdzKCk7XHJcblxyXG4gICAgICAgICAgICBBY3RvcnMudW5yZWdpc3RlclNoZWV0KCdjb3JlJywgQWN0b3JTaGVldCk7XHJcbiAgICAgICAgICAgIEFjdG9ycy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vQ2hhcmFjdGVyU2hlZXQsIHtcclxuICAgICAgICAgICAgICAgIHR5cGVzOiBbJ2NoYXJhY3RlciddLFxyXG4gICAgICAgICAgICAgICAgbWFrZURlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIEFjdG9ycy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vTW9uc3RlclNoZWV0LCB7XHJcbiAgICAgICAgICAgICAgICB0eXBlczogWydtb25zdGVyJ10sXHJcbiAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgQWN0b3JzLnJlZ2lzdGVyU2hlZXQoJ3ZlcmV0ZW5vJywgVmVyZXRlbm9OcGNTaGVldCwge1xyXG4gICAgICAgICAgICAgICAgdHlwZXM6IFsnbnBjJ10sXHJcbiAgICAgICAgICAgICAgICBtYWtlRGVmYXVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIEl0ZW1zLnVucmVnaXN0ZXJTaGVldCgnY29yZScsIEl0ZW1TaGVldCk7XHJcbiAgICAgICAgICAgIEl0ZW1zLnJlZ2lzdGVyU2hlZXQoJ3ZlcmV0ZW5vJywgVmVyZXRlbm9JdGVtU2hlZXQsIHtcclxuICAgICAgICAgICAgICAgIG1ha2VEZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBJdGVtcy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vQXJtb3JTaGVldCwge1xyXG4gICAgICAgICAgICAgICAgdHlwZXM6IFsnYXJtb3InXSxcclxuICAgICAgICAgICAgICAgIG1ha2VEZWZhdWx0OiB0cnVlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBJdGVtcy5yZWdpc3RlclNoZWV0KCd2ZXJldGVubycsIFZlcmV0ZW5vV2VhcG9uU2hlZXQsIHtcclxuICAgICAgICAgICAgICAgIHR5cGVzOiBbJ3dlYXBvbiddLFxyXG4gICAgICAgICAgICAgICAgbWFrZURlZmF1bHQ6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBwcmVsb2FkSGFuZGxlYmFyc1RlbXBsYXRlcygpO1xyXG5cclxuICAgICAgICAgICAgcmVnaXN0ZXJTZXR0aW5ncygpO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJWZXJldGVubyB8IFN5c3RlbSBpbml0IGRvbmUuXCIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4iLCAiaW1wb3J0IHsgVmVyZXRlbm9BY3RvciB9IGZyb20gXCIkbW9kdWxlL2FjdG9yXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgVmVyZXRlbm9BY3RvcnM8VEFjdG9yIGV4dGVuZHMgVmVyZXRlbm9BY3RvcjxudWxsPj4gZXh0ZW5kcyBBY3RvcnM8VEFjdG9yPiB7XHJcblxyXG59IiwgImltcG9ydCB7IFZlcmV0ZW5vQWN0b3JQcm94eSB9IGZyb20gXCIkbW9kdWxlL2FjdG9yL2Jhc2UvZG9jdW1lbnRcIjtcclxuaW1wb3J0IHsgVmVyZXRlbm9BY3RvcnMgfSBmcm9tIFwiJG1vZHVsZS9jb2xsZWN0aW9uXCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vSXRlbVByb3h5IH0gZnJvbSBcIiRtb2R1bGUvaXRlbS9iYXNlL2RvY3VtZW50XCI7XHJcbmltcG9ydCB7IFZlcmV0ZW5vUm9sbCB9IGZyb20gXCIkbW9kdWxlL3N5c3RlbS9yb2xsXCI7XHJcblxyXG5leHBvcnQgY29uc3QgTG9hZCA9IHtcclxuICAgIGxpc3RlbigpOiB2b2lkIHtcclxuICAgICAgICBDT05GSUcuQWN0b3IuY29sbGVjdGlvbiA9IFZlcmV0ZW5vQWN0b3JzO1xyXG4gICAgICAgIENPTkZJRy5BY3Rvci5kb2N1bWVudENsYXNzID0gVmVyZXRlbm9BY3RvclByb3h5O1xyXG4gICAgICAgIENPTkZJRy5JdGVtLmRvY3VtZW50Q2xhc3MgPSBWZXJldGVub0l0ZW1Qcm94eTtcclxuXHJcbiAgICAgICAgQ09ORklHLkRpY2Uucm9sbHMucHVzaChWZXJldGVub1JvbGwpO1xyXG4gICAgfVxyXG59IiwgImltcG9ydCB7IEluaXQgfSBmcm9tICcuL2luaXQnO1xyXG5pbXBvcnQgeyBMb2FkIH0gZnJvbSAnLi9sb2FkJztcclxuXHJcbmV4cG9ydCBjb25zdCBIb29rc1ZlcmV0ZW5vID0ge1xyXG4gICAgbGlzdGVuKCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGxpc3RlbmVyczogeyBsaXN0ZW4oKTogdm9pZCB9W10gPSBbXHJcbiAgICAgICAgICAgIEluaXQsXHJcbiAgICAgICAgICAgIExvYWQsXHJcbiAgICAgICAgXTtcclxuICAgICAgICBmb3IgKGNvbnN0IExpc3RlbmVyIG9mIGxpc3RlbmVycykge1xyXG4gICAgICAgICAgICBMaXN0ZW5lci5saXN0ZW4oKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG59O1xyXG4iLCAiaW1wb3J0IHsgSG9va3NWZXJldGVubyB9IGZyb20gJy4vc2NyaXB0cy9ob29rcy9pbmRleCc7XHJcblxyXG5Ib29rc1ZlcmV0ZW5vLmxpc3RlbigpOyJdLAogICJtYXBwaW5ncyI6ICI7OztBQUVBLE1BQU0sb0JBQU4sY0FBNEQsVUFBaUI7QUFBQSxJQUN6RSxJQUFJLFdBQVc7QUFDWCxhQUFPLEtBQUssS0FBSztBQUFBLElBQ3JCO0FBQUEsSUFFQSxJQUFJLGlCQUFpQjtBQUNqQixhQUFPLEtBQUssS0FBSztBQUFBLElBQ3JCO0FBQUEsSUFFQSxXQUFXLGlCQUFpQjtBQUN4QixZQUFNLG9CQUFvQixLQUFLLFNBQVMsSUFBSSxRQUFRLFVBQVUsS0FBSztBQUVuRSxZQUFNLFVBQVUsWUFBWSxNQUFNLGdCQUFnQjtBQUFBLFFBQzlDLE9BQU87QUFBQSxRQUNQLFNBQVMsQ0FBQyxZQUFZLFFBQVEsT0FBTztBQUFBLE1BQ3pDLENBQUM7QUFDRCxVQUFHLG1CQUFrQjtBQUNq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LE1BQzlDLENBQUM7QUFBQSxJQUNMO0FBQUEsRUFDSjs7O0FDdkRPLE1BQU0saUJBQU4sY0FBaUUsT0FBZTtBQUFBLEVBRXZGOzs7QUNDTyxNQUFNLE9BQU87QUFBQSxJQUNoQixTQUFlO0FBQ1gsYUFBTyxNQUFNLGFBQWE7QUFDMUIsYUFBTyxNQUFNLGdCQUFnQjtBQUM3QixhQUFPLEtBQUssZ0JBQWdCO0FBRTVCLGFBQU8sS0FBSyxNQUFNLEtBQUssWUFBWTtBQUFBLElBQ3ZDO0FBQUEsRUFDSjs7O0FDVk8sTUFBTSxnQkFBZ0I7QUFBQSxJQUN6QixTQUFlO0FBQ1gsWUFBTSxZQUFrQztBQUFBLFFBQ3BDO0FBQUEsUUFDQTtBQUFBLE1BQ0o7QUFDQSxpQkFBVyxZQUFZLFdBQVc7QUFDOUIsaUJBQVMsT0FBTztBQUFBLE1BQ3BCO0FBQUEsSUFDSjtBQUFBLEVBQ0o7OztBQ1hBLGdCQUFjLE9BQU87IiwKICAibmFtZXMiOiBbIldlYXBvblR5cGUiLCAiUmFuZ2VUeXBlIiwgIlNraWxsVHlwZSIsICJodG1sIl0KfQo=
