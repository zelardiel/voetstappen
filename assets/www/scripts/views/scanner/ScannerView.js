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
                    var allowed_numbers = ['1', '2', '3', '4', '5', 1, 2, 3, 4, 5];

                    console.log($.inArray(result.text, allowed_numbers) == 0);
                    console.log(result.text + ' result');
                    if($.inArray(result.text, allowed_numbers) != -1) {
                        App.dbClass.linkUserToContent(result.text);
                    } else {
                        navigator.notification.alert(
                            'Geen geldige QR-code gescand',// message
                            function(){ App.Helpers.renderMapView(); },// callback
                            'Ongeldige QR-code!',  // title
                            'Oke'                  // buttonName
                        );
                    }
                }
            },

        });
        return ScannerView;
    });