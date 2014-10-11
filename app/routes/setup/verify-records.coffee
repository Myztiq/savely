`import Ember from 'ember'`

Route = Ember.Route.extend

  activate: ->
    @controllerFor('setup').set 'step', 'identity'

  deactivate: ->
    @controllerFor('setup').set 'step', null

`export default Route`