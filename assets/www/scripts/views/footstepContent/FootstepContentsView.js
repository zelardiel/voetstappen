define(['underscore', 'Backbone', 'views/footstepContent/FootstepContentView', 'collections/FootstepContentCollection', 'models/FootstepContentModel', 'libs/handlebars/handlebars'],
    function (_, Backbone, FootstepContentView, FootstepContentCollection, FootstepContentModel) {
       var FootstepContentsView = Backbone.View.extend({
          id: 'FootstepContentsView',
          destructionPolicy: 'auto',

          initialize: function(){
            var self = this;

            window.footstep_content = null;
            this.footstepContentModel = null;

            document.addEventListener("backbutton", self.previousView, false);
            
            this.initGetDatabaseFootstepContents(this.options.footstep_id, this.options.location, this.options.start_content_id);
       
            App.Vent.on('readyToRenderSubiews:done', this.render, this);
          },

         render: function() {
          if(this.footstepContentModel != null) {
            App.ViewInstances.footstepContentView = new FootstepContentView({ model: this.footstepContentModel });
            this.$el.append(App.ViewInstances.footstepContentView.render().el);
          }
          
          return this;
         },

         initGetDatabaseFootstepContents: function(footstep_id, location, start_content_id) {
          if(start_content_id != null) {
             App.dbClass.retrieveFootstepContentsWithContentId(this.setFootstepContents, start_content_id);
           } else {
             App.dbClass.retrieveFootstepContentWithWithLocationAndFootstepId(this.setFootstepContents, footstep_id, location);
           }
        
            //listen for when it's done due to async problems
            App.Vent.on('retrievingFootstepContents:done', this.afterSettingFootstepContents, this);
          },

            //this is the callback of the retrieveLocalFootsteps function
         setFootstepContents: function(tx, results) {
            window.footstep_content = results.rows.item(0);  
            //trigger backbone custom event to deal with async problems
            App.Vent.trigger('retrievingFootstepContents:done');
         },

          //this function get's exectued after triggering backbone custom event for dealing
         //with async problem
         afterSettingFootstepContents: function() {
            this.footstepContentModel = new FootstepContentModel;

              this.footstepContentModel.set(
              {
                  footstep_content_id: window.footstep_content.footstep_content_id,
                  footstep_title: window.footstep_content.title,
                  content: window.footstep_content.content,
                  location: window.footstep_content.location
              });
            
            App.Vent.trigger('readyToRenderSubiews:done');
         },

   		previousView : function() {
            App.StackNavigator.popView();
        },
       });
      return FootstepContentsView;
   });