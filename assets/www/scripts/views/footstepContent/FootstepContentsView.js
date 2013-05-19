define(['underscore', 'Backbone', 'text!views/footstepContent/FootstepContentView.tpl', 'collections/FootstepContentCollection', 'models/FootstepContentModel'],
    function (_, Backbone, FootstepContentViewT, FootstepContentCollection, FootstepContentModel) {
       var FootstepContentsView = Backbone.View.extend({
          id: 'FootstepContentsView',
          destructionPolicy: 'never',

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
            console.log('THIS HAPPENS RENDER INIT OF COLLECITONVIEW');
            if(window.footstep_contents.length != 0) {
              console.log('THIS HAPPENS RENDER OF COLLECITONVIEW');
                this.collection.each(this.renderModelView, this); 
                //pass this to set the context as this object, because we're in the _'s .each function function this refers to the window
            } else {
              
            }

            return this;
          },

          renderModelView: function(model) {
            if(model.attributes.footstep_content_id == window.start_content_id || (window.start_content_id == null && model.attributes.location == 1)){
              var footstepContentView = new FootstepContentView({ model: model });
              this.$el.append(footstepContentView.render().el);
            }
            
          },

          initGetDatabaseFootstepContents: function(footstep_id) {
                var self = this;
                //call function out of the db.js object
                App.dbClass.retrieveFootstepContents(self.setFootstepContents, footstep_id);
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
              this.footstep_contents = window.footstep_contents;

              $.each(this.footstep_contents, function(index, val){
                var footstepContentModel = new FootstepContentModel;

                footstepContentModel.set(
                {
                    footstep_content_id: val.footstep_content_id,
                    footstep_title: val.title,
                    content: val.content,
                    location: val.location
                });

                self.collection.add(footstepContentModel);     

              });

              App.Vent.trigger('readyToRenderSubiews:done', this.render);
          },

       		previousView : function() {
                App.StackNavigator.popView();
            },
       });

      var FootstepContentView = Backbone.View.extend({
        el: 'div',
        template: Handlebars.compile(FootstepContentViewT),

        render: function() {
          var json = this.model.toJSON();
          var html = this.template(json);

          this.$el.html(html);
          return this;
        },
      });

       return FootstepContentsView;
    });