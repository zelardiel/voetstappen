define(['underscore', 'Backbone', 'text!views/photoAssignment/PhotoAssignmentView.tpl'],
    function (_, Backbone, PhotoAssignmentTemplate) {
        var PhotoAssignmentView = Backbone.View.extend({
            id: 'PhotoAssignmentView',

            destructionPolicy: 'never',

            initialize : function() {

                this.on('viewActivate', this.viewIsActive, this);
                this.on('viewDeactivate', this.viewDeactivated, this);
            },


            viewIsActive: function() {
                document.addEventListener("backbutton", this.onBackButton, false);
                document.addEventListener('contextmenu', this.onBackButton, false); 
            },

            viewDeactivated: function() {
                this.on('viewDeactivate', this.viewDeactivated, this);
                document.removeEventListener("backbutton", this.onBackButton, false);
                document.removeEventListener("contextmenu", this.onBackButton, false);
            },

            events : {
                'click #block-tl' : 'initCamera',
            },

            render : function () {
                this.$el.html(_.template(PhotoAssignmentTemplate));
                return this;
            },

            initCamera : function(e) {
                e.preventDefault();
                var destinationType = navigator.camera.DestinationType;

                console.log(destinationType.DATA_URL);    
                navigator.camera.getPicture(this.onPhotoDataSuccess, this.onFail, 
                    { 
                        quality: 50, 
                        destinationType: destinationType.DATA_URL 
                    });
            },

            onPhotoDataSuccess : function(imageData) {
                // Uncomment to view the base64 encoded image data
                // console.log(imageData);

                // Get image handle
                var smallImage = document.getElementById('block-tl-img');

                // Unhide image elements

                // Show the captured photo
                // The inline CSS rules are used to resize the image
                smallImage.src = "data:image/jpeg;base64," + imageData;
            },

            onFail : function(message) {
                alert('Failed because: ' + message);
            },

            //pop the last actice view from the stack array and show the previous one

            onBackButton : function(e) {
                App.Helpers.renderMapView(); 
            },
        });

        return PhotoAssignmentView;
    });