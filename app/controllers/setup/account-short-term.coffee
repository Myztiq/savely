`import Ember from 'ember'`

Controller = Ember.Controller.extend
  shortTermLocation: null
  warnSavingsLocation: (->
    @get('shortTermLocation') and @get('shortTermLocation') != 'dreamForward'
  ).property 'shortTermLocation'


`export default Controller`