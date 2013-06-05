define(['underscore', 'Backbone', 'views/footstepContent/FootstepContentView', 'collections/FootstepContentCollection', 'models/FootstepContentModel'],
    function (_, Backbone, FootstepContentView, FootstepContentCollection, FootstepContentModel) {
       var FootstepContentsView = Backbone.View.extend({
          id: 'FootstepContentsView',
          destructionPolicy: 'never',

          initialize: function(){
            var self = this;

            window.footstep_content = null;
            this.footstepContentModel = null;
            window.clicked = 0;
       
            App.Vent.on('readyToRenderSubiews:done', this.render, this);

            App.Vent.on('retrievingFootstepContents:done', this.afterSettingFootstepContents, this);

            //if view is active start adding map
            this.on('viewActivate', this.viewIsActive, this);

            this.on('viewDeactivate', this.viewDeactivated, this);

        },

        viewIsActive: function() {
          window.footstep_content = null;
          this.footstepContentModel = null;

          this.initGetDatabaseFootstepContents(this.options.footstep_id, this.options.location, this.options.start_content_id);

          document.addEventListener("backbutton", this.onBackButton, false);
          document.addEventListener('contextmenu', this.onBackButton, false); 
        },

        viewDeactivated: function() {
            document.removeEventListener("backbutton", this.onBackButton, false);
            document.removeEventListener("contextmenu", this.onBackButton, false);
            window.footstep_content = null;

            $('#FootstepContentsView').hammer().off("dragright");
            $('#FootstepContentsView').hammer().off("dragleft");

            $('.footstep-content').remove();

            delete App.ViewInstances.footstepContentView;

            window.clicked = 0;

        },

         render: function() {
          if(this.footstepContentModel != null) {
              if(App.ViewInstances.footstepContentView == null ) {
                App.ViewInstances.footstepContentView = new FootstepContentView({ model: this.footstepContentModel });
              } else {
                App.ViewInstances.footstepContentView.model = this.footstepContentModel;
              }
            
              this.$el.append(App.ViewInstances.footstepContentView.render().el);
          }
          
          return this;
         },

         initGetDatabaseFootstepContents: function(footstep_id, location, start_content_id) {
          console.log(start_content_id, " " + location);
          if(start_content_id !== null) {
             App.dbClass.retrieveFootstepContentsWithContentId(this.setFootstepContents, start_content_id);
           } else {
             App.dbClass.retrieveFootstepContentWithWithLocationAndFootstepId(this.setFootstepContents, footstep_id, location);
           }
        
            //listen for when it's done due to async problems
            
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
                  footstep_id: window.footstep_content.footstep_id,
                  footstep_content_id: window.footstep_content.footstep_content_id,
                  footstep_title: window.footstep_content.title,
                  content: window.footstep_content.content,
                  location: window.footstep_content.location,
                  location_count: window.footstep_content.location_count,
                  is_found: window.footstep_content.is_found
              });

            App.Vent.trigger('readyToRenderSubiews:done');
         },

        onBackButton: function(e) {
              window.clicked++;

              if(window.clicked == 1) {
                  App.Helpers.renderMapView(); 
              }  
         },
      });
      return FootstepContentsView;
   });