define(['jquery', 'underscore', 'Backbone'],
    function ($, _, Backbone) {
        var ScannerView = Backbone.View.extend({
            id: 'ScannerView',
            destructionPolicy: 'never',

            initialize: function() {
				//if view is active start scanstuffs
                this.on('viewActivate', this.viewIsActive, this);
            },

            viewIsActive: function() {
                window.plugins.barcodeScanner.scan(this.scanningSuccess, this.scanningError);
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

        });
        return ScannerView;
    });