`import Ember from 'ember'`
`import RouteOnlyInsecure from 'savely/mixins/route-only-insecure'`

Route = Ember.Route.extend RouteOnlyInsecure,
  secured: false
  actions:
    register: ->
      @controller.set 'isProcessing', true

      email = @controller.get 'email'
      password = @controller.get 'password'
      @controller.set 'password', null

      Kinvey.User.signup
        email: email
        username: email
        password: password
      .then =>
        @controller.set 'isProcessing', false
        @get('session').authenticate 'authenticator:custom',
          email: email
          password: password
        .then =>
          @transitionTo 'index'

      .catch (error)=>
        console.log error
        @controller.set 'isProcessing', false
        @controller.set 'error', error

`export default Route`