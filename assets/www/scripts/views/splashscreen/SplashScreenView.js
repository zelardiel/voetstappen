define(['underscore', 'Backbone', 'text!views/splashscreen/SplashScreenView.tpl', 'libs/encrypter/sha1_encrypter'],
    function (_, Backbone, SplashScreenTemplate, db, Sha1) {
    	var SplashScreenView = Backbone.View.extend({
    		//check if there is user data available
    		initialize: function() {
    			App.dbClass.initUserChecking();
    		},
    		
    		render: function() {
    			this.$el.html(_.template(SplashScreenTemplate));
    		},

    	});

    	return SplashScreenView;
    });
