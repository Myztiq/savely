`import Ember from 'ember'`

Route = Ember.Route.extend
  actions:
    save: ->
      social = @controller.get('social').replace(/[^0-9]+/g,'')
      @controller.set 'searching', true
      Kinvey.execute('validateSocial', {social: social})
      .then ()=>
        @transitionTo 'setup/verify-records'

      , =>
        @controller.set 'invalid', true
        @controller.set 'searching', false



`export default Route`