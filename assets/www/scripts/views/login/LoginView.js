define(['underscore', 'Backbone', 'db', 'text!views/login/LoginView.tpl', 'views/signup/SignupView', 'views/map/MapView','collections/MarkerCollection', 'libs/encrypter/sha1_encrypter'],
    function (_, Backbone, db, LoginViewTemplate, SignupView, MapView, MarkerCollection, Sha1) {
    	var LoginView = Backbone.View.extend({
            id: 'LoginView',

            destructionPolicy:'never',

    		events: {
    			'submit form#login' : 'loginUser',
                'click #to-signup' : 'goToSignup'
    		},

            initialize: function() {
                console.log('INIT LOGIN');
                window.clicked = 0;

                if(this.options.isDemo == null) {
                    this.isDemo = true;
                    this.loginUser();
                } else if(this.isDemo == false){
                    $('.button-container').toggle();
                    $('.showMenu').toggle();
                    $('.logout').toggle();
                    $('.hide').toggle();
                }            
                
            },

    		render: function() {
                if(typeof(this.options.render_login_view) != 'undefined') {
                    console.log('RENDER LOGINVIEW');
                    this.$el.html(_.template(LoginViewTemplate));
                    return this;
                } else {
                    return;
                }
                
    		},

            loginUser: function(e) {
                console.log('PRESSING LOGIN');
                //stop in case there is a dialog active
                // navigator.notification.activityStop();         

                if(this.isDemo == false) {
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

                    this.username_val = this.username.val().toLowerCase()
                    this.hashed_password = Sha1.hash(this.password.val());
                } else {
                    this.username_val = 'Spoorzoeker'
                    this.hashed_password = Sha1.hash('baas');
                }

                var self = this;

                // navigator.notification.activityStart("Inloggen", "Je wordt ingelogd");

                $.ajax({
                    type: 'POST',
                    timeout: 15000,
                    url: 'http://www.pimmeijer.com/voetstappen/api.php',
                    data: {action: 'login', username: self.username_val, password: self.hashed_password },
                    success: function(result) {
                        var result = $.parseJSON(result);
                        if(result.status == Sha1.hash('notfound')) {
                            console.log('LOL');
                            //stop the loading notifiacton
                            // navigator.notification.activityStop();

                            // navigator.notification.alert(
                            //     'Verkeerder gebruikersnaam of wachtwoord',  // message
                            //      function(){},         // callback
                            //     'Inloggen mislukt!',            // title
                            //     'Probeer opnieuw'                  // buttonName
                            // );

                            return;
                        } else if(result.status == Sha1.hash('success')) {
                            //fill the user model
                            self.setUserModel(result.user_id, result.username, result.password);
                            self.loginSuccess();
                        }
                    }, error: function(xhr, textStatus, errorThrown) {
                        console.log(xhr);
                        console.log(textStatus);
                        console.log(errorThrown);

                        // navigator.notification.activityStop();

                        // navigator.notification.alert(
                        //     'We kunnen je niet inloggen. Check je verbinding en probeer opnieuw.',  // message
                        //      function(){},         // callback
                        //     'Inloggen mislukt!',            // title
                        //     'Probeer opnieuw'                  // buttonName
                        // );

                        // navigator.notification.activityStop();  
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

            //set a global accesable user model so we can keep track of the user id etc.
            setUserModel: function(user_id, username, password) {
                App.userModel.set({user_id: user_id, username: username, password: password, active: 1});
            },

            loginSuccess: function() {
                // navigator.notification.activityStop();
                //create a local user in the local database
                if(this.isDemo == false) {
                    this.username.val('');
                    this.password.val('');
                }
                
                App.dbClass.initLocalUserCreating();

                //this also sends it through to the mapview
                App.dbClass.initUserChecking(); 

            },

            goToSignup: function() {
                window.clicked++;

                if(window.clicked == 1) {
                    if(App.ViewInstances.SignupView == null) {
                        App.ViewInstances.SignupView = new SignupView; 
                        App.Helpers.processView(App.ViewInstances.SignupView);       
                    } else {
                        App.StackNavigator.replaceView(App.ViewInstances.SignupView);
                    }
                    window.clicked = 0;
                }
               
    }


        });

        return LoginView;
    });