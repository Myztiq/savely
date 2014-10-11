`import Ember from 'ember'`

Controller = Ember.ObjectController.extend
  isDate: Ember.computed.equal 'purchaseDate', 'date'

  calculateDownPayment: Ember.computed.equal 'paymentType', 'calculate'
  knownValue: Ember.computed.equal 'paymentType', 'knownValue'
  goalAmount: (->
    amount = Math.ceil @get('carCost') * .15
    if amount < 10
      return null
    return amount
  ).property 'carCost'

  typeWatcher: (->
    if @get('paymentType') == 'dontKnow'
      @set 'carCost', 4500

  ).property 'paymentType'

`export default Controller`