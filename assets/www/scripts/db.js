define(['views/login/LoginView', 'views/map/MapView', 'collections/MarkerCollection'],
	function(LoginView, MapView, MarkerCollection) {
		/**************
		** THIS OBJECT CONTAINS ALL STORAGES WHICH ARE DONE IN THE LOCAL SQLITE DATABASE
		***************/
		var db = {

			/***
			* GENERAL DB FUNCTIONS
			***/

			initialize: function() {
				var self = this;
				// make use of the global databaseinstation

				App.dbInstantion.transaction(this.populateDB, db.errorCB, function(result){ self.initUserChecking(); });
				
			},

			populateDB : function(tx) {
				//footstep and user
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS users(user_id INTEGER NOT NULL PRIMARY KEY unique, username NOT NULL, password NOT NULL, active, updated_at NOT NULL )'
			    );

			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS footsteps_users(footsteps_users_id INTEGER NOT NULL PRIMARY KEY, footstep_id INTEGER NOT NULL, user_id INTEGER NOT NULL, updated_at NOT NULL )'
			    );

			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS footsteps(footstep_id INTEGER NOT NULL PRIMARY KEY unique, title, image_id INTEGER, latitude NOT NULL, longitude NOT NULL, updated_at NOT NULL )'
			    );

			    //footstep it's content and the user
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS footstep_contents(footstep_content_id INTEGER NOT NULL PRIMARY KEY, image_id INTEGER, footstep_id INTEGER, content, location_id INTEGER NOT NULL, updated_at NOT NULL )'
			    );

			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS footstep_contents_users(footstep_contents_users_id INTEGER NOT NULL PRIMARY KEY, user_id INTEGER NOT NULL, footstep_content_id INTEGER NOT NULL, updated_at NOT NULL )'
			    );

			    //locations
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS locations(location_id INTEGER NOT NULL PRIMARY KEY, footstep_id INTEGER NOT NULL, type NOT NULL, location INTEGER NOT NULL, other_id INTEGER NOT NULL, updated_at NOT NULL )'
			    );

			    //objectives
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS objectives(objective_id INTEGER NOT NULL PRIMARY KEY, description, footstep_id INTEGER, location_id INTEGER, updated_at NOT NULL )'
			    );

			    //scores
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS scores(score_id INTEGER NOT NULL PRIMARY KEY unique, points NOT NULL, user_id INTEGER NOT NULL, updated_at NOT NULL )'
			    );

			     //update times!
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS synchronized(id INTEGER NOT NULL PRIMARY KEY unique, updated_at NOT NULL )'
			    );

			},

			errorCB: function(err) {
		        console.log(err);
		    },

		    getTimeStamp: function() {
				return +new Date;
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

		    	tx.executeSql('INSERT OR IGNORE INTO users(user_id, username, password, active, updated_at) VALUES(?, ?, ?, ?, ?)', [user_id, username, password, 1, db.getTimeStamp()]);
		    },

		    creatUserQuerySuccess: function(tx, result) {
		    	console.log(tx);
		    	console.log('etwas');
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
			    if(results.rows.length != 0) {
	                App.userModel.set({user_id: results.rows.item(0).user_id, username: results.rows.item(0).username, password: results.rows.item(0).password});
	                //start synchornizing right now
	                db.initSynchronizing();
	                App.StackNavigator.pushView(new MapView({ collection: new MarkerCollection }));
	            //else, the app 
			    } else {
			    	//set timeout because splashscreen will be too short otherwise
			    	setTimeout(function(){
			    		App.StackNavigator.pushView(new LoginView);
			    	}, 100);
			    }
		    },

		    //logout current user
		    initLogoutUser: function() {
		    	App.dbInstantion.transaction(this.logoutUser, this.errorCB, this.logoutUserQuerySuccess);	
		    },

		    logoutUser: function(tx) {
		    	//set user on active = 0
		    	tx.executeSql('UPDATE users SET active = 0 WHERE user_id = ?', [App.userModel.get('user_id')]);
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
				var self = this;

				self.timestamp = self.getTimeStamp();

				//sync each table with remote
				this.getNewFootstep();
				// this.getNewFootstepContents();
				// this.getNewLocations();
				// this.getNewObjectives();
				// this.getNewScores();
			},

			getNewFootstep: function() {
				var self = this;
				$.ajax({
					type: 'POST',
					url: 'http://www.pimmeijer.com/voetstappen/api.php',
					data: JSON.stringify({action: 'retrieve_footstep', timestamp: self.timestamp}),
					success: function(data) {
						var results = $.parseJSON(data);

						console.log(results);

						$.each(results, function(index, val){
							console.log(val);
						});

					},
					error: function(xhr, ajaxOptions, thrownError) {
						console.log(xhr);
						console.log(ajaxOptions);
						console.log(thrownError);

					}
				});
			},

			getNewFootstepContents: function() {
				var self = this;
				$.ajax({
					dataType: 'application/json',
					type: 'POST',
					url: 'http://www.pimmeijer.com/voetstappen/api.php',
					data: JSON.stringify({action: 'retrieve_footstep_contents', timestamp: self.timestamp}),
					success: function(data) {
						var result = $.parseJSON(data);
					},
					error: function(xhr, ajaxOptions, thrownError) {
						console.log(xhr);
						console.log(ajaxOptions);
						console.log(thrownError);

					}
				});
			},

			getNewLocations: function() {
				var self = this;

				$.ajax({
					dataType: 'application/json',
					type: 'POST',
					url: 'http://www.pimmeijer.com/voetstappen/api.php',
					data: JSON.stringify({action: 'retrieve_locations', timestamp: self.timestamp}),
					success: function(data) {
						var result = $.parseJSON(data);
					},
					error: function(xhr, ajaxOptions, thrownError) {
						console.log(xhr);
						console.log(ajaxOptions);
						console.log(thrownError);

					}
				});

			},

			getNewObjectives: function() {
				var self = this;

				$.ajax({
					dataType: 'application/json',
					type: 'POST',
					url: 'http://www.pimmeijer.com/voetstappen/api.php',
					data: JSON.stringify({action: 'retrieve_objectives', timestamp: self.timestamp}),
					success: function(data) {
						var result = $.parseJSON(data);
					},
					error: function(xhr, ajaxOptions, thrownError) {
						console.log(xhr);
						console.log(ajaxOptions);
						console.log(thrownError);

					}
				});
			},

			syncScores: function() {
				var self = this;

				$.ajax({
					dataType: 'application/json',
					type: 'POST',
					url: 'http://www.pimmeijer.com/voetstappen/api.php',
					data: JSON.stringify({action: 'retrieve_score', timestamp: self.timestamp}),
					success: function(data) {
						var result = $.parseJSON(data);
					},
					error: function(xhr, ajaxOptions, thrownError) {
						console.log(xhr);
						console.log(ajaxOptions);
						console.log(thrownError);

					}
				});
			},

			//ids is array
			syncTable: function(table, ids) {
				//App.dbInstantion.transaction(this.logoutUser, this.errorCB, this.logoutUserQuerySuccess);	
    			//tx.executeSql('UPDATE users SET active = 0 WHERE user_id = ?', [user_id]);

			},

		};
		return db;
	});