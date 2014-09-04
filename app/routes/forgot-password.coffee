`import Ember from 'ember'`
`import RouteOnlyInsecure from 'savely/mixins/route-only-insecure'`

Route = Ember.Route.extend RouteOnlyInsecure,
  secured: false

`export default Route`