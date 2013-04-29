define(['views/login/LoginView', 'views/map/MapView', 'collections/MarkerCollection'],
	function(LoginView, MapView, MarkerCollection) {
		// THIS OBJECT CONTAINS ALL STORAGES WHICH ARE DONE IN THE LOCAL SQLITE DATABASE
		var db = {

			/***
			* GENERAL DB FUNCTIONS
			***/

			initialize: function() {
				// make use of the global databaseinstation
				App.dbInstantion.transaction(this.populateDB, db.errorCB, function(result){ console.log('done') });
				
			},

			populateDB : function(tx) {
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS users(user_id INTEGER NOT NULL PRIMARY KEY unique, username, password, active, last_updated )'
			    );
			},

			errorCB : function(err) {
		        console.log(err);
		    },

		    /***
			* USER DB FUNCTIONS
			***/
	   
			//creating user
			initLocalUserCreating: function() {
				// make use of the global databaseinstation
				App.dbInstantion.transaction(this.createUserLocal, this.errorCB, this.creatUserQuerySuccess);
			},

		    createUserLocal: function(tx) {
		    	var user_id = App.userModel.get('user_id');
		    	var username = App.userModel.get('username'); 
		    	var password = App.userModel.get('password');

		    	tx.executeSql('INSERT INTO users(user_id, username, password, active) VALUES(?, ?, ?, ?)', [user_id, username, password, 1]);
		    },

		    creatUserQuerySuccess: function(tx, result) {
		    	console.log(result);
		    },

		    initUserChecking: function() {
		    	App.dbInstantion.transaction(this.checkForActiveUser, this.errorCB);
		    },

		    //check for active user
		    checkForActiveUser: function(tx) {
		     	tx.executeSql('SELECT * FROM users WHERE active = 1', [], db.userCheckingQuerySuccess, db.errorCB);
		    },

		    userCheckingQuerySuccess: function(tx, results) {
			    // if there was a result, continue to Mapview

			    //temporarily clean users table to demonstrate login
			   	// App.dbInstantion.transaction(db.populateDB, db.errorCB, db.successCB);
			    if(results.rows.length != 0) {
	                App.userModel.set({user_id: results.rows.item(0).user_id, username: results.rows.item(0).username, password: results.rows.item(0).password});
	                App.StackNavigator.pushView(new MapView({ collection: new MarkerCollection }));
	            //else, the app 
			    } else {
			    	//set timeout because splashscreen will be too short otherwise
			    	setTimeout(function(){
			    		App.StackNavigator.pushView(new LoginView);
			    	}, 1000);
			    }
		    },

		    //logout current user
		    initLogoutUser: function() {
		    	App.dbInstantion.transaction(this.logoutUser, this.errorCB, this.logoutUserQuerySuccess);	
		    },

		    logoutUser: function(tx) {
		    	var user_id = App.userModel.get('user_id');

		    	//set user on active = 0
		    	tx.executeSql('UPDATE users SET active = 0 WHERE user_id = ?', [user_id]);
		    },

		    logoutUserQuerySuccess: function() {
		    	//clear stack so no going back is possible
		    	App.userModel.set({active: 0});
		    	App.StackNavigator.pushView(new LoginView);

		    },

		    /***
			* SYNCHRONIZE DB FUNCTIONS
			***/

			initSynchronizing: function() {

			}

		};
		return db;
	});