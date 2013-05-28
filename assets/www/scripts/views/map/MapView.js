define(['underscore', 'Backbone', 'text!views/map/MapView.tpl', 'models/MarkerModel', 'views/scanner/ScannerView', 'views/footstepContent/FootstepContentsView', 'collections/FootstepContentCollection', 'views/photoAssignment/PhotoAssignmentView', 'libs/hammer/hammer'],
    function (_, Backbone, MapViewTemplate, MarkerModel, ScannerView, FootstepContentsView, FootstepContentCollection, PhotoAssignmentView, hammer) {
        var MapView = Backbone.View.extend({
            id: 'MapView',

            events:{

            },

            destructionPolicy: 'never',

            initialize: function() {
                //navigator.notification.activityStart("Map laden", "De map en voetstappen worden geladen");

                //set markers to the window because of context issues
                window.markers = [];
                window.circles = [];
                window.been_in_circle = [];

                //TEMPORARILY FOR TESTING. THIS SHOULD ONLY BE FILLED IF USER IS IN RANGE OF FOOTSTEP
                window.in_radius = 4;

                //create geolocator watch id
                this.watchID = 0;

                //call jquery events
                this.jqueryEvents(false);

                //legenda functionalities
                this.handleLegenda();

                //score menu
                this.handleScoreMenu();

                 App.Vent.on('retrievingFootsteps:done', this.afterSettingFootsteps, this);
                
                //listen for if a model is added to the markercollection do this..
                this.collection.bind('add', this.initAddMarker, this);  
                this.collection.bind('add', this.addMarkerRadius, this);

                //if view is active start adding map
                this.on('viewActivate', this.viewIsActive, this);
                this.on('viewDeactivate', this.viewDeactivated, this);
            },

            viewDeactivated: function() {
                document.removeEventListener("backbutton", this.onBackButton, false);

                window.footstep_content = null;

                window.markers = [];
                window.circles = [];
                window.been_in_circle = [];

                this.stopWatchingForLocation();

                this.collection.reset();

                //stop potentially running notifications
                //navigator.notification.activityStop(); 

            },


            viewIsActive: function() {
                document.addEventListener("backbutton", this.onBackButton, false);

                /*******BECAUSE VIEW ONLY GETS INITIALIZED ONCE ADD CODE HERE ******/
                //decide if map is loaded from a early instantion
                if(this.map != null) {
                    //fix for gray area 
                    google.maps.event.trigger(this.map, 'resize');

                    console.log('Existing map, get new footsteps');

                    window.markers = [];
                    window.circles = [];
                    window.been_in_circle = [];

                    this.collection.reset();

                    this.watchID = 0;

                    //AFTER GETTING DATABASE MARKERS GET OWN MARKER
                    this.getOwnPosition(10000); 

                    //call jquery events
                    this.jqueryEvents(true);

                    //legenda functionalities
                    this.initGetDatabaseFootsteps();
                } else {
                    console.log('New Fresh map');

                    this.appendMap();
                }
            },

            jqueryEvents: function(renderedBefore) {
                var self = this;

                //check if rendered before.. thus only show buttons and do NOT bind events again
                if(renderedBefore === true) {
                    $('.button-container').show();
                    $('.showMenu').show();
                    $('.logout').show(); 

                    return;
                }


                $('.button-container').show();
                $('.showMenu').show();
                $('.logout').show();

                $('.logout').on('click', function(){
                    self.logout();
                });

                $('#assignment').on('click', function(e) {
                    e.preventDefault();

                    if(App.StackNavigator.activeView.id === 'PhotoAssignmentView') {
                        return;
                    }
                   
                    if(App.ViewInstances.PhotoAssignmentView == null ) {
                        App.ViewInstances.PhotoAssignmentView = new PhotoAssignmentView; 
                        App.Helpers.processView(App.ViewInstances.PhotoAssignmentView);       
                    } else {
                        App.StackNavigator.replaceView(App.ViewInstances.PhotoAssignmentView);
                    }
                });


                $("#scan").on('click', function() {
                    //TODO ADD LOADER TO PREVENT MULTIUPLE CLICKS!!

                    if(App.ViewInstances.ScannerView == null ) {
                        App.ViewInstances.ScannerView = new ScannerView; 
                        App.Helpers.processView(App.ViewInstances.ScannerView);       
                    } else {
                        App.StackNavigator.replaceView(App.ViewInstances.ScannerView);
                    }
                });
            },

            handleScoreMenu: function() {
                $(document).bind("mobileinit", function(){
                  //apply overrides here
                  $.mobile.defaultPageTransition = flip;
                });


                var menuStatus;
             
                $("a.showMenu").click(function(){
                    if(menuStatus != true){
                        $(".slide").animate({
                            marginLeft: "85%",
                        }, 100, function(){menuStatus = true});

                        return false;
                      } else {
                        $(".slide").animate({
                            marginLeft: "0px",
                        }, 100, function(){menuStatus = false});
                        
                        return false;
                    }
                });

                // $('#menu').on("swipeleft", function(){
                //     if (menuStatus){
                //     $(".slide").animate({
                //         marginLeft: "0px",
                //       }, 100, function(){menuStatus = false});
                //       }
                // });
             
                // $('#menu').on("swiperight", function(){
                //     if (!menuStatus){
                //     $(".slide").animate({
                //         marginLeft: "165px",
                //       }, 100, function(){menuStatus = true});
                //       }
                // });
             
                $("#menu li a").click(function(){
                    var p = $(this).parent();
                    if($(p).hasClass('active')){
                        $("#menu li").removeClass('active');
                    } else {
                        $("#menu li").removeClass('active');
                        $(p).addClass('active');
                    }
                });
            },

            handleLegenda: function() {
                $('.legenda, .hide').hammer({prevent_default:true}).on("tap", function(ev) {
                    $('.legenda').addClass("legenda-animation");
                    $('.hide').addClass('up');
                });

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

                        self.getOwnPosition(10000); 
                    });
                 
                }
            },

            initGetDatabaseFootsteps: function() {
                //set up map
                var self = this;

                //call function out of the db.js object
                App.dbClass.retrieveLocalFootsteps(self.setFootsteps);   
            },

            //this is the callback of the retrieveLocalFootsteps function
            setFootsteps: function(tx, results) {
                window.footsteps = [];

                for (var i = 0; i < results.rows.length; i++) {
                    window.footsteps.push(results.rows.item(i));
                }

                //trigger backbone custom event to deal with async problems
                console.log('IK TRIGGER JE');
                App.Vent.trigger('retrievingFootsteps:done');
            },

            //this function get's exectued after triggering backbone custom event for dealing
            //with async problem
            afterSettingFootsteps: function() {
                //instead of using the window context, put it in the view's context
                this.footsteps = window.footsteps;

                //now we can fill models with markers since the data is available
                this.fillModelsWithMarkers();
            },

            //foreach each local data object of the footsteps table fill a backbone model so we
            //can set markers with the model it's attributes
            fillModelsWithMarkers: function() {
                var self = this;
              
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
			},


            initAddMarker: function(model) {
                //apend to this for later on
                var self = this;

                var ifDone = function(tx, results) {
                    if(results.rows.item(0).scanned_content_count == 0) {
                        var footstep_image = './img/voetstap1klein.png';
                    } else {
                        var footstep_image = './img/voetstap2klein.png';
                    }

                     self.placeMarkerOnMap(model, footstep_image);
                };  

                if(model.get('footstep_id') == 0 ) {
                    var footstep_image = './img/eigenlocatie.png';

                    self.placeMarkerOnMap(model, footstep_image);

                    return;
                } else {
                    App.dbClass.getAmountOfScannedEachFootstep(ifDone, model.get('footstep_id'));
                    
                }       
            },

            placeMarkerOnMap: function(model, footstep_image) {
                // console.log(this.collection);
                var self = this;
                var latlng = new google.maps.LatLng(model.get('latitude'), model.get('longitude'));
                // Drop Voetstap1 marker with image from image variable
                var footstep_marker = new google.maps.Marker({
                    footstep_id: model.get('footstep_id'),
                    position: latlng, 
                    map: self.map, 
                    title: model.get('title'),
                    icon: footstep_image
                });


                google.maps.event.addListener(footstep_marker, 'click', function() {

                    if(footstep_marker.footstep_id != 0 ) { 
                        
                        if( App.ViewInstances.FootstepContentsViewFromMap == null ) {
                            App.ViewInstances.FootstepContentsViewFromMap = new FootstepContentsView({collection: new FootstepContentCollection, footstep_id: footstep_marker.footstep_id, location: 1, start_content_id: null });
                            App.Helpers.processView(App.ViewInstances.FootstepContentsViewFromMap);       
                        } else {
                            App.StackNavigator.replaceView(App.ViewInstances.FootstepContentsViewFromMap);
                        }

                    } else if(footstep_marker.footstep_id == 0){
                        alert('Dit ben jij!');
                    }
                });

                window.markers.push(footstep_marker);

                console.log('ADDING MARKER WITH ID ' + model.get('footstep_id'));

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
                console.log('HOW MANY TIMES AM I EXECUTED?');
                //magic context swap trick
                var options = { timeout: timeoutInSeconds, enableHighAccuracy: true  };
                this.watchID = navigator.geolocation.watchPosition(this.onSuccesGetOwnPosition, this.onErrorGetPosition, options);
            },

            onSuccesGetOwnPosition: function(position) {
                //since window is available in this context use it
                var lat = position.coords.latitude,
                    lng = position.coords.longitude;

                $.each(window.markers, function(index, val){
                    //if the id is 0 (the id of own position marker)
                    if(val.footstep_id === 0) {
                        //delete it so it wont duplicate
                        val.setMap(null);
                        delete val;
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
                            if(!$.inArray(val.footstep_id, window.been_in_circle)) {
                                alert('U bent in de radius van een voetstap!');
                                window.in_radius = val.footstep_id;
                            }
                            window.been_in_circle.push(val.footstep_id);
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

                App.ViewInstances.MapView.collection.add(modelMarker);
            },

            onErrorGetPosition: function(error) {
               console.log('code: ' + error.code + 'message: ' + error.message);
            },

            stopWatchingForLocation: function() {
                navigator.geolocation.clearWatch(this.watchID);

                this.watchID == null;
    
            },

            onBackButton: function() {
                navigator.notification.activityStop();

                navigator.notification.confirm(
                    'Afsluiten',
                    function(button) {
                        console.log('LOGGING OUT');
                        if(button == 0) {
                             navigator.app.exitApp();
                        }
                    },
                    'Afsluiten?',
                    'Ja, Nee!'
                );

                
                //exit app
            },

            logout: function() {
                //navigator.notification.activityStop(); 
                //stop watching for position

                App.dbClass.initLogoutUser();
            },

        });
        
        
        return MapView;
    });