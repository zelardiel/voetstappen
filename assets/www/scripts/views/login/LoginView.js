define(['underscore', 'Backbone', 'text!views/login/LoginView.tpl', 'views/signup/SignupView', 'libs/encrypter/sha1_encrypter'],
    function (_, Backbone, LoginViewTemplate, SignupView, Sha1) {
    	var LoginView = Backbone.View.extend({

    		events: {
    			'submit' : 'loginUser',
                'click #to-signup' : 'goToSignup'
    		},

    		render: function() {
    			this.$el.html(_.template(LoginViewTemplate));
                return this;
    		},

            loginUser: function(e) {
                e.preventDefault();

                this.username = $(e.currentTarget).find('input#username');
                this.password = $(e.currentTarget).find('input#password');
                this.hashed_password = Sha1.hash(this.password.val());

                var self = this;

                $.ajax({
                    type: 'POST',
                    url: '/api.php',
                    data: {action: 'login', username: self.username.val(), password: self.hashed_password },
                    success: function(result) {
                        console.log('sdsadsadasdadsasddsa');
                        if(result == Sha1.hash('notfound')) {
                            alert('Wrong usenrame or password');
                        } else if(result == Sha1.hash('success')) {
                            alert('logged in');
                            self.username.val('');
                            self.password.val('');
                        }
                    }
                });
            },

            goToSignup: function() {
                 App.StackNavigator.pushView(new SignupView);
            }


        });

        return LoginView;
    });