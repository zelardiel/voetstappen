define(['underscore', 'Backbone', 'text!views/splashscreen/SplashScreenView.tpl', 'libs/encrypter/sha1_encrypter'],
    function (_, Backbone, SplashScreenTemplate, db, Sha1) {
    	var SplashScreenView = Backbone.View.extend({
    		//check if there is user data available
    		initialize: function() {
                //check if there already exists a user in the local database with active = 1
    			//App.dbClass.initUserChecking();
                //moved to success function of db initializing
    		},
    		
    		render: function() {
    			this.$el.html(_.template(SplashScreenTemplate));
    		},

    	});

    	return SplashScreenView;
    });
