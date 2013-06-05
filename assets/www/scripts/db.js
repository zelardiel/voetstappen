define(['views/login/LoginView', 'views/map/MapView', 'collections/MarkerCollection', 'views/footstepContent/FootstepContentsView', 'collections/FootstepContentCollection'],
	function(LoginView, MapView, MarkerCollection, FootstepContentsView, FootstepContentCollection) {
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

				if(window.localStorage.getItem('dbExists') == null) {
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

			    //tx.executeSql('DROP TABLE objectives');
			    //objectives
			    tx.executeSql(
			     	'CREATE TABLE IF NOT EXISTS objectives(objective_id INTEGER NOT NULL PRIMARY KEY, footstep_id INTEGER, img_path)'
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

			    //

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
		    	console.log('init user checking');	
		    	App.dbInstantion.transaction(this.checkForActiveUser, this.errorCB);
		    },

		    //check for active user
		    checkForActiveUser: function(tx) {
		     	tx.executeSql('SELECT * FROM users WHERE active = 1', [], db.userCheckingQuerySuccess, db.errorCB);
		    },

		    userCheckingQuerySuccess: function(tx, results) {
			    // if there was a result, continue to Mapview
			    if(results.rows.length != 0) {
			    	console.log('User found in local database, to the mapview!');
	                App.userModel.set({user_id: results.rows.item(0).user_id, username: results.rows.item(0).username, password: results.rows.item(0).password});

	               	if( App.ViewInstances.MapView == null ) {
	               		App.ViewInstances.MapView = new MapView({ collection: new MarkerCollection });
	               		App.Helpers.processView(App.ViewInstances.MapView);	
	               	} else { 
	               		App.StackNavigator.replaceView(App.ViewInstances.MapView);
	               	}

	                db.initSynchronizing();
	               
	            //else, the app 
			    } else {
			    	console.log('No local user found');
			    	//set timeout because splashscreen will be too short otherwise
			    	if( App.ViewInstances.LoginView == null ) {
			    		App.ViewInstances.LoginView = new LoginView;	
			    		App.Helpers.processView(App.ViewInstances.LoginView);	
			    	} else {
			    		App.StackNavigator.replaceView(App.ViewInstances.LoginView);
			    	}

	               
			    }
		    },

		    //logout current user
		    initLogoutUser: function() {
		    	window.circles = [];
                window.footsteps = [];
		    	App.dbInstantion.transaction(this.logoutUser, this.errorCB);	
		    },

		    logoutUser: function(tx) {
		    	//set user on active = 0
		    	tx.executeSql('UPDATE users SET active = 0 WHERE user_id = ?', [App.userModel.get('user_id')], db.logoutUserQuerySuccess);
		    },

		    logoutUserQuerySuccess: function(tx, results) {

		    	if( App.ViewInstances.LoginView == null ) {
		    		App.ViewInstances.LoginView = new LoginView;

		    		App.StackNavigator.replaceAll(App.ViewInstances.LoginView);	
		    	} else {	
		    		App.StackNavigator.replaceAll(App.ViewInstances.LoginView);
		    	}
		    	
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
					self.syncScores();

					//set 4 empty objectives
					App.dbInstantion.transaction(self.setObjectives, self.errorCB, 
						function(tx, results) { 
							console.log('UPDATed objectives TIME');
					});	

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

			setObjectives: function(tx) {
				tx.executeSql(
			     	'INSERT OR IGNORE INTO objectives(objective_id) VALUES(1)'
			    );
			    tx.executeSql(
			     	'INSERT OR IGNORE INTO objectives(objective_id) VALUES(2)'
			    );
			    tx.executeSql(
			     	'INSERT OR IGNORE INTO objectives(objective_id) VALUES(3)'
			    );
			    tx.executeSql(
			     	'INSERT OR IGNORE INTO objectives(objective_id) VALUES(4)'
			    );

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
					        	}, self.errorCB, function() {
					        		App.Helpers.setUserScore();
					        	});
					        } 
      					});
					},
				});
			},

			syncQuerySuccess: function(tx, results) {
				
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

				//return deferred is done(.then) function with the sent callback to this function
				return data().then(callback);
			},

			retrieveFootstepContentWithWithLocationAndFootstepId: function(callback, footstep_id, location) {
				var self = this;

				var data = function getData(){
					var dfd = $.Deferred();
					App.dbInstantion.transaction(function(tx){
		         		tx.executeSql('SELECT (SELECT count(*) as linked FROM footstep_contents_users WHERE user_id = ? AND footstep_content_id in (SELECT c.footstep_content_id FROM footsteps f, footstep_contents c, locations l WHERE l.location = ? AND f.footstep_id = ? AND f.footstep_id = c.footstep_id AND l.footstep_id = f.footstep_id AND c.footstep_content_id = l.location)) as is_found, c.footstep_content_id, f.footstep_id, f.title, c.content, f.image_id, l.location, (SELECT COUNT( * ) FROM locations WHERE footstep_id = ?) AS location_count FROM footsteps f, footstep_contents c, locations l WHERE l.location = ? AND f.footstep_id = ? AND f.footstep_id = c.footstep_id AND l.footstep_id = f.footstep_id AND c.footstep_content_id = l.location',
		         			[App.userModel.get('user_id'), location, footstep_id, footstep_id, location, footstep_id], dfd.resolve, self.errorCB
		         		);
		        	}, self.errorCB);

		        	return dfd.promise();
				}

				//return deferred is done(.then) function with the sent callback to this function
				return data().then(callback);
			},

			retrieveFootstepContentsWithContentId: function(callback, footstep_content_id) {
				var self = this;

				var data = function getData(){
					var dfd = $.Deferred();
					App.dbInstantion.transaction(function(tx){
		         		tx.executeSql('SELECT c.footstep_content_id, (SELECT count(*) as is_found FROM footstep_contents_users WHERE user_id = ? AND footstep_content_id = ?) AS is_found, f.title, c.content, l.location, f.image_id, f.footstep_id, ( SELECT COUNT( * ) FROM locations WHERE footstep_id IN ( SELECT f.footstep_id FROM footsteps f, footstep_contents c WHERE c.footstep_id = f.footstep_id AND c.footstep_content_id =?) ) AS location_count FROM footsteps f, footstep_contents c, locations l WHERE f.footstep_id = c.footstep_id AND c.footstep_content_id = ? AND c.location_id = l.location_id ORDER BY location',
		         			[App.userModel.get('user_id'), footstep_content_id, footstep_content_id, footstep_content_id], dfd.resolve, self.errorCB
		         		);
		        	}, self.errorCB);

		        	return dfd.promise();
				}

				//return deferred is done(.then) function with the sent callback to this function
				return data().then(callback);
			},

			setObjectivePathAndFootstep: function(callback, objective_id, img_path, footstep_id) {
				var self = this;
				var data = function getData(){
					var dfd = $.Deferred();
					App.dbInstantion.transaction(function(tx){
		         		tx.executeSql('UPDATE objectives SET footstep_id=?, img_path=? WHERE objective_id=?',
		         			[footstep_id, img_path, objective_id], dfd.resolve, self.errorCB
		         		);
		        	}, self.errorCB);

		        	return dfd.promise();
				};

				//return deferred is done(.then) function with the sent callback to this function
				return data().then(callback);
			},

			getImagePathForObjectives: function(callback) {
				var self = this;

				var data = function getData(){
					var dfd = $.Deferred();
					App.dbInstantion.transaction(function(tx){
		         		tx.executeSql('SELECT objective_id, footstep_id, img_path FROM objectives',
		         			[], dfd.resolve, self.errorCB
		         		);
		        	}, self.errorCB);

		        	return dfd.promise();
				}

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
								App.dbClass.setPointsForScore(2);

								navigator.notification.alert(
								    'Je hebt 2 punten verdiend!',  // message
								    function(){},         // callback
								    'Scan is succesvol!',            // title
								    'Ok'                  // buttonName
								);
							}
						}, self.errorCB);
				
				}, self.errorCB, function() {
					if( App.ViewInstances.FootstepContentsViewViewFromMap == null ) {
			    		App.ViewInstances.FootstepContentsViewViewFromMap = new FootstepContentsView({collection: new FootstepContentCollection, footstep_id: null, start_content_id: footstep_contents_id });
			    		App.Helpers.processView(App.ViewInstances.FootstepContentsViewViewFromMap);		
			    	} else {
			    		App.ViewInstances.FootstepContentsViewViewFromMap.options.start_content_id = footstep_contents_id;
			    		App.StackNavigator.replaceView(App.ViewInstances.FootstepContentsViewViewFromMap);
			    	}

					return;
				});	
			},

			checkIfContentIsLinkedToUser: function(callback, user_id, footstep_content_id) {
				var self = this;

				var data = function getData(){
					var dfd = $.Deferred();
					App.dbInstantion.transaction(function(tx){
		         		tx.executeSql('SELECT count(*) as is_found FROM footstep_contents_users WHERE user_id = ? AND footstep_content_id = ?',
		         			[user_id, footstep_content_id], dfd.resolve, self.errorCB
		         		);
		        	}, self.errorCB);

		        	return dfd.promise();
				}

				//return deferred is done(.then) function with the sent callback to this function
				return data().then(callback);
			},

			getAmountOfScannedEachFootstep: function(callback, footstep_id) {
				var self = this;

				var data = function getData(){
					var dfd = $.Deferred();
					App.dbInstantion.transaction(function(tx){
		         		tx.executeSql('SELECT count(*) as scanned_content_count FROM footstep_contents_users cu, footstep_contents c WHERE cu.footstep_content_id = c.footstep_content_id AND c.footstep_id = ? AND cu.user_id = ?',
		         			[footstep_id, App.userModel.get('user_id')], dfd.resolve, self.errorCB
		         		);
		        	}, self.errorCB);

		        	return dfd.promise();
				}

				//return deferred is done(.then) function with the sent callback to this function
				return data().then(callback);
			},

			getUserScore: function(callback) {
				var self = this;

				var data = function getData(){
					var dfd = $.Deferred();
					App.dbInstantion.transaction(function(tx){
		         		tx.executeSql('SELECT * FROM scores WHERE user_id = ?',
		         			[App.userModel.get('user_id')], dfd.resolve, self.errorCB
		         		);
		        	}, self.errorCB);

		        	return dfd.promise();
				}

				//return deferred is done(.then) function with the sent callback to this function
				return data().then(callback);
			},

			setPointsForScore: function(points) {
				var self = this;
				App.dbInstantion.transaction(function(tx){
	         		tx.executeSql('UPDATE scores SET points=points + ? WHERE user_id=?',
	         			[points, App.userModel.get('user_id')], function(){ App.Helpers.setUserScore(); }, self.errorCB );
	        	}, self.errorCB);
			},

			linkUserToFootstep: function(footstep_id) {
				var self = this;
				App.dbInstantion.transaction(function(tx){
					tx.executeSql('SELECT * FROM footsteps_users WHERE footstep_id = ? AND user_id = ?', [footstep_id, App.userModel.get('user_id')],
						function(tx, results){
							if(results.rows.length == 0){

								tx.executeSql('INSERT INTO footsteps_users(footstep_id, user_id, updated_at) VALUES(?, ?, 0)', [footstep_id, App.userModel.get('user_id')] );
								App.dbClass.setPointsForScore(3);
									var linkedUserToFirstContent = function() {

										navigator.notification.confirm(
										'Je hebt het eerste stukje informatie vrij gespeeld van de voetstap in de buurt!',
										function(button){
											if(button === 2) {
												$('#map').removeClass('active-button');
												if( App.ViewInstances.FootstepContentsViewViewFromMap == null ) {
										    		App.ViewInstances.FootstepContentsViewViewFromMap = new FootstepContentsView({collection: new FootstepContentCollection, footstep_id: footstep_id, location: 1, start_content_id: null});
										    		App.Helpers.processView(App.ViewInstances.FootstepContentsViewViewFromMap);		
										    	} else {
										    		App.ViewInstances.FootstepContentsViewViewFromMap.options.location = 1;
										    		App.StackNavigator.replaceView(App.ViewInstances.FootstepContentsViewViewFromMap);
										    	}
											} else {
												
											}
										}, 
										'Voetstap gevonden!', 
										'Op de kaart blijven, Naar de voetstappagina' 
										);
									};

									App.dbClass.linkUserToFirstContent(linkedUserToFirstContent, footstep_id);			
								}
						}, self.errorCB);
				
				}, self.errorCB);	
			},

			checkIfFootstepIsLinkedToUser: function(callback, footstep_id) {
				var self = this;

				var data = function getData(){
					var dfd = $.Deferred();
					App.dbInstantion.transaction(function(tx){
		         		tx.executeSql('SELECT count(*) as is_found FROM footsteps_users WHERE user_id = ? AND footstep_id = ?',
		         			[App.userModel.get('user_id'), footstep_id], dfd.resolve, self.errorCB
		         		);
		        	}, self.errorCB);

		        	return dfd.promise();
				}

				//return deferred is done(.then) function with the sent callback to this function
				return data().then(callback);
			},

			linkUserToFirstContent: function(callback, footstep_id) {
				var self = this;

				var data = function getData(){
					var dfd = $.Deferred();
					App.dbInstantion.transaction(function(tx){
		         		tx.executeSql('INSERT INTO footstep_contents_users(footstep_content_id, user_id, updated_at) VALUES((SELECT other_id FROM locations WHERE footstep_id = ? AND location = 1), ?, 0)',
		         			[footstep_id, App.userModel.get('user_id')], dfd.resolve, self.errorCB
		         		);
		        	}, self.errorCB);

		        	return dfd.promise();
				}

				//return deferred is done(.then) function with the sent callback to this function
				return data().then(callback);
			},

		};
		return db;
	});