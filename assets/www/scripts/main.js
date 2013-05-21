require.config({
    paths:{
        // RequireJS plugin
        text:'libs/require/text',
        // RequireJS plugin
        domReady:'libs/require/domReady',
        // underscore library
        underscore:'libs/underscore/underscore',
        // Backbone.js library
        Backbone:'libs/backbone/backbone',
        // jQuery
        jquery:'libs/jquery/jquery-1.9.1',
        //backtack view pusher
        backstack:'libs/backstack/backstack-min'
    },

    shim:{
        Backbone : {
            deps:['underscore', 'jquery'],
            exports:'Backbone'
        },
        underscore : {
            exports:'_'
        },
        backstack : {
            deps:['Backbone', 'underscore', 'jquery']
        },
    }
});

require(['domReady', 'models/UserModel', 'backstack', 'db', 'helpers'],
    function (domReady, UserModel, Backstack, db, Helpers) {
        // domReady is RequireJS plugin that triggers when DOM is ready
        domReady(function () {
            //ondevice ready is cordave(phonegap) function
            function onDeviceReady(desktop) {
                // Hiding splash screen when app is loaded
                if (desktop !== true) {
                    cordova.exec(null, null, 'SplashScreen', 'hide', []);
                }

                //appending certain namespaces to the window
                window.App = {
                    dbInstantion: window.openDatabase("voetstappen", "1.0", "voetstappen", 2000000),
                    dbClass: db,
                    Vent: _.extend({}, Backbone.Events),
                    StackNavigator: new Backstack.StackNavigator({el: '#container'}),
                    stackViewIds: {},
                    ViewInstances: {},
                    userModel: new UserModel,
                    Helpers: Helpers
                };

                //set default transition
                this.fade = new Backstack.FadeEffect();

                App.StackNavigator.defaultPushTransition = this.fade;

                //init database, which will be repsonsible for rendering the first view, the map view
                App.dbClass.initialize();

            }

            if (navigator.userAgent.match(/(iPad|iPhone|Android)/)) {
                // This is running on a device so waiting for deviceready event
                document.addEventListener('deviceready', onDeviceReady, false);
            } else {
                // On desktop don't have to wait for anything
                onDeviceReady(true);
            }
        });
    });