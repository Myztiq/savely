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

      cleanupUser = new Ember.RSVP.Promise (resolve)->
        if Kinvey.getActiveUser()?
          resolve Kinvey.getActiveUser().logout({ force: true })
        else
          resolve()

      cleanupUser.then =>
        Kinvey.User.signup
          email: email
          username: email
          password: password
        .then =>
          Kinvey.getActiveUser().logout().then =>

            @controller.set 'isProcessing', false
            @get('session').authenticate 'authenticator:custom',
              email: email
              password: password
            .then =>
              @transitionTo 'index'

      .catch (error)=>
        @controller.set 'isProcessing', false
        @controller.set 'error', error.errors.description

`export default Route`