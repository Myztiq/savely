`import Ember from 'ember'`

Controller = Ember.Controller.extend
  stepIdentity: Ember.computed.equal 'step', 'identity'
  stepGoals: Ember.computed.equal 'step', 'goals'
  stepPlan: Ember.computed.equal 'step', 'plan'
  stepOpenAccount: Ember.computed.equal 'step', 'openAccount'

  step: null

`export default Controller`