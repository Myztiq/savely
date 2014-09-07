`import Ember from 'ember'`

Controller = Ember.ObjectController.extend
  canContinue: false
  children: []
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

  actions:
    addChild: ->
      @get('children').addObject(Ember.Object.create())

`export default Controller`