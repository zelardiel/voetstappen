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

                this.form = $(e.currentTarget);

                this.username = this.form.find('input#username');
                this.password = this.form.find('input#password');

                //validate locally
                if(this.validateUsernameAndPassword(this.username, this.password) == false) {
                    //check for existing error messages
                    if(this.form.find('.error').length == 0) {
                        $(e.currentTarget).append($('<p class=error>Vul een waarde in</p>')); 
                    } 
                    return false;
                } else {
                    this.form.find('p.error').remove();
                }

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
                            alert('Wrong username or password');
                            return;
                        } else if(result.status == Sha1.hash('success')) {
                            //fill the user model
                            self.setUserModel(result.user_id, result.username, result.password);
                            self.loginSuccess();
                        }
                    }
                });
            },

            validateUsernameAndPassword: function(username_el, password_el) {

                if(username_el.val().length == 0 || password_el.val().length == 0) {
                    return false;
                } else {
                    return true;
                }

                return false;
            },

            //set a global accesable user model so we can keep track of the user id etc.
            setUserModel: function(user_id, username, password) {
                App.userModel.set({user_id: user_id, username: username, password: password, active: 1});
                console.log(App.userModel.attributes);
            },

            loginSuccess: function() {
                //create a local user in the local database
                console.log(App.userModel.attributes);
                App.dbClass.initLocalUserCreating();

                App.dbClass.initSynchronizing();
               

                syncing.done(function(){
                     console.log('much later');
                     App.StackNavigator.pushView(new MapView({collection: new MarkerCollection}));
                });
               
            },

            goToSignup: function() {
                App.StackNavigator.pushView(new SignupView);
            }


        });

        return LoginView;
    });