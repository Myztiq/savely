`import Base from 'simple-auth/authenticators/base'`
`import Ember from 'ember'`

CustomAuthenticator = Base.extend
  authenticate: (options)->
    cleanupUser = new Ember.RSVP.Promise (resolve)->
      if Kinvey.getActiveUser()?
        resolve Kinvey.getActiveUser().logout({ force: true })
        console.log 'Had to cleanup user on login'
      else
        resolve()

    cleanupUser.then ->
      Kinvey.User.login(options.email, options.password)
      .then (user)->
        console.log 'Logged User In'
        return id: user.id

  invalidate: ->
    Kinvey.getActiveUser()?.logout({force: true})

  restore: ->
    return new Ember.RSVP.Promise (resolve, reject)->
      user = Kinvey.getActiveUser()
      if user?.id
        console.log 'Found existing user to restore'
        resolve()
      else
        console.log 'No active user found'
        reject()

Initializer =
  name: 'authentication'
  before: 'simple-auth'
  after: 'kinvey'
  initialize: (container)->
    container.register('authenticator:custom', CustomAuthenticator);

`export default Initializer`