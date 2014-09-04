RouteOnlyInsecure = Ember.Mixin.create
  beforeModel: (transition)->
    @_super(transition)
    if @get('session').get 'isAuthenticated'
      @transitionTo 'index'

`export default RouteOnlyInsecure`