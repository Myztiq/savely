`import Ember from 'ember'`

Router = Ember.Router.extend
  location: SavelyENV.locationType

Router.map ->
  @route 'login'
  @route 'register'
  @route 'logout'
  @route 'forgot-password'

  @resource 'setup', path: 'setup', ->
    @route 'identity'
    @route 'verify-records'
    @route 'goals'
    @route 'plan'
    @route 'account-long-term'
    @route 'account-short-term'
    @route 'investment'
    @resource 'goal', {path: 'goals/:goal_id'}

  @route 'dashboard'

`export default Router`
