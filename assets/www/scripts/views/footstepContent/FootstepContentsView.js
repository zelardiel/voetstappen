define(['underscore', 'Backbone', 'text!views/footstepContent/FootstepContentView.tpl', 'collections/FootstepContentCollection', 'models/FootstepContentModel', 'libs/handlebars/handlebars'],
    function (_, Backbone, FootstepContentViewT, FootstepContentCollection, FootstepContentModel) {
       var FootstepContentsView = Backbone.View.extend({
          id: 'FootstepContentsView',
          destructionPolicy: 'auto',

          initialize: function(object, start_content_id){
            var self = this;
            console.log('INIT FOOTSTEPCONTENT');
            window.start_content_id = start_content_id;
            this.collection = new FootstepContentCollection;
            this.start_content_id = ( start_content_id ) ? start_content_id : null;
            window.footstep_contents = [];

            document.addEventListener("backbutton", self.previousView, false);
            
            this.initGetDatabaseFootstepContents(object.footstep_id);

            App.Vent.on('readyToRenderSubiews:done', this.render, this);
          },

          render: function() {
            
            if(window.footstep_contents.length != 0) {
               console.log('THIS HAPPENS RENDER INIT OF COLLECITONVIEW');
                this.collection.each(this.renderModelView, this); 
                //pass this to set the context as this object, because we're in the _'s .each function function this refers to the window
            } else {
              
            }

            return this;
          },

          renderModelView: function(model) {
            if(model.attributes.footstep_content_id == window.start_content_id || (window.start_content_id == null && model.attributes.location == 1)){
              App.ViewInstances.footstepContentView = new FootstepContentView({ model: model });
              this.$el.append(footstepContentView.render().el);
            }
            
          },

          initGetDatabaseFootstepContents: function(footstep_id) {
                var self = this;
                //call function out of the db.js object
                if(footstep_id == null){

                  App.dbClass.retrieveFootstepContentsWithContentId(self.setFootstepContents, window.start_content_id);
                }else{
                  App.dbClass.retrieveFootstepContents(self.setFootstepContents, footstep_id);
                }
                //listen for when it's done due to async problems
                App.Vent.on('retrievingFootstepContents:done', self.afterSettingFootstepContents, self);
          },

            //this is the callback of the retrieveLocalFootsteps function
          setFootstepContents: function(tx, results) {
              console.log(results.rows);
              for (var i = 0; i < results.rows.length; i++) {
                  window.footstep_contents.push(results.rows.item(i));
              }

              //trigger backbone custom event to deal with async problems
              App.Vent.trigger('retrievingFootstepContents:done');
          },

          //this function get's exectued after triggering backbone custom event for dealing
          //with async problem
          afterSettingFootstepContents: function() {
              //instead of using the window context, put it in the view's context
              var self = this;
              console.log(self.collection.length);
              $.each(window.footstep_contents, function(index, val){
                var footstepContentModel = new FootstepContentModel;

                footstepContentModel.set(
                {
                    footstep_content_id: val.footstep_content_id,
                    footstep_title: val.title,
                    content: val.content,
                    location: val.location
                });

                self.collection.add(footstepContentModel);     
                 console.log(self.collection.length);
              });

              App.Vent.trigger('readyToRenderSubiews:done');
          },

       		previousView : function() {
                App.StackNavigator.popView();
            },
       });

      var FootstepContentView = Backbone.View.extend({
         el: 'div',

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
            console.log($(e.currentTarget));
            App.ViewInstances.FootstepContentsView = new FootstepContentsView({ footstep_id: this.model.get('footstep_id') }, position); 

            console.log('RENDER COLLCTION FROM MODEL');
            App.Helpers.processView('FootstepContentsView', App.ViewInstances.FootstepContentsView); 
            
         },

      });

      return FootstepContentsView;
   });