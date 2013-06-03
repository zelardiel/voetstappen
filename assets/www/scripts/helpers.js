define(['views/map/MapView', 'collections/MarkerCollection'],
	function(MapView, MarkerCollection) {
		var Helper = {
		    processView: function(viewInstance) {
		        if (!App.StackNavigator.activeView || Object(App.StackNavigator.activeView).constructor != viewInstance) {

	                if (App.StackNavigator.activeView) {
	                	console.log('replacing');
	                    App.StackNavigator.replaceView(viewInstance);
	                }
	                else {// Pushing and creating first view on to the stack
	                	console.log('making');
	                    App.StackNavigator.pushView(viewInstance);
	     
	                } // Replacing and creating new view on the stack
		        }
		    },

		    renderMapView: function() {
	    		if(App.ViewInstances.MapView == null) {
               		App.ViewInstances.MapView = new MapView({ collection: new MarkerCollection });
               		App.Helpers.processView(App.ViewInstances.MapView);	
               	} else { 
               		console.log('REPLACING WITH MAPVIEW');
               		App.StackNavigator.replaceView(App.ViewInstances.MapView);
               	}
		    },

		    setUserScore: function() {
		    	var gotUserScore = function(tx, results) {
		    		$('.total-score').html(""+ results.rows.item(0).points +"pt");
		    	};

		    	$('h1#username').html(""+ App.userModel.get('username') +"");
		    	

		    	App.dbClass.getUserScore(gotUserScore);
		    },

		}; //end Helper class
	return Helper;
});