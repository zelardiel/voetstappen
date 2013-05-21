define(['underscore', 'Backbone', 'text!views/footstepContent/FootstepContentView.tpl', 'collections/FootstepContentCollection', 'views/footstepContent/FootstepContentsView'],
    function (_, Backbone, FootstepContentViewT, FootstepContentCollection, FootstepContentsView) {
      var FootstepContentView = Backbone.View.extend({

         events: {
            'click .content-location' : 'navigate',
         },

         template: Handlebars.compile(FootstepContentViewT),

         render: function() {
            var json = this.model.toJSON();
            var html = this.template(json);
            this.$el.html(html);
            return this;
         },

         navigate: function(e) {
            e.preventDefault();
            var position = $(e.currentTarget).data('location');

            //App.ViewInstances.FootstepContentsView = new FootstepContentsView({collection: new FootstepContentCollection, footstep_id: this.model.get('footstep_id'), location: position }); 
            //App.Helpers.processView('FootstepContentsView', App.ViewInstances.FootstepContentsView); 
            
         },
      });

   return FootstepContentView;
});
