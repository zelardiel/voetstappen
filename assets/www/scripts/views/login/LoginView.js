define(['underscore', 'Backbone', 'db', 'text!views/login/LoginView.tpl', 'views/signup/SignupView', 'views/map/MapView','collections/MarkerCollection', 'libs/encrypter/sha1_encrypter'],
    function (_, Backbone, db, LoginViewTemplate, SignupView, MapView, MarkerCollection, Sha1) {
    	var LoginView = Backbone.View.extend({

    		events: {
    			'submit' : 'loginUser',
                'click #to-signup' : 'goToSignup'
    		},

            initialize: function() {

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
                    url: 'http://www.pimmeijer.com/voetstappen/api.php',
                    data: {action: 'login', username: self.username.val(), password: self.hashed_password },
                    success: function(result) {
                        var result = $.parseJSON(result);

                        console.log(result);
                        if(result.status == Sha1.hash('notfound')) {
                            alert('Wrong usenrame or password');
                        } else if(result.status == Sha1.hash('success')) {
                            //alert('logged in');
                            self.username.val('');
                            self.password.val('');

                            //fill the user model
                            self.setUserModel(result.user_id, result.username, result.password);
                            self.loginSuccess();
                        }
                    }
                });
            },

            //set a global accesable user model so we can keep track of the user id etc.
            setUserModel: function(user_id, username, password) {
                App.userModel.set({user_id: user_id, username: username, password: password, active: 1});
                console.log(App.userModel.attributes);
            },

            loginSuccess: function() {
                //db function
                App.dbClass.initLocalUserCreating();
                App.StackNavigator.pushView(new MapView({collection: new MarkerCollection}));
            },

            goToSignup: function() {
                App.StackNavigator.pushView(new SignupView);
            }


        });

        return LoginView;
    });