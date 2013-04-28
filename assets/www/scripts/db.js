define([],
	function() {
		var db = {
			dbInstantion : '',
			initialize: function() {
				this.dbInstantion = window.openDatabase("voetstappen", "1.0", "test", 2000000);
				this.dbInstantion.transaction(this.populateDB, this.errorCB, this.successCB.apply(this));
			},

			populateDB : function(tx) {
			     tx.executeSql('DROP TABLE IF EXISTS DEMO');
			     tx.executeSql('CREATE TABLE IF NOT EXISTS DEMO (id unique, data)');
			     tx.executeSql('INSERT INTO DEMO (id, data) VALUES (1, "First row")');
			     tx.executeSql('INSERT INTO DEMO (id, data) VALUES (2, "Second row")');
			},

			errorCB : function errorCB(err) {
		        console.log(err);
		    },

		    // Transaction success callback
		    //
		    successCB : function() {
		    	this.dbInstantion = window.openDatabase("voetstappen", "1.0", "test", 2000000);
		        this.dbInstantion.transaction(this.queryDB, this.errorCB)
		    },	

		    queryDB: function(tx) {
		     	tx.executeSql('SELECT * FROM DEMO', [], db.querySuccess, db.errorCB);
		    },

		    querySuccess: function(results) {
		    	console.log(results);
		    	alert("Returned rows = " + results.rows.length);
			    // this will be true since it was a select statement and so rowsAffected was 0
			    if (!results.rowsAffected) {
			        console.log('No rows affected!');
			        return false;
			    }
			    // for an insert statement, this property will return the ID of the last inserted row
			    console.log("Last inserted row ID = " + results.insertId);
		    }
		};
		return db;
	});