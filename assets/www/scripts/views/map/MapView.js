define(['underscore', 'Backbone', 'text!views/map/MapView.tpl', 'models/MarkerModel', 'views/scanner/ScannerView', 'views/footstepContent/FootstepContentsView', 'collections/FootstepContentCollection', 'views/photoAssignment/PhotoAssignmentView', 'libs/hammer/hammer'],
    function (_, Backbone, MapViewTemplate, MarkerModel, ScannerView, FootstepContentsView, FootstepContentCollection, PhotoAssignmentView, hammer) {
        var MapView = Backbone.View.extend({
            id: 'MapView',

            events:{

            },


            // app start
            // proces a locatie verkrijgen start
            // marker wordt geplaatst

            //content wordt geopend dus weg van map

            // terug naar map
            // proces b wordt gestart
            // marker van proces a blijft nog staan

            destructionPolicy: 'never',

            initialize: function() {
                navigator.notification.activityStart("Map laden", "De map en voetstappen worden geladen");

                //set markers to the window because of context issues
                window.markers = [];
                window.circles = [];
                window.been_in_circle = [];
                window.clicked = 0;


                //TEMPORARILY FOR TESTING. THIS SHOULD ONLY BE FILLED IF USER IS IN RANGE OF FOOTSTEP
                // window.in_radius = 4;

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

                console.log('START VOOR VERWIJDER');
                console.log(window.markers.length);
                    $.each(window.markers, function(index, val){
                        if(val.footstep_id == 0) {
                            console.log('HALLO VERWIJDERD!~!!!!+++++');
                            val.setMap(null);
                        }
                    });
                console.log(window.markers.length);
                console.log('BA VERWUHDER');


                window.markers = [];
                window.circles = [];
                window.been_in_circle = [];

                this.stopWatchingForLocation();

                this.collection.reset();

                //stop potentially running notifications
                 navigator.notification.activityStop();

            },


            viewIsActive: function() {

                document.addEventListener("backbutton", this.onBackButton, false);
                $('#map').addClass('active-button');
                $('#map').siblings().removeClass('active-button');
                window.centered_position = false;

                /*******BECAUSE VIEW ONLY GETS INITIALIZED ONCE ADD CODE HERE ******/
                //decide if map is loaded from a early instantion
                if(this.map != null) {
                    //fix for gray area
                    google.maps.event.trigger(this.map, 'resize');
                    window.clicked = 0;
                    console.log(window.clicked + 'WINDOW CLICKED');

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
                    $('.hide').show();

                    return;
                }


                $('#map').on('click', function(){

                    if(App.StackNavigator.activeView.id === 'MapView') {
                        return;
                    } else{
                        window.clicked++;
                    }

                    if(window.clicked == 1) {
                        console.log('WINDOW PLUS PLUS');

                        App.Helpers.renderMapView();

                        $(this).addClass('active-button');
                        //CHECK THIS LATER
                        $(this).siblings().removeClass('active-button');

                    }


                });

                $('#deel').on('click', function() {
                    //alert('Hier zou je kunnen delen');
                    navigator.notification.alert(
                        'Hier zou je je score kunnen delen',  // message
                        function(){},         // callback
                        'Delen',            // title
                        'Ok'                  // buttonName
                    );
                });


                $('.button-container').show();
                $('.showMenu').show();
                $('.logout').show();
                $('.hide').show();

                $('.logout').on('click', function(){
                    console.log('WINDOW PLUS PLUS');
                    window.clicked++;

                    if(window.clicked == 1) {
                        self.logout();
                        $(".legenda").removeClass("legenda-animation");
                        $('.hide').removeClass("up");
                        window.clicked = 0;
                    }
                });

                $('#assignment').on('click', function(e) {
                    e.preventDefault();
                    window.clicked++;

                    if(App.StackNavigator.activeView.id === 'PhotoAssignmentView') {
                        return;
                    } else if(window.clicked == 1) {
                        if(App.ViewInstances.PhotoAssignmentView == null ) {
                            App.ViewInstances.PhotoAssignmentView = new PhotoAssignmentView;
                            App.Helpers.processView(App.ViewInstances.PhotoAssignmentView);
                        } else {
                            App.StackNavigator.replaceView(App.ViewInstances.PhotoAssignmentView);
                        }

                        $(this).addClass('active-button');
                        $(this).siblings().removeClass('active-button');
                    }
                });

                $("#scan").on('click', function() {
                    //TODO ADD LOADER TO PREVENT MULTIUPLE CLICKS!!
                    window.clicked++;

                    console.log('WINDOW PLUS PLUS');

                    if(window.clicked == 1) {
                        if(App.ViewInstances.ScannerView == null ) {
                            App.ViewInstances.ScannerView = new ScannerView;
                            App.Helpers.processView(App.ViewInstances.ScannerView);
                        } else {
                            App.StackNavigator.replaceView(App.ViewInstances.ScannerView);
                        }

                        $(this).addClass('active-button');
                        $(this).siblings().removeClass('active-button');
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
                    if($('.up').length == 0) {
                       $('.legenda').addClass("legenda-animation");
                       $('.hide').addClass('up');
                    } else {
                        $(".legenda").removeClass("legenda-animation");
                        $('.hide').removeClass("up");
                    }
                });

                $('.legenda, .hide').hammer({prevent_default:true}).bind("dragup", function(ev) {
                    ev.gesture.stopDetect();
                    $('.legenda').addClass("legenda-animation");
                    $('.hide').addClass('up');
                });

                // once the columns are down, the drag event is triggered on the mask
                $(".legenda, .hide").hammer({prevent_default:true}).bind("dragdown", function(ev) {
                    ev.gesture.stopDetect();
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


                    var styles = [
                      {
                        "featureType": "road",
                        "stylers": [
                          { "color": "#e4d7c5" }
                        ]
                      },{
                        "featureType": "landscape.man_made",
                        "stylers": [
                          { "color": "#efefef" }
                        ]
                      },{
                        "featureType": "water",
                        "stylers": [
                          { "color": "#2c718a" },
                          { "lightness": 41 },
                          { "saturation": -69 }
                        ]
                      },{
                      },{
                        "featureType": "poi",
                        "stylers": [
                          { "color": "#472b0c" },
                          { "lightness": 69 },
                          { "saturation": -66 },
                          { "gamma": 1.33 }
                        ]
                      },{
                      }
                    ];

                    // Create a new StyledMapType object, passing it the array of styles,
                    // as well as the name to be displayed on the map type control.
                    var styledMap = new google.maps.StyledMapType(styles, {name: "Styled Map"});

                    //Associate the styled map with the MapTypeId and set it to display.
                    self.map.mapTypes.set('map_style', styledMap);
                    self.map.setMapTypeId('map_style');

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
                    optimized: false, 
                    map: self.map,
                    title: model.get('title'),
                    icon: footstep_image
                });


                google.maps.event.addListener(footstep_marker, 'click', function() {
                    $('#map').removeClass('active-button');
                    if(footstep_marker.footstep_id != 0 ) {

                        if( App.ViewInstances.FootstepContentsViewFromMap == null ) {
                            App.ViewInstances.FootstepContentsViewFromMap = new FootstepContentsView({collection: new FootstepContentCollection, footstep_id: footstep_marker.footstep_id, location: 1, start_content_id: null });
                            App.Helpers.processView(App.ViewInstances.FootstepContentsViewFromMap);
                        } else {
                            App.StackNavigator.replaceView(App.ViewInstances.FootstepContentsViewFromMap);
                        }

                    } else if(footstep_marker.footstep_id == 0){
                        //alert('Dit ben jij!');
                        navigator.notification.alert(
                            'Dit ben jij',  // message
                            function(){},         // callback
                            'GPS icoon',            // title
                            'Ok'                  // buttonName
                        );
                    }
                });

                window.markers.push(footstep_marker);

                navigator.notification.activityStop();

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
                console.log('TRYING TO GET POSITION');
                //magic context swap trick
                var options = { maximumAge: 3000, timeout: timeoutInSeconds, enableHighAccuracy: true  };
                this.watchID = navigator.geolocation.watchPosition(this.onSuccesGetOwnPosition, this.onErrorGetPosition, options);
            },

            onSuccesGetOwnPosition: function(position) {
                //since window is available in this context use it
                var lat = position.coords.latitude,
                    lng = position.coords.longitude;

                
                if(window.centered_position == false) {
                    navigator.notification.activityStop();
                    App.ViewInstances.MapView.map.setCenter(new google.maps.LatLng(lat, lng));
                    window.centered_position = true;
                }

                $.grep(window.markers, function(val, index){
                    //if the id is 0 (the id of own position marker)
                    console.log(val.footstep_id);
                    if(val.footstep_id == '0' || val.footstep_id == 0) {
                        //delete it so it wont duplicate
                        val.setMap(null);

                        delete val;
                        return false;
                    } else {
                        return true;
                    }
                });

                console.log(window.markers.length + " FROM SUCCESS");

                //check if current position is in range of footstep, defined here because of fucking context issues-.-
                if(window.circles != '[]') {
                    var latlng = new google.maps.LatLng(lat, lng);
                    $.each(window.circles, function(index, val){
                        //val is circle
                        var bounds = val.getBounds();

                         if (bounds.contains(latlng)){
                            console.log('in bounds');
                            //Redirect
                            console.log('INN ARRAY??? ' + $.inArray(val.footstep_id, window.been_in_circle));
                            if($.inArray(val.footstep_id, window.been_in_circle) == -1) {
                                console.log('not in array of shit');
                                App.dbClass.linkUserToFootstep(val.footstep_id);

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

               navigator.notification.confirm(
                    'Je locatie is niet gevonden. Zet je GPS aan of probeer opnieuw.',
                    function(button) {
                        switch(button) {
                            case 1:
                                App.ViewInstances.MapView.stopWatchingForLocation();
                                break;
                            case 2:
                                App.ViewInstances.MapView.stopWatchingForLocation();
                                App.ViewInstances.MapView.getOwnPosition(10000);
                                break;
                            case 3:
                                navigator.app.exitApp();
                                break;

                            default:
                                App.ViewInstances.MapView.stopWatchingForLocation();
                        }
                    },
                    'Locatie niet Gevonden!',
                    'Annuleren, Probeer Opnieuw, App Afsluiten'
                );
            },

            stopWatchingForLocation: function() {
                navigator.geolocation.clearWatch(this.watchID);

                this.watchID == null;

            },

            onBackButton: function() {
                window.clicked++;

                if(window.clicked == 1) {
                navigator.notification.confirm(
                  'Voetstappen uit de Gouden Eeuw verlaten?',
                   function(button) {
                     console.log(button);
                     if(button === 2) {
                       App.dbClass.initLogoutUser();
                       navigator.app.exitApp();
                     }
                   },
                'Afsluiten?',
                'Nee!, Ja'
                );
                    window.clicked = 0;
                }
            },

            logout: function() {
                navigator.notification.activityStop();
                //stop watching for position
                window.clicked++;

                if(window.clicked == 1) {
                    App.dbClass.initLogoutUser();
                    window.clicked = 0;
                }
            },

        });


        return MapView;
    });