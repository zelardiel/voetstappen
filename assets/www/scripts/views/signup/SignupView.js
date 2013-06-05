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
          // navigator.notification.activityStop();     
        
          this.form = $(e.currentTarget);
    			this.username = $(e.currentTarget).find('input#username');
    			this.password = $(e.currentTarget).find('input#password');

           if(this.validateUsernameAndPassword(this.username, this.password) == false) {
                  //check for existing error messages
                  if(this.form.find('.error').length == 0) {
                      $(e.currentTarget).append($('<p class=error>Vul een waarde in</p>')); 
                  } 
                  return false;
            } else {
                this.form.find('p.error').remove();
            }

          // navigator.notification.activityStart("Aanmaken", "Uw account wordt aangemaakt");

    			this.hashed_password = Sha1.hash(this.password.val());

    			var self = this;

  				$.ajax({
  					type: 'POST',
  					url: 'http://www.pimmeijer.com/voetstappen/api.php',
  					data: {action: 'signup', username: self.username.val(), password: self.hashed_password },
  					success: function(result) {
  						if(result == Sha1.hash('exists')) {
  							// navigator.notification.activityStop(); 
         //        navigator.notification.alert(
         //            'Gebruikersnaam bestaat al',  // message
         //             self.previousView,         // callback
         //            'De gekozen gebruikersnaam bestaat al',            // title
         //            'Probeer opnieuw'                  // buttonName
         //        );
  						} else if(result == Sha1.hash('success')) {
  							// navigator.notification.activityStop(); 

         //        navigator.notification.alert(
         //            'Registratie succesvol',  // message
         //             self.previousView,         // callback
         //            'Uw account is geregistreerd.',            // title
         //            'Naar het inloggen'                  // buttonName
         //        );
  							self.username.val('');
  							self.password.val('');
  						}
  					},
            error: function(xhr, message, errorThrown) {
              console.log(xhr);
              console.log(message);
              console.log(errorThrown);
              // navigator.notification.activityStop(); 
              // navigator.notification.activityStart("Fout", "Er ging iets mis! probeer opnieuw");
            }
  				});
    		},

           validateUsernameAndPassword: function(username_el, password_el) {

                if(username_el.val().length === 0 || password_el.val().length === 0) {
                    console.log('break');
                    return false;
                } else {
                    return true;
                }

                return false;
            },

    		previousView: function() {
          // navigator.notification.activityStop(); 
          //pop the view from the stack array so the previous one appears
            if(App.ViewInstances.LoginView == null ) {
                  App.ViewInstances.LoginView = new LoginView; 
                  App.Helpers.processView(App.ViewInstances.LoginView);       
              } else {
                  App.StackNavigator.replaceView(App.ViewInstances.LoginView);
              }
    	 }

      });

    	return SignupView;
    });