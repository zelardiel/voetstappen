define(['underscore', 'Backbone', 'text!views/map/MapView.tpl', 'models/MarkerModel'],
    function (_, Backbone, MapViewTemplate, MarkerModel) {
        var MapView = Backbone.View.extend({
            initialize: function() {
                //listen for if a model is added to the markercollection do this..
                this.collection.bind('add', this.addMarker, this);  
                this.collection.bind('add', this.addMarkerRadius, this);                
            },

            events:{
                'click #btnBack':'btnBack_clickHandler'
            },

            attributes: {
                id: 'map'
            },

            render: function () {
                
                this.$el.html(_.template(MapViewTemplate));                    
                //do this after rendering 
                this.initMap();

                return this;
            },

            initMap: function() {

                //set up map

                //get google maps object for latlng of amsterdam
                var latlng = new google.maps.LatLng(52.374004, 4.890359),
                    self = this;

                // options for the map
                this.mapOptions = {
                    zoom: 12,
                    center: latlng,
                    mapTypeControl: false,
                    navigationControl: false,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };

                //use native javascript so google maps can chain native on it
                // do something only the first time the map is loaded

                    if(!$("#map").attr('data-maploaded')) {
                        this.map = new google.maps.Map(document.getElementById("map"), this.mapOptions);

                        google.maps.event.addListenerOnce(this.map, 'idle', function(){
                            $("#map").data('maploaded', true);

                            //call function out of the db.js object
                            App.dbClass.retrieveLocalFootsteps(self.setFootsteps);
                            //listen for when it's done due to async problems
                            App.Vent.on('retrievingFootsteps:done', self.afterSettingFootsteps, self);
                            //models are present from previous load, directly add markers

                            self.getOwnPosition(10000);
                        });
                     
                    } else {
                        console.log('map already present');
                    }
             
               
                //if collection.length != 0 fill it with database data
         

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

            //this function get's exectued after triggering backbone custom event for dealing
            //with async problem
            afterSettingFootsteps: function() {
                //instead of using the window context, put it in the view's context
                this.footsteps = window.footsteps;

                //clear ugly window variable
                window.footsteps = null;

                //now we can fill models with markers since the data is available
                this.fillModelsWithMarkers();
            },

            //foreach each local data object of the footsteps table fill a backbone model so we
            //can set markers with the model it's attributes
            fillModelsWithMarkers: function() {
                var self = this;

                if(self.collection.length === 0) {
                   $.each(self.footsteps, function(index, val){
                        //instantiate model which is gonna be pushed into the collection
                        var modelMarker = new MarkerModel();

                        modelMarker.set(
                        {
                            footstep_id: val.footstep_id,
                            title: val.title,
                            image_id: val.image_id,
                            latitude: val.latitude,
                            longitude: val.longitude,
                            updated_at: val.updated_at
                        });

                        self.collection.add(modelMarker);
                    });

                }
               
            },

            addMarker: function(model) {
                var self = this,
                    latlng = new google.maps.LatLng(model.get('latitude'), model.get('longitude'));

                // make a variable that contains an image
                var footstep_image = './img/voetstap2.png';
                // voetstapNietGevonden = '../../img/voetstap1.png',
                // voetstap1position = ;

                // Drop Voetstap1 marker with image from image variable
                var footsep_marker = new google.maps.Marker({
                    footstep_id: model.footstep_id,
                    position: latlng, 
                    map: self.map, 
                    title: model.get('title'),
                    icon: footstep_image
                });

                google.maps.event.addListener(footsep_marker, 'click', function() { 
                    alert('FOOTSTEP_ID' + " " + model.get('footstep_id') + " " + "GOTO VIEW" );
                }); 

            },

            addMarkerRadius: function(model) {
                 //check for own position, which obviously doesnt need a radius
                if(model.get('footstep_id') === 0) {
                    return;
                }

                var self = this,
                    circleRadius = 500,
                    latlng = new google.maps.LatLng(model.get('latitude'), model.get('longitude'));

                // Place a circle that will cause the push
                var circle = new google.maps.Circle({
                    map: self.map,
                    radius: circleRadius,
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
                    center: latlng,
                    strokeWeight: 3,
                    fillColor: "#FF0000",
                    fillOpacity: 0.35
                });


                // Get the bounds of the circle
                var bounds = circle.getBounds();

                // Check if our extracted latlng is in this bounds
                // if (bounds.contains(latlng)){
                //     //Redirect
                //     alert('HIT!');
                // }
            },

            //OWN POSITION FUNCTIONS

            getOwnPosition : function(timeoutInSeconds) {
                //magic context swap trick
                window.collection = this.collection;
                var options = { timeout: timeoutInSeconds, enableHighAccuracy: true  };
                navigator.geolocation.watchPosition(this.onSuccesGetOwnPosition, this.onErrorGetPosition, options);
            },

            onSuccesGetOwnPosition: function(position) {
                //since window is available in this context use it
                this.collection = window.collection;

                //create model with our own location..
                var modelMarker = new MarkerModel();

                modelMarker.set(
                {
                    footstep_id: 0, //0 = own position
                    title: 'Uw locatie',
                    image_id: 1,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    updated_at: 0
                });

                this.collection.add(modelMarker);

                //undo magic swap trick
                window.collection = null;

            },

            onErrorGetPosition: function(error) {
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