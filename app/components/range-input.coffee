RangeInput = Ember.View.extend
  tagName: "input"
  attributeBindings: [
    "type"
    "min"
    "max"
    "step"
    "value"
    "name"
  ]
  type: "range"
  min: 0
  max: 10
  step: 1
  value: 5
  input: (event) ->
    @set "value", parseFloat event.target.value
    return

`export default RangeInput`