`import Ember from 'ember'`

Child = Ember.Object.extend

  hasSaved: (->
    @get('saved') > 0
  ).property 'saved'

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
      @get('children').addObject(new Child())

`export default Controller`