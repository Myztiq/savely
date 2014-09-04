`import Ember from 'ember'`

Router = Ember.Router.extend
  location: SavelyENV.locationType

Router.map ->
  @route 'login'
  @route 'register'
  @route 'logout'
  @route 'forgot-password'

  @route 'setup/401k'
  @route 'setup/goals'

`export default Router`
