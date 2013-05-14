define(['jquery', 'underscore', 'Backbone', 'text!views/scanner/ScannerView.tpl'],
    function ($, _, Backbone, PhotoAssignmentView, ScannerViewTemplate) {
        var ScannerView = Backbone.View.extend({

            initialize: function() {
                document.addEventListener('backbutton', this.onBackKey, false);
				window.plugins.barcodeScanner.scan(
					function(result) {
						if (result.cancelled)
							alert("the user cancelled the scan")
						else
							alert("we got a barcode: " + result.text)
					},
					function(error) {
						alert("scanning failed: " + error)
					}
				)
            },

            events: {
                'click #btnNextView':'btnNextView_clickHandler'
            },

            onBackKey: function() {
                alert('BACK');
            },

            render : function() {
                this.$el.html(_.template(ScannerViewTemplate));
                return this;
            },

        });
        return ScannerView;
    });