`import DS from 'ember-data'`
`import Ember from 'ember'`

User = Kinvey.User.extend
  setup: DS.attr('boolean')
  salary: DS.attr('number')

  defaultedSalary: (->
    @get('salary') or 5000
  ).property 'salary'

`export default User`