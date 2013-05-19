define(['underscore', 'Backbone', 'text!views/footstepContent/FootstepContentView.tpl', 'collections/FootstepContentCollection'],
    function (_, Backbone, FootstepContentView, FootstepContentCollection) {
       var FootstepContentView = Backbone.View.extend({
       		initialize: function(object){
            var self = this;
            window.footstep_contents = [];

            document.addEventListener("backbutton", self.previousView, false);

            this.initGetDatabaseFootstepContents(object.footstep_id);
       		},

          initGetDatabaseFootstepContents: function(footstep_id) {
                //set up map
                var self = this;

                //call function out of the db.js object
                App.dbClass.retrieveFootstepContents(setFootstepContents, footstep_id);
                //listen for when it's done due to async problems
                App.Vent.on('retrievingFootstepContents:done', self.afterSettingFootstepContents, self);
          },

            //this is the callback of the retrieveLocalFootsteps function
          setFootstepContents: function(tx, results) {
              window.footsteps = [];

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
              this.footstep_contents = window.footstep_contents;

              console.log(this.footstep_contents);

          },

       		previousView : function() {
                App.StackNavigator.popView();
            },
       });

       return FootstepContentView;
    });