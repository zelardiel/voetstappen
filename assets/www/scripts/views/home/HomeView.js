define(['jquery', 'underscore', 'Backbone', 'views/photoAssignment/PhotoAssignmentView', 'text!views/home/HomeView.tpl'],
    function ($, _, Backbone, PhotoAssignmentView, HomeViewTemplate) {
        var HomeView = Backbone.View.extend({

            initialize: function() {
                document.addEventListener('backbutton', this.onBackKey, false);
            },

            events: {
                'click #btnNextView':'btnNextView_clickHandler'
            },

            onBackKey: function() {
                alert('BACK');
            },

            render : function() {
                this.$el.html(_.template(HomeViewTemplate));
                return this;
            },

            btnNextView_clickHandler : function (e) {
                e.preventDefault();
                App.StackNavigator.pushView(PhotoAssignmentView);
            }

        });
        return HomeView;
    });