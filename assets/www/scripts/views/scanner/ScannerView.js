define(['jquery', 'underscore', 'Backbone', 'views/footstepContent/FootstepContentsView'],
    function ($, _, Backbone, PhotoAssignmentView, FootstepContentsView) {
        var ScannerView = Backbone.View.extend({
            id: 'Scannerview',
            destructionPolicy: 'auto',
            initialize: function() {
                document.addEventListener('backbutton', this.onBackKey, false);
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
                    App.dbClass.linkUserToContent(result.text);
                }
            },

            onBackKey: function() {
                alert('BACK');
            },

            render : function() {
                return this;
            },

        });
        return ScannerView;
    });