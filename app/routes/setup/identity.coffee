`import Ember from 'ember'`

Route = Ember.Route.extend

  activate: ->
    @controllerFor('setup').set 'step', 'identity'

  deactivate: ->
    @controllerFor('setup').set 'step', null

  actions:
    save: ->
      console.log 'SAVING'
      social = @controller.get('social').replace(/[^0-9]+/g,'')
      @controller.set 'searching', true
      @transitionTo 'setup.verify-records'
#      Kinvey.execute('validateSocial', {social: social})
#      .then (rtn)=>
#        console.log rtn
#
#      , =>
#        @controller.set 'invalid', true
#        @controller.set 'searching', false



`export default Route`