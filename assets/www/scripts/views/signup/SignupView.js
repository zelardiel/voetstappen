define(['underscore', 'Backbone', 'text!views/signup/SignupView.tpl', 'libs/encrypter/sha1_encrypter'],
    function (_, Backbone, SignupTemplate, Sha1) {
    	var SignupView = Backbone.View.extend({
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
              navigator.notification.activityStart("Inloggen", "Je wordt ingelogd");
            }
  				});
    		},

    		previousView: function() {
          //pop the view from the stack array so the previous one appears
    			App.StackNavigator.popView();
    		}
    	});

    	return SignupView;
    });