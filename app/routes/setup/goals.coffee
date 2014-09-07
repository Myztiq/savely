`import Ember from 'ember'`

Route = Ember.Route.extend
  model: ->
    @store.find('goal')

  actions:
    save: ->
      firstGoal = @controller.get('model').filterBy('enabled', true).get 'firstObject'
      if firstGoal?
        @transitionTo 'goal', firstGoal
      else
        @transitionTo 'dashboard'

`export default Route`