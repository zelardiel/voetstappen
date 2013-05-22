define(['underscore', 'Backbone', 'text!views/signup/SignupView.tpl', 'views/login/LoginView', 'libs/encrypter/sha1_encrypter'],
    function (_, Backbone, SignupTemplate, LoginView, Sha1) {
    	var SignupView = Backbone.View.extend({
        id: 'SignupView',
        destructionPolicy: 'never',
    		events: {
    			'click #previous-view' : 'previousView',
    			'submit' : 'createUser'
    		},

    		render: function() {
    			this.$el.html(_.template(SignupTemplate));
    		},

    		createUser: function(e) {
          e.preventDefault();
          navigator.notification.activityStop();     
          navigator.notification.activityStart("Aanmaken", "Uw account wordt aangemaakt");
    			this.username = $(e.currentTarget).find('input#username');
    			this.password = $(e.currentTarget).find('input#password');
    			this.hashed_password = Sha1.hash(this.password.val());

    			var self = this;

  				$.ajax({
  					type: 'POST',
  					url: 'http://www.pimmeijer.com/voetstappen/api.php',
  					data: {action: 'signup', username: self.username.val(), password: self.hashed_password },
  					success: function(result) {
  						if(result == Sha1.hash('exists')) {
  							navigator.notification.activityStop(); 
                navigator.notification.alert(
                    'Gebruikersnaam bestaat al',  // message
                     self.previousView,         // callback
                    'De gekozen gebruikersnaam bestaat al',            // title
                    'Probeer opnieuw'                  // buttonName
                );
  						} else if(result == Sha1.hash('success')) {
  							navigator.notification.activityStop(); 

                navigator.notification.alert(
                    'Registratie succesvol',  // message
                     self.previousView,         // callback
                    'Uw account is geregistreerd.',            // title
                    'Naar het inloggen'                  // buttonName
                );
  							self.username.val('');
  							self.password.val('');
  						}
  					},
            error: function(xhr, message, errorThrown) {
              console.log(xhr);
              console.log(message);
              console.log(errorThrown);
              navigator.notification.activityStop(); 
              navigator.notification.activityStart("Fout", "Er ging iets mis! probeer opnieuw");
            }
  				});
    		},

    		previousView: function() {
          navigator.notification.activityStop(); 
          //pop the view from the stack array so the previous one appears
    			    if(App.ViewInstances.LoginView == null) {
                    App.ViewInstances.LoginView = new LoginView; 
                }

                App.Helpers.processView('LoginView', App.ViewInstances.LoginView); 
            }
    	});

    	return SignupView;
    });