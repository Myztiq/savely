`import Base from 'simple-auth/authenticators/base'`
`import Ember from 'ember'`

CustomAuthenticator = Base.extend
  authenticate: (options)->
    Kinvey.User.login(options.email, options.password)
    .then (user)->
      return id: user.id

  invalidate: ->
    Kinvey.getActiveUser()?.logout()

  restore: ->
    return new Ember.RSVP.Promise (resolve, reject)->
      user = Kinvey.getActiveUser()
      if user?.id
        resolve()
      else
        reject()

Initializer =
  name: 'authentication'
  before: 'simple-auth'
  after: 'kinvey'
  initialize: (container)->
    container.register('authenticator:custom', CustomAuthenticator);

`export default Initializer`