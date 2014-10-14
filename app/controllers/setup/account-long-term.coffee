`import Ember from 'ember'`

Controller = Ember.Controller.extend
  longTermLocation: null
  warnSavingsLocation: Ember.computed.equal 'longTermLocation', 'personal'


`export default Controller`