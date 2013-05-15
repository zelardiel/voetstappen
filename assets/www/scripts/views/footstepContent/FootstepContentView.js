define(['underscore', 'Backbone', 'text!views/footstepContent/FootstepContentView.tpl', 'collections/FootstepContentCollection'],
    function (_, Backbone, FootstepContentView, FootstepContentCollection) {
       var FootstepContentView = Backbone.View.extend({
       		initialize: function(object){
      			console.log(object);
       		}
       });

       return FootstepContentView;
    });