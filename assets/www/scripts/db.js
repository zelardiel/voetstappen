define([],
	function() {
		var db = {
			dbInstantion : '',
			initialize: function() {
				this.dbInstantion = window.openDatabase("voetstappen", "1.0", "Test DB", 2000000);
			},
			populateDB : function(tx) {
			     tx.executeSql('DROP TABLE IF EXISTS DEMO');
			     tx.executeSql('CREATEs TABLE IF NOT EXISTS DEMO (id unique, data)');
			     tx.executeSql('INSERT INTO DEMO (id, data) VALUES (1, "First row")');
			     tx.executeSql('INSERT INTO DEMO (id, data) VALUES (2, "Second row")');
			},

			errorCB : function errorCB(err) {
		        alert("Error processing SQL: "+err);
		    },

		    // Transaction success callback
		    //
		    successCB : function() {
		        alert("success!");
		    },	
		};
		return db;
	});