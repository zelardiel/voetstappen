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

				if(window.localStorage.getItem('dbExists') === null) {
					App.dbInstantion.transaction(this.populateDB, db.errorCB, function(result){ self.initUserChecking(); window.localStorage.setItem('dbExists', 1) });
				} else { 
					console.log('Not creating');
					self.initUserChecking();
				}
				
			},

			populateDB : function(tx) {
				//footstep and user
				

				tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS users(user_id INTEGER NOT NULL PRIMARY KEY unique, username NOT NULL, password NOT NULL, active, updated_at NOT NULL )'
			    );

			    // tx.executeSql('DROP TABLE footsteps_users');

			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS footsteps_users(footsteps_users_id INTEGER NOT NULL PRIMARY KEY, footstep_id INTEGER NOT NULL, user_id INTEGER NOT NULL, updated_at NOT NULL )'
			    );


			    // tx.executeSql('DROP TABLE footsteps');

			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS footsteps(footstep_id INTEGER NOT NULL PRIMARY KEY unique, title, image_id INTEGER, latitude NOT NULL, longitude NOT NULL, updated_at NOT NULL )'
			    );


			    // tx.executeSql('DROP TABLE footstep_contents');

			    //footstep it's content and the user
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS footstep_contents(footstep_content_id INTEGER NOT NULL PRIMARY KEY, image_id INTEGER, footstep_id INTEGER, content, location_id INTEGER NOT NULL, updated_at NOT NULL )'
			    );

			    // tx.executeSql('DROP TABLE footstep_contents_users');

			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS footstep_contents_users(footstep_contents_users_id INTEGER NOT NULL PRIMARY KEY, user_id INTEGER NOT NULL, footstep_content_id INTEGER NOT NULL, updated_at NOT NULL )'
			    );

			    // tx.executeSql('DROP TABLE locations');

			    //locations
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS locations(location_id INTEGER NOT NULL PRIMARY KEY, footstep_id INTEGER NOT NULL, type NOT NULL, location INTEGER NOT NULL, other_id INTEGER NOT NULL, updated_at NOT NULL )'
			    );

			    // tx.executeSql('DROP TABLE objectives');
			    //objectives
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS objectives(objective_id INTEGER NOT NULL PRIMARY KEY, description, footstep_id INTEGER, location_id INTEGER, updated_at NOT NULL )'
			    );

			    // tx.executeSql('DROP TABLE scores');
			    //scores
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS scores(score_id INTEGER NOT NULL PRIMARY KEY unique, points NOT NULL, user_id INTEGER NOT NULL, updated_at NOT NULL )'
			    );

			    // tx.executeSql('DROP TABLE synchronized');
			     //update times!
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS synchronized(id INTEGER NOT NULL PRIMARY KEY unique, updated_at NOT NULL )'
			    );

			},

			errorCB: function(err) {
		        console.log(err);
		    },

		    //return timestamp in milliseconds
		    getTimeStamp: function() {
				return +new Date;
		    },

		    /***
			* USER DB FUNCTIONS
			***/
	   
			//creating user
			initLocalUserCreating: function() {
				// make use of the global databaseinstation
				App.dbInstantion.transaction(this.createUserLocal, this.errorCB, function(){
					console.log('local user created');
				});
			},

		    createUserLocal: function(tx) {
		    	var user_id = App.userModel.get('user_id'),
		    		username = App.userModel.get('username'),
		    		password = App.userModel.get('password');

		    	tx.executeSql('INSERT OR REPLACE INTO users(user_id, username, password, active, updated_at) VALUES(?, ?, ?, ?, ?)', [user_id, username, password, 1, db.getTimeStamp()]);
		    },

		    initUserChecking: function() {
		    	App.dbInstantion.transaction(this.checkForActiveUser, this.errorCB);
		    },

		    //check for active user
		    checkForActiveUser: function(tx) {
		     	tx.executeSql('SELECT * FROM users WHERE active = 1', [], db.userCheckingQuerySuccess, db.errorCB);
		    },

		    userCheckingQuerySuccess: function(tx, results) {
		    	console.log(results);
			    // if there was a result, continue to Mapview
			    if(results.rows.length != 0) {
	                App.userModel.set({user_id: results.rows.item(0).user_id, username: results.rows.item(0).username, password: results.rows.item(0).password});
	                
	                //start synchornizing right now TEMPORARILY COMMENTED OUT
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

				//set ajax defaults so we do not repeat ourselves
				$.ajaxSetup({
				 	type: 'POST',
					url: 'http://www.pimmeijer.com/voetstappen/api.php',
					error: function(xhr, ajaxOptions, thrownError) {
						console.log(xhr);
						console.log(ajaxOptions);
						console.log(thrownError);
					}
				});

				//make use of deffereds so we can see when something is done
				var check_update_time = function() {
					var deferred = $.Deferred();

					App.dbInstantion.transaction(function(tx){
						tx.executeSql('SELECT updated_at FROM synchronized WHERE id = 1', [] );
					}, self.errorCB, function(tx, results) { 
						if(typeof(results) == 'undefined') {
							self.timestamp = 0;
							deferred.resolve();
						}
					});	

					//im done, after this the .done gets triggered
					return deferred.promise();
				};
				
				//sync each table with remote database
				check_update_time().done(function(){
					self.syncFootsteps();
					self.syncFootstepContents();
					self.syncLocations();
					self.syncObjectives();
					self.syncScores();

					self.timestamp = self.getTimeStamp();

					//set new global last-updated time in the local database 
					// TODO PREVENT SETTING NEW UPDATE TIME AT
					App.dbInstantion.transaction(function(tx){
						tx.executeSql('INSERT OR REPLACE INTO synchronized(id, updated_at) VALUES(1, ?)', [self.timestamp] );
					}, self.errorCB, function(tx, results) { 
						console.log('UPDATED UPDATE TIME');
					});	
				});
			},

			

			syncFootsteps: function() {
				var self = this;
				$.ajax({
					data: JSON.stringify({action: 'retrieve_footsteps', timestamp: self.timestamp}),
					success: function(data) {
						var results = $.parseJSON(data);

						//for each retrieved row(object) do a query
						$.each(results, function(index, val){
							if(typeof(val) === 'object') {
								App.dbInstantion.transaction(function(tx){
									tx.executeSql('INSERT OR REPLACE INTO footsteps(footstep_id, title, image_id, latitude, longitude, updated_at) VALUES(?, ?, ?, ?, ?, ?)', 
										[val.footstep_id, val.title, val.image_id, val.latitude, val.longitude, val.updated_at],
										self.syncQuerySuccess, self.errorCB
									);
								});
							} 
						});
					},
				});
			},

			syncFootstepContents: function() {
				var self = this;
				$.ajax({
					data: JSON.stringify({action: 'retrieve_footstep_contents', timestamp: self.timestamp}),
					success: function(data) {
						var results = $.parseJSON(data);

						$.each(results, function(index, val){
							if(typeof(val) === 'object') {
								App.dbInstantion.transaction(function(tx){
									tx.executeSql('INSERT OR REPLACE INTO footstep_contents(footstep_content_id, image_id, footstep_id, content, location_id, updated_at) VALUES(?, ?, ?, ?, ?, ?)', 
										[val.footstep_content_id, val.image_id, val.footstep_id, val.content, val.location_id, val.updated_at],
										self.syncQuerySuccess, self.errorCB
									);
								}, self.errorCB);
							} 
						});
					},
				});
			},

			syncLocations: function() {
				var self = this;

				$.ajax({
					data: JSON.stringify({action: 'retrieve_locations', timestamp: self.timestamp}),
					success: function(data) {
						var results = $.parseJSON(data);

						$.each(results, function(index, val){
							if(typeof(val) === 'object') {
								App.dbInstantion.transaction(function(tx){
									tx.executeSql('INSERT OR REPLACE INTO locations(location_id, footstep_id, type, location, other_id, updated_at) VALUES(?, ?, ?, ?, ?, ?)', 
										[val.location_id, val.footstep_id, val.type, val.location, val.other_id, val.updated_at],
										self.syncQuerySuccess, self.errorCB
									);
								}, self.errorCB );
							} 
						});
					},
				});

			},

			syncObjectives: function() {
				var self = this;

				$.ajax({
					data: JSON.stringify({action: 'retrieve_objectives', timestamp: self.timestamp}),
					success: function(data) {
						var results = $.parseJSON(data);

						$.each(results, function(index, val){
					       if(typeof(val) === 'object') {
					        	App.dbInstantion.transaction(function(tx){
					         		tx.executeSql('INSERT OR REPLACE INTO objectives(objective_id, description, footstep_id, location_id, updated_at) VALUES(?, ?, ?, ?, ?)', 
					          			[val.objective_id, val.description, val.footstep_id, val.location_id, val.updated_at],
					          			self.syncQuerySuccess, self.errorCB
					         		);
					        	}, self.errorCB);
					       	} 
					    });
					},
				});
			},

			syncScores: function() {
				var self = this;

				$.ajax({
					data: JSON.stringify({action: 'retrieve_score', timestamp: self.timestamp}),
					success: function(data) {
						var results = $.parseJSON(data);

						$.each(results, function(index, val){
					        if(typeof(val) === 'object') {
					       		App.dbInstantion.transaction(function(tx){
					         		tx.executeSql('INSERT OR REPLACE INTO scores(score_id, points, user_id, updated_at) VALUES(?, ?, ?, ?)', 
					          			[val.score_id, val.points, val.user_id, val.updated_at],
					          			self.syncQuerySuccess, self.errorCB
					         		);
					        	}, self.errorCB);
					        } 
      					});
					},
				});
			},

			syncQuerySuccess: function(tx, results) {
				//console.log(results);
			},

			/***
			* CONTENT AND MARKER FILLING
			***/
			retrieveLocalFootsteps: function(callback) {
				var self = this;
				var data = function getData(){
					var dfd = $.Deferred();

					App.dbInstantion.transaction(function(tx){
		         		tx.executeSql('SELECT * FROM footsteps', [],
		          			dfd.resolve, self.errorCB
		         		);
		        	}, self.errorCB);

		        	return dfd.promise();
				}
				console.log('happens');

				//return deferred is done(.then) function with the sent callback to this function
				return data().then(callback);
			},

			linkUserToContent: function(footstep_contents_id) {
				var self = this;
				App.dbInstantion.transaction(function(tx){
					tx.executeSql('SELECT * FROM footstep_contents_users WHERE footstep_content_id = ? AND user_id = ?', [footstep_contents_id, App.userModel.get('user_id')],
						function(tx, results){
							if(results.rows.length == 0){
								tx.executeSql('INSERT INTO footstep_contents_users(footstep_content_id, user_id, updated_at) VALUES(?, ?, 0)', [footstep_contents_id, App.userModel.get('user_id')] );
							}
						}, self.errorCB);
				
				}, self.errorCB, function(tx, results) { 
					console.log('footstep_contents_users added');
				});	
			},
		};
		return db;
	});