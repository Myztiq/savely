`import Ember from 'ember'`


dollarSliderComputed = (maxAmount, percentage, storage)->
  ((key, value)->
    if value?
      @set storage, value
      #@set percentage, value / @get(maxAmount) * 100
    else
      newDollars = @get(percentage) / 100 * @get(maxAmount)
      if newDollars != @get(storage)
        @set storage, newDollars

    accounting.toFixed @get(storage), 2
  ).property percentage, maxAmount

boundPercentageComputed = (storage, boundPercentages...)->
  ((key, value)->
    if value?
      changeToEach = (@get(storage) - value)/boundPercentages.length

      sortOrder = -1
      if changeToEach > 0
        sortOrder = 1

      valueBindings = []
      boundPercentages.forEach (boundPercentage, index)=>
        valueBindings.push
          key: boundPercentage
          value: @get boundPercentage

      valueBindings.sort (obj1, obj2)->
        Ember.compare obj1.value, obj2.value

      valueBindings.forEach (valueBinding, index)=>
        currentPercent = valueBinding.value
        newPercent = currentPercent + changeToEach

        if newPercent < 0
          changeToEach += newPercent / (valueBindings.length - index - 1)
          newPercent = 0

        @set valueBinding.key, newPercent

      @set storage, value

    accounting.toFixed @get(storage), 2
  ).property storage, boundPercentages...

Controller = Ember.Controller.extend
  paycheckAmount: 3000

  paycheckAllocationPercentage: 15
  _paycheckAllocationDollars: 0
  paycheckAllocationDollars: dollarSliderComputed 'paycheckAmount', 'paycheckAllocationPercentage', '_paycheckAllocationDollars'

  _shortTermPercentage: 25
  shortTermPercentage: boundPercentageComputed '_shortTermPercentage', '_longTermPercentage', '_retirementPercentage'

  _shortTermDollars: 0
  shortTermDollars: dollarSliderComputed 'paycheckAllocationDollars', 'shortTermPercentage', '_shortTermDollars'
  
  _longTermPercentage: 25
  longTermPercentage: boundPercentageComputed '_longTermPercentage', '_shortTermPercentage', '_retirementPercentage'
  _longTermDollars: 0
  longTermDollars: dollarSliderComputed 'paycheckAllocationDollars', 'longTermPercentage', '_longTermDollars'
  
  _retirementPercentage: 50
  retirementPercentage: boundPercentageComputed '_retirementPercentage', '_shortTermPercentage', '_longTermPercentage'
  _retirementDollars: 0
  retirementDollars: dollarSliderComputed 'paycheckAllocationDollars', 'retirementPercentage', '_retirementDollars'


  _samanthaPercentage: 70
  samanthaPercentage: boundPercentageComputed '_samanthaPercentage', '_timPercentage'
  _samanthaDollars: 0
  samanthaDollars: dollarSliderComputed 'longTermDollars', '_samanthaPercentage', '_samanthaDollars'

  _timPercentage: 30
  timPercentage: boundPercentageComputed '_timPercentage', '_samanthaPercentage'
  
  _timDollars: 0
  timDollars: dollarSliderComputed 'longTermDollars', 'timPercentage', '_timDollars'





`export default Controller`