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
      firstGoal = @controller.get('model').filterBy('selected', true).filterBy('completed', false).get('firstObject')
      @transitionTo 'goal', firstGoal

`export default Route`