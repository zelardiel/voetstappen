define(['underscore', 'Backbone', 'text!views/footstepContent/FootstepContentView.tpl'],
    function (_, Backbone, FootstepContentViewT) {
      var FootstepContentView = Backbone.View.extend({
         initialize: function() {
            console.log(this.model);
            App.Vent.on('retrievingFootstepContents:done', this.afterSettingFootstepContents, this);

            this.model.on('change', this.render);
            this.swipeContent();
         },

         template: Handlebars.compile(FootstepContentViewT),

         render: function() {
         
            var json = this.model.toJSON();
            var html = this.template(json);
            this.$el.html(html);

            this.$el.find('.piece-of-content').fadeIn(400);

            return this;
         },

         swipeContent: function() {
            var self = this;
            var position = 0;
            $('#FootstepContentsView').hammer({prevent_default:true}).bind("swiperight", function(ev) {
               ev.gesture.stopDetect();
              
               var position = $(this).find('article.piece-of-content').data('location');  

               if(position == 1) {
                  position = 5;
               } else {
                  position -=1;
               }
               console.log(position);

               self.$el.find('.piece-of-content').fadeOut(200);
              
               App.dbClass.retrieveFootstepContentWithWithLocationAndFootstepId(self.setFootstepContents, self.model.get('footstep_id'), position);
            });

            $('#FootstepContentsView').hammer({prevent_default:true}).bind("swipeleft", function(ev) {
               ev.gesture.stopDetect();

               var position = $(this).find('article.piece-of-content').data('location');

               if(position == 5) {
                  position = 1;
               } else {
                  position+=1;
               }

               self.$el.find('.piece-of-content').fadeOut(400);

               console.log(position);
               App.dbClass.retrieveFootstepContentWithWithLocationAndFootstepId(self.setFootstepContents, self.model.get('footstep_id'), position);   
            });
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
               location_count: window.footstep_content.location_count,
               is_found: window.footstep_content.is_found
            });

         },
      });

   return FootstepContentView;
});
