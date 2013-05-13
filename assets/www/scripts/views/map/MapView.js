define(['underscore', 'Backbone', 'text!views/map/MapView.tpl', 'views/map/MarkerView', 'models/MarkerModel'],
    function (_, Backbone, MapViewTemplate, MarkerView, MarkerModel) {
        var MapView = Backbone.View.extend({
            initialize: function() {

                var self = this;
                $('#logout').on('click', function(){
                    self.logout();
                });
                $('#logout').text('LADEN');

                App.Vent.on('loadingMarkers:done', this.finishedLoading, this)
                
            },
            events:{
                'click #btnBack':'btnBack_clickHandler'
            },

            attributes: {
                id: 'map'
            },

            finishedLoading: function() {
                $('#logout').text('KLARA');  
                console.log('exectued');
                console.log(footsteps)            
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

                //if collection.length != 0 fill it with database data
                // console.log(this.collection.length);
                this.fillModelsWithMarkers();
                // console.log(this.collection.length);
                this.collection.each(this.addMarker, this);
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

                //foreach fetched database data
                var self = this;
                //this.footsteps[] will be set - note: setFootsteps is passed as callback to retrieve the result in this view
                App.dbClass.initRetrieveLocalFootsteps(this.setFootsteps);
                

                console.log(footsteps);
                //instantiate model
                var modelMarker = new MarkerModel();

                //fill a model
                modelMarker.set(
                    {
                        lat: 52.668055, 
                        lng: 5.193787 
                    });

                this.collection.add(modelMarker);

                App.Vent.trigger('loadingMarkers:done');
                //end foreach
            },

            setFootsteps: function(tx, results) {
                var footsteps = [];

                for (var i = 0; i < results.rows.length; i++) {
                    footsteps.push(results.rows.item(i));
                }
                

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