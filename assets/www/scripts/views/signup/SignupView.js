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
  							alert('exists');
  						} else if(result == Sha1.hash('success')) {
  							alert('saved');
  							self.username.val('');
  							self.password.val('');
  						}
  					}
  				});
    		},

    		previousView: function() {
    			App.StackNavigator.popView();
    		}
    	});

    	return SignupView;
    });