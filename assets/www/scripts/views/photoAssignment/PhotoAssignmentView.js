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
                'click .image-block' : 'initCamera',
            },

            render : function () {
                this.$el.html(_.template(PhotoAssignmentTemplate));
                return this;
            },

            // http://stackoverflow.com/questions/9926152/phonegap-android-how-to-save-the-capture-image-from-camera-in-the-sd-card
            initCamera : function(e) {
                e.preventDefault();
                this.objectiveid = $(e.currentTarget).data('objectiveid');
 
                console.log('objectiveid: ' + this.objectiveid + ' footstep_id_in_range ' + window.in_radius);

                var destinationType = navigator.camera.DestinationType;
 
                navigator.camera.getPicture(this.onPhotoDataSuccess, this.onFailTakingPicture, 
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

                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, App.ViewInstances.PhotoAssignmentView.gotFileSystem, App.ViewInstances.PhotoAssignmentView.failFileSystem);
            },


            gotFileSystem: function(fileSystem) {
                console.log('GOT FILE SYSTEM');
                fileSystem.root.getDirectory("voetstappen_opdrachten", {create: true, exclusive: false}, App.ViewInstances.PhotoAssignmentView.gotDirEntry, App.ViewInstances.PhotoAssignmentView.failFileSystem) 
            },

            gotDirEntry: function (dirEntry) {
                console.log('GOT DIR ENTRY');
                dirEntry.getFile("objective" + App.ViewInstances.PhotoAssignmentView.objectiveid + "footstep" + window.in_radius + ".jpg", {create: true, exclusive: false}, App.ViewInstances.PhotoAssignmentView.gotFileEntry, App.ViewInstances.PhotoAssignmentView.failFileSystem);
            },

            gotFileEntry: function(fileEntry) {
                 fileEntry.createWriter(App.ViewInstances.PhotoAssignmentView.gotFileWriter, App.ViewInstances.PhotoAssignmentView.failFileSystem);   
            },

            gotFileWriter: function (writer) {
                var photo = document.getElementById("block-tl-img");
                
                writer.write(atob(photo.src));

                console.log(atob(photo.src));

                writer.close(); 
            },

            failFileSystem: function(error) {
                console.log(error.code);
            },

            onFailTakingPicture : function(message) {
                alert('Failed because: ' + message);
            },

            //pop the last actice view from the stack array and show the previous one

            onBackButton : function(e) {
                App.Helpers.renderMapView();
            }
        });

        return PhotoAssignmentView;
    });