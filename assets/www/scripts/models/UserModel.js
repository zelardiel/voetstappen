define(['jquery', 'underscore', 'Backbone'],
	function($, _, Backbone) {
		var UserModel = Backbone.Model.extend({
			defaults: {
				user_id: '',
				username: '',
				password: ''
			}
	});

	return UserModel;
});
