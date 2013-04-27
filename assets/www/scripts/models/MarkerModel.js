define(['jquery', 'underscore', 'Backbone'],
	function($, _, Backbone) {
		var MarkerModel = Backbone.Model.extend({
			defaults: {
				title: 'hello',
			}
	});

	return MarkerModel;
});
