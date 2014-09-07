`import Ember from 'ember'`

Router = Ember.Router.extend
  location: SavelyENV.locationType

Router.map ->
  @route 'login'
  @route 'register'
  @route 'logout'
  @route 'forgot-password'

  @route 'setup/identity'
  @route 'setup/verify-records'
  @route 'setup/goals'

  @resource 'goal', {path: 'setup/goals/:goal_id'}

  @route 'dashboard'

`export default Router`
