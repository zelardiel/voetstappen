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
                // document.addEventListener('contextmenu', this.onBackButton, false); 
                $('#map').show();
                var gotObjectives = function(tx, results) {
                    for (var i = 0; i < results.rows.length; i++) {
                        console.log(results.rows.item(i).img_path);
                        var objective_id = results.rows.item(i).objective_id,
                            img_path = ( results.rows.item(i).img_path ) ? results.rows.item(i).img_path : "",
                            footstep_id = ( results.rows.item(i).footstep_id ) ? results.rows.item(i).footstep_id : "";

                            console.log(img_path);

                        switch (i) {
                            case 0 :
                                $('#block-tl-img').attr('src', img_path);
                                $('#block-tl').attr('data-objectiveid', objective_id);
                                $('#block-tl').attr('data-footstepid', footstep_id);
                                break;
                            case 1 :
                                $('#block-tr-img').attr('src', img_path);
                                $('#block-tr').attr('data-objectiveid', objective_id);
                                $('#block-tr').data('footstepid', footstep_id);

                                break;
                            case 2 :
                                $('#block-bl-img').attr('src', img_path);
                                $('#block-bl').attr('data-objectiveid', objective_id);
                                $('#block-bl').data('footstepid', footstep_id);

                                break;
                            case 3 :
                                $('#block-br-img').attr('src', img_path);
                                $('#block-br').attr('data-objectiveid', objective_id);
                                $('#block-br').data('footstepid', footstep_id);

                                break;
                        }
                    }
                };

                App.dbClass.getImagePathForObjectives(gotObjectives);
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
                
                var not_allowed = $('#photo-container').find("[data-footstepid='" + window.in_radius + "']");    

                if(not_allowed.length != 0) {

                    alert('Er is al een opdracht uitgevoerd voor de in huidig aanwezige radius van de voetstap');
                    return;
                }

                console.log('objectiveid: ' + this.objectiveid + ' footstep_id_in_range ' + window.in_radius);

                var destinationType = navigator.camera.DestinationType;
 
                navigator.camera.getPicture(this.onPhotoDataSuccess, this.onFailTakingPicture, 
                    {
                        quality: 80,
                        destinationType: destinationType.FILE_URI,
                        encodingType: Camera.EncodingType.JPEG,
                        targetWidth: 250,
                        targetHeight: 250,
                    });
            },

            onPhotoDataSuccess : function(imageURI) {
                App.ViewInstances.PhotoAssignmentView.thumb = $('#photo-container')
                                    .find("[data-objectiveid='" + App.ViewInstances.PhotoAssignmentView.objectiveid + "']")
                                    .children('.assignment-image');

                //set the instance's property(which is actually 'this' in the right context)
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
                var settingObjectiveImageDone = function() {

                    App.ViewInstances.PhotoAssignmentView.thumb.attr('src', '');

                    App.ViewInstances.PhotoAssignmentView.thumb.attr('src', App.ViewInstances.PhotoAssignmentView.fullPath);

                    App.ViewInstances.PhotoAssignmentView.thumb.parent().attr('data-footstepid', window.in_radius);

                };

                fileEntry.moveTo(App.ViewInstances.PhotoAssignmentView.dirEntry, "objective" + App.ViewInstances.PhotoAssignmentView.objectiveid + ".jpg", function(fileEntry){
                    App.ViewInstances.PhotoAssignmentView.fullPath = fileEntry.fullPath;

                    App.dbClass.setObjectivePathAndFootstep(settingObjectiveImageDone, App.ViewInstances.PhotoAssignmentView.objectiveid, App.ViewInstances.PhotoAssignmentView.fullPath, window.in_radius);
                    if(App.ViewInstances.PhotoAssignmentView.thumb.attr('src') == null) {
                        App.dbClass.setPointsForScore(3);    
                        navigator.notification.alert(
                            'Opdracht uitgevoerd!', 
                            function(){}, 
                            'Je hebt 3 punten verdiend!', 
                            'Top!'
                        );
                    }
                    
                }, function(err){ console.log(err);});
                
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