define(['underscore', 'Backbone', 'text!views/photoAssignment/PhotoAssignmentView.tpl'],
    function (_, Backbone, PhotoAssignmentTemplate) {
        var PhotoAssignmentView = Backbone.View.extend({

            initialize : function() {
                var self = this
                document.addEventListener("backbutton", self.previousView, false);
            },

            events : {
                'click #take_photo' : 'initCamera',
                'click #btnBack' : 'previousView'
            },

            render : function () {
                this.$el.html(_.template(PhotoAssignmentTemplate));
                return this;
            },

            initCamera : function(e) {
                e.preventDefault();
                var destinationType = navigator.camera.DestinationType;

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
                var smallImage = document.getElementById('smallImage');

                // Unhide image elements
                smallImage.style.display = 'block';

                // Show the captured photo
                // The inline CSS rules are used to resize the image
                smallImage.src = "data:image/jpeg;base64," + imageData;
            },

            onFail : function(message) {
                alert('Failed because: ' + message);
            },

            //pop the last actice view from the stack array and show the previous one
            previousView : function() {
                App.StackNavigator.popView();
            },

        });

        return PhotoAssignmentView;
    });