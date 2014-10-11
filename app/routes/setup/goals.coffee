`import Ember from 'ember'`

Route = Ember.Route.extend
  activate: ->
    @controllerFor('setup').set 'step', 'goals'

  deactivate: ->
    @controllerFor('setup').set 'step', null

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