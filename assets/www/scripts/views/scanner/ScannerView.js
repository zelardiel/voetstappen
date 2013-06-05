define(['jquery', 'underscore', 'Backbone'],
    function ($, _, Backbone) {
        var ScannerView = Backbone.View.extend({
            id: 'ScannerView',
            destructionPolicy: 'never',

            initialize: function() {
				//if view is active start scanstuffs
                this.on('viewActivate', this.viewIsActive, this);
                this.on('viewDeactivate', this.viewDeactivated, this);
            },

            viewDeactivated: function() {
                $('#scan').removeClass('active-button');
                $('#scan').siblings().removeClass('active-button');
                window.clicked = 0;
            },

            viewIsActive: function() {
                window.clicked = 0;
                window.plugins.barcodeScanner.scan(this.scanningSuccess, this.scanningError);
            },

            scanningError: function(error) {
                alert('Scannen mislukt!');
                console.log(error);
            },

            scanningSuccess: function(result) {
                if (result.cancelled) {
                    App.Helpers.renderMapView(); 
                } else {
                    App.dbClass.linkUserToContent(result.text);
                }
            },

        });
        return ScannerView;
    });