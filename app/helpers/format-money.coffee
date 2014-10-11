formatMoney = Ember.Handlebars.makeBoundHelper (value, options) ->
  accounting.formatMoney value, (options.hash.symbol or "$"), (options.hash.precision or 0)

`export default formatMoney`