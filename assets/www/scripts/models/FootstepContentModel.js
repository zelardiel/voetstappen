define(['jquery', 'underscore', 'Backbone'],
	function($, _, Backbone) {
		var FootstepContentModel = Backbone.Model.extend({
			defaults: {
				footstep_content_id: 0,
				content: 0,
				footstep_title: '',
				location: 0
			}
	});

	return FootstepContentModel;
});
