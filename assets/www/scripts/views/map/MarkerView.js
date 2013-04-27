define(['underscore', 'Backbone', 'text!views/map/MarkerView.tpl'],
    function (_, Backbone, MarkerViewTemplate) {
    	var MarkerView = Backbone.View.extend({
    		el: '.marker',
    		tagName: 'span',
    		
    		events: {

    		},

    		render: function() {
    			this.$el.html(_.template(MarkerViewTemplate));
    			return this;
    		}

    });
    return MarkerView;
});