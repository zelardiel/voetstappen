define(['underscore', 'Backbone', 'text!views/map/MapView.tpl', 'views/map/MarkerView', 'models/MarkerModel'],
    function (_, Backbone, MapViewTemplate, MarkerView, MarkerModel) {
        var MapView = Backbone.View.extend({
            initialize: function() {

                var self = this;
                $('#logout').on('click', function(){
                    self.logout();
                });
                $('#logout').text('LADEN');
                
            },
            events:{
                'click #btnBack':'btnBack_clickHandler'
            },

            attributes: {
                id: 'map'
            },

            render: function () {
                //dont use a template because we are doing everything with marker adding
                this.render.$el;                    
                //do this after rendering 
                this.initMap();

                return this;
            },

            initMap: function() {

                var self = this;

                // window.map = new GMaps({
                //     div: self.el,
                //     lat: 52.668055,
                //     lng: 5.193787,
                //     zoom: 10
                // }); 

                // this.getPosition(5000);

                //call function out of the db.js object
                App.dbClass.retrieveLocalFootsteps(this.setFootsteps);

                //listen for when it's done due to async problems
                App.Vent.on('retrievingFootsteps:done', this.afterSettingFootsteps, this);

                //if collection.length != 0 fill it with database data
         

            },

            //this function get's exectued after triggering backbone custom event for dealing
            //with async problem
            afterSettingFootsteps: function() {
                $('#logout').text('KLARA');  
                console.log('exectued');

                //set view's variable
                this.footsteps = window.footsteps;
                //clear ugly window variable
                window.footsteps = null;  

                this.fillModelsWithMarkers();
            },

            addMarker: function(model) {
                //instantions are camelcase
                //var markerView = new MarkerView({ model:  MarkerModel })

                // window.map.addMarker({
                //   lat: model.get('lat'),
                //   lng: model.get('lng'),
                //   click : function() {
                //     console.log('a location');
                //   }
                // });

                //this.$el.append(markerView.render().el);
            },

            fillModelsWithMarkers: function() {
                var self = this;

                self.collection.each(this.addMarker, this);

                //instantiate model
                var modelMarker = new MarkerModel();

                //fill a model
                modelMarker.set(
                    {
                        lat: 52.668055, 
                        lng: 5.193787 
                    });

                this.collection.add(modelMarker);

                console.log(this.collection);
                
                //end foreach
            },

            //this is the callback of the retrieveLocalFootsteps function
            setFootsteps: function(tx, results) {
                window.footsteps = [];

                for (var i = 0; i < results.rows.length; i++) {
                    window.footsteps.push(results.rows.item(i));
                }

                //trigger backbone custom event to deal with async problems
                App.Vent.trigger('retrievingFootsteps:done');
                

            },

            getPosition : function(timeoutInSeconds) {
                var options = { timeout: timeoutInSeconds, enableHighAccuracy: true  };
                navigator.geolocation.watchPosition(this.onSuccesOfGettingLocation, this.onErrorGettingLocation, options);
            },

            onSuccesOfGettingLocation: function(position) {

                window.map.addMarker({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  click : function() {
                    console.log('my own location');
                  }
                });
            },

            onErrorGettingLocation: function(error) {
               alert('code: '    + error.code    + '\n' +
                'message: ' + error.message + '\n');
            },

            btnBack_clickHandler: function (event) {
               
            },

            logout: function() {
                App.dbClass.initLogoutUser();
            },

        });

        return MapView;
    });