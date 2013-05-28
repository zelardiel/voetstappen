define(['underscore', 'Backbone', 'text!views/footstepContent/FootstepContentView.tpl'],
    function (_, Backbone, FootstepContentViewT) {
      var FootstepContentView = Backbone.View.extend({
         initialize: function() {
            App.Vent.on('retrievingFootstepContents:done', this.afterSettingFootstepContents, this);

            this.swipeContent();
         },

         events: {
            'click .content-location' : 'navigate',
         },

         template: Handlebars.compile(FootstepContentViewT),

         render: function() {
            var json = this.model.toJSON();
            var html = this.template(json);
            this.$el.html(html);

            //append pagination dynamically
            for(var i = 1; i <= this.model.get('location_count'); i++) {
               this.$el.find('#pagination-content-container').append('<a href="#" data-location="' + i + '" class="content-location">' + i + '</a>');
            }

            console.log('render piece of content');
                      
            return this;
         },

         swipeContent: function() {
            var self = this;
            $('.slide, .content').hammer({prevent_default:true}).bind("swipeleft", function(ev) {
               var position = $(this).find('article.piece-of-content').data('location');  
               console.log(self.model.attributes);  
               App.dbClass.retrieveFootstepContentWithWithLocationAndFootstepId(self.setFootstepContents, self.model.get('footstep_id'), position);
            });

            $('.slide, .content').hammer({prevent_default:true}).bind("swiperight", function(ev) {
               var position = $(this).find('article.piece-of-content').data('location');
               App.dbClass.retrieveFootstepContentWithWithLocationAndFootstepId(self.setFootstepContents, self.model.get('footstep_id'), position);   
            });
         },

         navigate: function(e) {
            console.log('NAVIGATING');
            e.preventDefault();
            var position = $(e.currentTarget).data('location');

            App.dbClass.retrieveFootstepContentWithWithLocationAndFootstepId(this.setFootstepContents, this.model.get('footstep_id'), position);   
         },

         setFootstepContents: function(tx, results) {
            window.footstep_content = results.rows.item(0);

            console.log('setfootstepcontents');
            App.Vent.trigger('retrievingFootstepContents:done');
         },

         afterSettingFootstepContents: function() {
            this.model.set({
               footstep_id: window.footstep_content.footstep_id,
               footstep_content_id: window.footstep_content.footstep_content_id,
               footstep_title: window.footstep_content.title,
               content: window.footstep_content.content,
               location: window.footstep_content.location,
               location_count: window.footstep_content.location_count,
               is_found: window.footstep_content.is_found
            });

            //render ourselves with the new model
            this.render();
         },
      });

   return FootstepContentView;
});
