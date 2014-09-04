`import Ember from 'ember'`

Ember.Route.reopen
  secured: true
  beforeModel: (transition)->
    @_super(transition)
    if @get('secured') and not @get('session').get 'isAuthenticated'
      transition.abort()
      @get('session').set 'attemptedTransition', transition
      transition.send 'authenticateSession'