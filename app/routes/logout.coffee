`import Ember from 'ember'`

Route = Ember.Route.extend
  secured: true
  beforeModel: (transition)->
    @_super(transition)
    transition.send 'invalidateSession'


`export default Route`