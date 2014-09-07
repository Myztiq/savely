`import Ember from 'ember'`

Controller = Ember.ObjectController.extend
  incorrectInformation: false
  actions:
    incorrectInfo: ->
      @set 'incorrectInformation', true

`export default Controller`