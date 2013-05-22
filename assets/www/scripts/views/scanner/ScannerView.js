define(['jquery', 'underscore', 'Backbone', 'views/footstepContent/FootstepContentsView'],
    function ($, _, Backbone, PhotoAssignmentView, FootstepContentsView) {
        var ScannerView = Backbone.View.extend({
            id: 'ScannerView',
            destructionPolicy: 'auto',
            initialize: function() {
				window.plugins.barcodeScanner.scan(this.scanningSuccess, this.scanningError);
            },

            events: {
                'click #btnNextView':'btnNextView_clickHandler'
            },

            scanningError: function(error) {
                alert("scanning failed: " + error);
            },

            scanningSuccess: function(result) {
                if (result.cancelled) {
                    alert("the user cancelled the scan");
                } else {
                    App.ViewInstances = {}; 
                    App.dbClass.linkUserToContent(result.text);
                }
            },

        });
        return ScannerView;
    });