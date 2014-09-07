`import DS from 'ember-data'`

Goals = DS.Model.extend
  label: DS.attr('string')
  enabled: DS.attr('boolean')
  disabled: DS.attr('boolean')

Goals.reopenClass
  FIXTURES: [
    {id: 'retirement', label: 'Saving for Retirement', disabled: true, enabled: true}
    {id: 'car', label: 'Saving for a new car'}
    {id: 'wedding', label: 'Saving for a wedding fund'}
    {id: 'home', label: 'Saving for a new home purchase'}
    {id: 'move', label: 'Saving for a move to a new apartment'}
    {id: 'college', label: 'Saving for a college education'}
    {id: 'vacation', label: 'Saving for a big vacation'}
    {id: 'baby', label: 'Saving for a new baby'}
    {id: 'gift', label: 'Saving for a big one-time gift or purchase'}
    {id: 'endowment', label: 'Saving money to pass on to younger generations'}
    {id: 'wealth', label: 'Build wealth'}
    {id: 'other', label: 'Other goal(s)'}
  ]


`export default Goals`