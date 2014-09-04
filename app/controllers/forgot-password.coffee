`import Ember from 'ember'`

Controller = Ember.Controller.extend
  actions:
    forgotPassword: ->
      Kinvey.User.resetPassword(@get('email')).then =>
        @set 'resetSent', true

`export default Controller`