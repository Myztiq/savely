currencyInput = Ember.TextField.extend
  unformatted: null

  value: ((key, value)->
    if value?
      @set 'unformatted', accounting.unformat value

    if @get('unformatted')
      accounting.formatMoney @get('unformatted'), precision: 0
    else
      return
  ).property()

`export default currencyInput`