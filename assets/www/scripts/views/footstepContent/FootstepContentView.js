define(['underscore', 'Backbone', 'text!views/footstepContent/FootstepContentView.tpl', 'collections/FootstepContentCollection'],
    function (_, Backbone, FootstepContentView, FootstepContentCollection) {
       var FootstepContentView = Backbone.View.extend({
       		initialize: function(object){
      			console.log(object);
      			var self = this;
      			document.addEventListener("backbutton", self.previousView, false);
 
       		},

       		previousView : function() {
                App.StackNavigator.popView();
            },
       });

       return FootstepContentView;
    });