`import Ember from 'ember'`

Controller = Ember.ObjectController.extend
  hasSavedMoney: false

  actions:
    savedMoney: (hasSavedMoney)->
      @set 'canContinue', true
      if hasSavedMoney
        @set 'hasSavedMoney', true
      else
        @set 'hasSavedMoney', false
        @set 'saved', 0


`export default Controller`