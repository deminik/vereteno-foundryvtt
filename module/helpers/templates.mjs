/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    'systems/vereteno/templates/actor/parts/actor-features.hbs',
    'systems/vereteno/templates/actor/parts/actor-items.hbs',
    'systems/vereteno/templates/actor/parts/actor-spells.hbs',
    'systems/vereteno/templates/actor/parts/actor-effects.hbs',
    // Item partials
    'systems/vereteno/templates/item/parts/item-effects.hbs',
    "systems/vereteno/templates/sidebar/vereteno-roll.html",
    "systems/vereteno/templates/sidebar/test.hbs",
  ]);
};
