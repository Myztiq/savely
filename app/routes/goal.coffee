`import Ember from 'ember'`

Route = Ember.Route.extend
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