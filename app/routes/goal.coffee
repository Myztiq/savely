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
      @controller.set('model.completed', true)
      @store.find('goal').then (goals)=>
        goal = goals.filterBy('completed', false).filterBy('selected', true).get('firstObject')
        if goal?
          @transitionTo 'goal', goal
        else if @controller.get('model.id') == 'emergency-funds'
          @transitionTo 'setup.plan'
        else
          @transitionTo 'goal', goals.findBy('id', 'emergency-funds')

`export default Route`