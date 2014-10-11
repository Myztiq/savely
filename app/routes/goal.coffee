`import Ember from 'ember'`

Route = Ember.Route.extend
  activate: ->
    @controllerFor('setup').set 'step', 'goals'

  deactivate: ->
    @controllerFor('setup').set 'step', null

  model: (args)->
    @store.find('goal', args.goal_id)

  renderTemplate: (controller, model)->
    path = "setup/goals/#{model.get('id')}"
    @render path,
      controller: path
      model: model

  actions:
    save: ->
      @controller.set('model.enabled', false)
      @store.find('goal').then (goals)=>
        goal = goals.filterBy('enabled', true).get('firstObject')
        if goal?
          @transitionTo 'goal', goal
        else
          @transitionTo 'dashboard'

`export default Route`