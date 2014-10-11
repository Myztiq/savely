`import Ember from 'ember'`

Controller = Ember.ObjectController.extend
  purchaseDate: 'unsure'
  isDate: Ember.computed.equal 'purchaseDate', 'date'

`export default Controller`