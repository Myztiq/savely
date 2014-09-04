`import Ember from 'ember'`

Controller = Ember.Controller.extend
  percentContribution: 2

  dollarContribution: ((key, value)->
    if value?
      percent = value / @get('activeUser.salary') * 100
      @set 'percentContribution', percent

    dollarContribution = @get('activeUser.salary') * (@get('percentContribution') / 100)
    parseFloat(dollarContribution, 10).toFixed(2);
  ).property('percentContribution')

`export default Controller`