define(['underscore', 'Backbone', 'text!views/map/MapView.tpl', 'models/MarkerModel', 'views/scanner/ScannerView', 'views/footstepContent/FootstepContentsView', 'collections/FootstepContentCollection', 'libs/hammer/hammer'],
    function (_, Backbone, MapViewTemplate, MarkerModel, ScannerView, FootstepContentsView, FootstepContentCollection, hammer) {
        var MapView = Backbone.View.extend({
            id: 'MapView',

            events:{
                'click #btnBack':'btnBack_clickHandler',
                'click #scan':'scanClickHandler'
            },

            destructionPolicy: 'auto',

            initialize: function() {
                //set markers to the window because of context issues
                window.markers = [];
                window.circles = [];

                //create geolocator watch id
                this.watchID;

                //call jquery events
                this.jqueryEvents();

                //legenda functionalities
                this.handleLegenda();
                
                //listen for if a model is added to the markercollection do this..
                this.collection.bind('add', this.initAddMarker, this);  
                this.collection.bind('add', this.addMarkerRadius, this);

                //if view is active start adding map
                this.on('viewActivate', this.viewIsActive, this);

            },

            viewIsActive: function() {
                this.appendMap();
            },

            jqueryEvents: function() {
                var self = this;

                $('.button-container').show();
                $('.showMenu').show();
                $('.logout').show();

                $('.logout').on('click', function(){
                    self.logout();
                });

                $("#scan").on('click', function() {
                    if(App.ViewInstances.ScannerView == null) {
                        App.ViewInstances.ScannerView = new ScannerView; 
                    }

                    App.Helpers.processView('ScannerView', App.ViewInstances.ScannerView); 
                });
            },

            handleLegenda: function() {
                $('.legenda, .hide').hammer({prevent_default:true}).bind("dragup", function(ev) {
                    $('.legenda').addClass("legenda-animation");
                    $('.hide').addClass('up');
                });

                // once the columns are down, the drag event is triggered on the mask
                $(".legenda, .hide").hammer({prevent_default:true}).bind("dragdown", function(ev) {
                    $(".legenda").removeClass("legenda-animation");
                    $('.hide').removeClass("up");
                });
            },

            render: function () {
                //dont use a template because we are doing everything with marker adding
                this.$el.html(_.template(MapViewTemplate));
                 
                return this;
            },

            appendMap: function() {

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

                
                if(window.markers.length == 0) {
                    // this.map = new google.maps.Map(document.getElementById("map"), this.mapOptions);
                    this.map = new google.maps.Map(document.getElementById("MapView"), this.mapOptions);

                    //after map is loaded start loading markers from database
                    google.maps.event.addListenerOnce(this.map, 'idle', function(){
                        self.initGetDatabaseFootsteps();
                    });
                 
                } else {
                    console.log('map already present');
                    //get position anyway
                    this.getOwnPosition(10000); 
                }
              
            },

            initGetDatabaseFootsteps: function() {
                //set up map
                var self = this;

                //call function out of the db.js object
                App.dbClass.retrieveLocalFootsteps(self.setFootsteps);
                //listen for when it's done due to async problems
                App.Vent.on('retrievingFootsteps:done', self.afterSettingFootsteps, self);
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

                //AFTER GETTING DATABASE MARKERS GET OWN MARKER
                this.getOwnPosition(10000); 

                //now we can fill models with markers since the data is available
                this.fillModelsWithMarkers();
            },

            //foreach each local data object of the footsteps table fill a backbone model so we
            //can set markers with the model it's attributes
            fillModelsWithMarkers: function() {
                var self = this;

                if(self.collection.length === 0 || self.collection.length === 1) {
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


            initAddMarker: function(model) {
                //apend to this for later on
                this.model = model;

                App.Vent.on('getImageForMarker:done', this.placeMarkerOnMap, this);

                if(this.model.get('footstep_id') == 0 ) {
                    window.footstep_image = './img/eigenlocatie.png';

                    App.Vent.trigger('getImageForMarker:done');
                } else {
                    App.dbClass.getAmountOfScannedEachFootstep(this.setImageForMarker, this.model.get('footstep_id'));
                    
                }
                         
            },

            setImageForMarker: function(tx, results) {
                if(results.rows.item(0).scanned_content_count == 0) {
                    console.log();
                    window.footstep_image = './img/voetstap1klein.png';
                } else {
                    window.footstep_image = './img/voetstap2klein.png';
                }

                App.Vent.trigger('getImageForMarker:done');
            },

            placeMarkerOnMap: function() {
                
                var self = this;
                var latlng = new google.maps.LatLng(this.model.get('latitude'), this.model.get('longitude'));
                // Drop Voetstap1 marker with image from image variable
                var footstep_marker = new google.maps.Marker({
                    footstep_id: this.model.get('footstep_id'),
                    position: latlng, 
                    map: self.map, 
                    title: this.model.get('title'),
                    icon: window.footstep_image
                });


                google.maps.event.addListener(footstep_marker, 'click', function() {
                    console.log(footstep_marker.footstep_id);
                    if(footstep_marker.footstep_id != 0 ) { 
                        App.ViewInstances.FootstepContentsView = new FootstepContentsView({collection: new FootstepContentCollection, footstep_id: footstep_marker.footstep_id, location: 1, start_content_id: null });

                        App.Helpers.processView('FootstepContentsView', App.ViewInstances.FootstepContentsView);

                        self.stopWatchingForLocation();

                    } else if(footstep_marker.footstep_id == 0){
                        alert('Dit ben jij!');
                    }
                });

                window.markers.push(footstep_marker);

                console.log('ADDING MARKER WITH ID ' + self.model.get('footstep_id'));
            },



            addMarkerRadius: function(model) {
                 //check for own position, which obviously doesnt need a radius
                if(model.get('footstep_id') === 0) {
                    return;
                }

                var self = this,
                    circleRadius = 70,
                    latlng = new google.maps.LatLng(model.get('latitude'), model.get('longitude'));

                // Place a circle that will cause the push
                var circle = new google.maps.Circle({
                    footstep_id: model.get('footstep_id'),
                    map: self.map,
                    radius: circleRadius,
                    strokeColor: "#0000CC",
                    strokeOpacity: 0.8,
                    center: latlng,
                    strokeWeight: 2,
                    fillColor: "#0000DD",
                    fillOpacity: 0.35
                });


                // Get the bounds of the circle
                var bounds = circle.getBounds();

                window.circles.push(circle);
            },

            //OWN POSITION FUNCTIONS

            getOwnPosition: function(timeoutInSeconds) {
                //magic context swap trick
                window.collection = this.collection;
                var options = { timeout: timeoutInSeconds, enableHighAccuracy: true  };
                this.watchID = navigator.geolocation.watchPosition(this.onSuccesGetOwnPosition, this.onErrorGetPosition, options);
            },

            onSuccesGetOwnPosition: function(position) {
                //since window is available in this context use it
                this.collection = window.collection;

                var lat = position.coords.latitude,
                    lng = position.coords.longitude;

                $.each(window.markers, function(index, val){
                    //if the id is 0 (the id of own position marker)
                    if(val.footstep_id === 0) {
                        //delete it so it wont duplicate
                        val.setMap(null);
                    }
                });

                //check if current position is in range of footstep, defined here because of fucking context issues-.-
                if(window.circles != '[]') {
                    var latlng = new google.maps.LatLng(lat, lng);
                    $.each(window.circles, function(index, val){
                        //val is circle
                        var bounds = val.getBounds();
            
                         if (bounds.contains(latlng)){
                            //Redirect
                            alert('U bent in de radius van een voetstap!');
                        }
                    });
                }
               
                //create model with our own location..
                var modelMarker = new MarkerModel();

                modelMarker.set(
                {
                    footstep_id: 0, //0 = own position
                    title: 'Uw locatie',
                    image_id: 1,
                    latitude: lat,
                    longitude: lng,
                    updated_at: 0
                });

                this.collection.add(modelMarker);
            },

            onErrorGetPosition: function(error) {
               console.log('code: ' + error.code + 'message: ' + error.message);
            },

			
			scanClickHandler: function (event) {
                $("#scan").click(function() {
                   if(App.ViewInstances.ScannerView == null) {
                    App.ViewInstances.ScannerView = new ScannerView; 
                }
    
                App.Helpers.processView('ScannerView', App.ViewInstances.ScannerView); 
                });        
            },

            stopWatchingForLocation: function() {
                if(navigator.geolocation.clearWatch(this.watchID)) {
                    //is not triggered..
                    console.log('cleared watchid');
                }

                this.watchID = null;
            },

            onBackButton: function (event) {
                //exit app
            },

            logout: function() {
                //stop watching for position
                this.stopWatchingForLocation();

                App.dbClass.initLogoutUser();
            },

        });
        
        
        return MapView;
    });