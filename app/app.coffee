`import Ember from 'ember'`
`import Resolver from 'ember/resolver'`
`import loadInitializers from 'ember/load-initializers'`
`import 'savely/lib/route'`

Ember.MODEL_FACTORY_INJECTIONS = true;

App = Ember.Application.extend
  modulePrefix: 'savely'
  Resolver: Resolver

loadInitializers App, 'savely'

`export default App`
