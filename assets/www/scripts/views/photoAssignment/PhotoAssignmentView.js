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
                //App.dbClass.getImagePathForObjective();
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
                        quality: 80,
                        destinationType: destinationType.FILE_URI,
                        encodingType: Camera.EncodingType.JPEG,
                        targetWidth: 200,
                        targetHeight: 200,
                    });
            },

            onPhotoDataSuccess : function(imageURI) {
                var thumb = $('#photo-container')
                                    .find("[data-objectiveid='" + App.ViewInstances.PhotoAssignmentView.objectiveid + "']")
                                    .children('.assignment-image');

                thumb.attr('src', imageURI);
                App.ViewInstances.PhotoAssignmentView.imageURI = imageURI;

                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, App.ViewInstances.PhotoAssignmentView.gotFileSystem, App.ViewInstances.PhotoAssignmentView.failFileSystem);

            },

            gotFileSystem: function(fileSystem) {
                fileSystem.root.getDirectory("voetstappen_opdrachten", {create: true, exclusive: false}, App.ViewInstances.PhotoAssignmentView.gotDirEntry, App.ViewInstances.PhotoAssignmentView.failFileSystem) 
            },

            gotDirEntry: function (dirEntry) {
                App.ViewInstances.PhotoAssignmentView.dirEntry = dirEntry;
                window.resolveLocalFileSystemURI(App.ViewInstances.PhotoAssignmentView.imageURI, App.ViewInstances.PhotoAssignmentView.gotFileEntry, App.ViewInstances.PhotoAssignmentView.failFileSystem);
            },

            gotFileEntry: function(fileEntry) {
                fileEntry.moveTo(App.ViewInstances.PhotoAssignmentView.dirEntry, "objective" + App.ViewInstances.PhotoAssignmentView.objectiveid + ".jpg");
                
                var settingObjectiveImageDone = function() {
                    console.log('DONE SAVING OBJETIVEIMAGE TO DB');
                };

                App.dbClass.setImagePathForObjective(settingObjectiveImageDone, App.ViewInstances.PhotoAssignmentView.objectiveid);
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