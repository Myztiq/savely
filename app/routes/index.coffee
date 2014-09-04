`import Ember from 'ember'`

Route = Ember.Route.extend
  beforeModel: ->
    unless @get('currentUser.setup')
      @transitionTo 'setup/401k'


`export default Route`