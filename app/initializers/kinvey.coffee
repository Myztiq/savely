`import Ember from 'ember'`

Initializer =
  name: "kinvey"
  after: 'store'
  initialize: (container, application) ->
    Kinvey.init container, application,
      appKey: "kid_WyUQ0yNTz"
      appSecret: "f7498e806a2646f4b9f6e67d7ac7eb49"

    application.inject 'controller', 'activeUser', 'user:active'
    application.inject 'router', 'activeUser', 'user:active'

`export default Initializer`