define(['jquery', 'underscore', 'Backbone'],
	function($, _, Backbone) {
		var MarkerModel = Backbone.Model.extend({
			defaults: {
				footstep_id: 0,
				title: '',
				image_id: 0,
				latitude: 0,
				longitude: 0,
				updated_at: 0
			}
	});

	return MarkerModel;
});
