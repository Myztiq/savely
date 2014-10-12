CurrencyInput = Ember.TextField.extend
  unformatted: null

  unformattedWatcher: (->
    @set 'value', @get 'unformatted'
  ).observes 'unformatted'

  value: ((key, value)->
    if value?
      @set 'unformatted', accounting.unformat value

    if @get('unformatted')
      unformatted = @get('unformatted')
      precision = 0
      if "#{unformatted}".indexOf('.') > -1
        precision = 2
      accounting.formatMoney @get('unformatted'), precision: precision
    else
      return
  ).property()

`export default CurrencyInput`