`import Ember from 'ember'`

Controller = Ember.ObjectController.extend
  canContinue: false
  hasAddedAChild: false
  previousChildName: null
  moneyLocations: [
    {
      label:"In a checking, savings or CD account"
      id: 'bank'
    }
    {
      label: "Invested in the stock market via a brokerage account"
      id: 'invested'
    }
    {
      label: "In a tax-advantaged 529 or UMA"
      id: 'tax-advantage'
    }
    {
      label:"Not sure"
      id: 'unknown'
    }
  ]

  exactAmount: Ember.computed.equal 'savedOption', 'exactAmount'

  actions:
    addChild: ->
      @set 'previousChildName', @get 'name'
      @set 'hasAddedAChild', true
      @set 'name', null
      @set 'savedOption', null
      @set 'age', null
      @set 'location', null

`export default Controller`