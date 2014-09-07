View = Ember.View.extend
  socialWatcher: (->
    @set 'controller.invalid', false
  ).observes 'controller.social'

  searchText: (->
    if @get 'controller.searching'
      return 'Verifying...'
    else
      return 'Verify Identity'
  ).property 'controller.searching'

`export default View`