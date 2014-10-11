currencyInput = Ember.TextField.extend
  unformatted: null

  value: ((key, value)->
    if value?
      @set 'unformatted', accounting.unformat value

    accounting.formatMoney @get('unformatted'), precision: 0
  ).property()

`export default currencyInput`