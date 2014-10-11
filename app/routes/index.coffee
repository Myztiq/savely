`import Ember from 'ember'`

Route = Ember.Route.extend
  beforeModel: ->
    unless @get('currentUser.setup')
      @transitionTo 'setup.identity'


`export default Route`