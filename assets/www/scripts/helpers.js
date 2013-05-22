define(['views/map/MapView', 'collections/MarkerCollection'],
	function(MapView, MarkerCollection) {
		var Helper = {
		    processView: function (stackViewId, viewInstance) {
		        if (!App.StackNavigator.activeView || Object(App.StackNavigator.activeView).constructor != viewInstance) {
		            var subview = App.stackViewIds[stackViewId];
		            
		            if (subview) {
		                // Replacing with already constructed view
		                App.StackNavigator.replaceView(subview);
		            } else {
		                if (App.StackNavigator.activeView) {
		                	console.log('replacing');
		                    App.stackViewIds[stackViewId] = App.StackNavigator.replaceView(viewInstance);
		                }
		                else {// Pushing and creating first view on to the stack
		                	console.log('making');
		                    App.stackViewIds[stackViewId] = App.StackNavigator.pushView(viewInstance);
		     
		                } // Replacing and creating new view on the stack
		                	
		             }
		        }
		    },

		    renderMapView: function() {
		    	App.ViewInstances = {}; 
		    	App.ViewInstances.MapView = new MapView({collection: new MarkerCollection});
		    	App.Helpers.processView('MapView', App.ViewInstances.MapView);  
		    },

		}; //end Helper class
	return Helper;
});