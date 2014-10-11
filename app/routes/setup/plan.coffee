`import Ember from 'ember'`

Route = Ember.Route.extend

  activate: ->
    @controllerFor('setup').set 'step', 'plan'

  deactivate: ->
    @controllerFor('setup').set 'step', null

`export default Route`