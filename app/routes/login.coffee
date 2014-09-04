`import Ember from 'ember'`
`import RouteOnlyInsecure from 'savely/mixins/route-only-insecure'`

Route = Ember.Route.extend RouteOnlyInsecure,
  secured: false
  actions:
    login: ->
      @controller.set 'isProcessing', true

      email = @controller.get 'email'
      password = @controller.get 'password'
      @controller.set 'password', null

      @controller.set 'isProcessing', false
      @get('session').authenticate 'authenticator:custom',
        email: email
        password: password
      .then =>
        @transitionTo 'index'

`export default Route`