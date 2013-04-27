/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * User: pwalczys
 * Date: 2/16/12
 * Time: 9:53 AM
 */

define(['underscore', 'Backbone', 'text!views/map/MapView.tpl', 'views/map/MarkerView', 'models/MarkerModel'],
    function (_, Backbone, MapViewTemplate, MarkerView, MarkerModel) {
        var MapView = Backbone.View.extend({
            events:{
                'click #btnBack':'btnBack_clickHandler'
            },

            attributes: {
                id: 'map'
            },

            render:function () {
                this.$el.html(_.template(MapViewTemplate));
                
                this.initMap();

                return this;
            },

            initMap: function() {
                var self = this; 

                var map = new GMaps({
                    div: self.el,
                    lat: -12.043333,
                    lng: -77.028333
                }); 

                self.addMarkers();
            },

            addMarkers: function() {
                //instantions are camelcase
                var markerView = new MarkerView({ model: new MarkerModel })

                this.$el.append(markerView.render().el);
            },

        

            btnBack_clickHandler:function (event) {
               
            }

        });

        return MapView;
    });