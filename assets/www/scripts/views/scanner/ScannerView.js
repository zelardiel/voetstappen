define(['jquery', 'underscore', 'Backbone', 'views/footstepContent/FootstepContentsView'],
    function ($, _, Backbone, PhotoAssignmentView, FootstepContentsView) {
        var ScannerView = Backbone.View.extend({

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
                    console.log("bam werk " + result.text);
                    //App.dbClass.linkUserToContent(result.text);
                    if(App.ViewInstances.FootstepContentsViewFromScanner == null) {
                        App.ViewInstances.FootstepContentsViewFromScanner = new FootstepContentsView({ footstep_id: null }, result.text);
                    }

                    App.Helpers.processView('FootstepContentsView', App.ViewInstances.FootstepContentsViewFromScanner); 
    
                    
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