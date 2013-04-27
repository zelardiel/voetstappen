define(['jquery', 'underscore', 'Backbone', 'models/MarkerModel'],
	function($, _, Backbone, MarkerModel) {
		var MarkerCollection = Backbone.Collections.extend({ model: new MarkerModel });
	});

