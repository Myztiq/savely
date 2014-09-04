`import Ember from 'ember'`

Route = Ember.Route.extend
  actions:
    save: ->
      @transitionTo 'setup/goals'

`export default Route`