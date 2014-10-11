`import DS from 'ember-data'`

Goals = DS.Model.extend
  label: DS.attr('string')
  enabled: DS.attr('boolean')
  disabled: DS.attr('boolean')

Goals.reopenClass
  FIXTURES: [
    {id: 'retirement', label: 'Retirement', disabled: true, enabled: true}
    {id: 'car', label: 'New car'}
    {id: 'wedding', label: 'Wedding fund'}
    {id: 'home', label: 'New home purchase'}
    {id: 'move', label: 'Move to a new apartment'}
    {id: 'college', label: 'College education'}
    {id: 'vacation', label: 'Big vacation'}
    {id: 'baby', label: 'New baby'}
    {id: 'gift', label: 'Big one-time gift or purchase'}
    {id: 'endowment', label: 'Saving money to pass on to younger generations'}
    {id: 'wealth', label: 'Build wealth'}
    {id: 'other', label: 'Other goal(s)'}
  ]


`export default Goals`