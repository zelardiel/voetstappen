define(['underscore', 'Backbone', 'text!views/footstepContent/FootstepContentView.tpl'],
    function (_, Backbone, FootstepContentViewT) {
      var FootstepContentView = Backbone.View.extend({
         initialize: function() {
              
         },

         events: {
            'click .content-location' : 'navigate',
         },

         template: Handlebars.compile(FootstepContentViewT),

         render: function() {
            console.log(this.model.attributes);
            var json = this.model.toJSON();
            var html = this.template(json);
            this.$el.html(html);

            //get the total amount of contents from the model
            //append pagination
            for(var i = 0; i < this.model.get('location_count'); i++) {
                //this.$el.find('.content-location');
            }
           
            return this;
         },

         navigate: function(e) {
            e.preventDefault();
            var position = $(e.currentTarget).data('location');

            App.dbClass.retrieveFootstepContentWithWithLocationAndFootstepId(this.setFootstepContents, this.model.get('footstep_id'), position);

            App.Vent.on('retrievingFootstepContents:done', this.afterSettingFootstepContents, this);
         },

         setFootstepContents: function(tx, results) {
            window.footstep_content = results.rows.item(0);

            App.Vent.trigger('retrievingFootstepContents:done');
         },

         afterSettingFootstepContents: function() {
            this.model.set({
               footstep_id: window.footstep_content.footstep_id,
               footstep_content_id: window.footstep_content.footstep_content_id,
               footstep_title: window.footstep_content.title,
               content: window.footstep_content.content,
               location: window.footstep_content.location,
               location_count: window.footstep_content.location_count
            });

            //render ourselves with the new model
            this.render();
         },
      });

   return FootstepContentView;
});
