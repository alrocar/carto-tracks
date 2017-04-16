L.Control.ElevationCarto = L.Control.Elevation.extend({
    options: {
        'elevationAttribute': 'ele',
        'samplePoints': 50
    },
    addData: function(d, layer) {
        if (!this.samplePointsCounter) {
            this.samplePointsCounter = 0;
        }
        if (this.options.samplePoints && this.samplePointsCounter++ % this.options.samplePoints != 0) {
            return;
        }
        this._addData(d);
        if (this._container) {
            this._applyData();
        }
        if (layer === null && d.on) {
            layer = d;
        }
        if (layer) {
            layer.on("mousemove", this._handleLayerMouseOver.bind(this));
        }
    },
    _addData: function(d) {
        var geom = d && d.geometry && d.geometry;
        var i;

        if (geom) {
            switch (geom.type) {
                case 'LineString':
                    this._addGeoJSONData(d, geom.coordinates);
                    break;

                case 'MultiLineString':
                    for (i = 0; i < geom.coordinates.length; i++) {
                        this._addGeoJSONData(d, geom.coordinates[i]);
                    }
                    break;

                default:
                    throw new Error('Invalid GeoJSON object.');
            }
        }

        var feat = d && d.type === "FeatureCollection";
        if (feat) {
            for (i = 0; i < d.features.length; i++) {
                this._addData(d.features[i]);
            }
        }

        if (d && d._latlngs) {
            this._addGPXdata(d._latlngs);
        }
    },
    _addGeoJSONData: function(feature, coords) {
        var opts = this.options;
        if (coords) {
            var data = this._data || [];
            var dist = this._dist || 0;
            var ele = this._maxElevation || 0;
            var s = new L.LatLng(coords[0][1], coords[0][0]);
            for (var i = 0; i < coords.length; i++) {
                var newdist = 0;
                if (this.lastPoint && i == 0)
                    newdist += this.lastPoint.distanceTo(s);
                var s = new L.LatLng(coords[i][1], coords[i][0]);
                var e = new L.LatLng(coords[i ? i - 1 : 0][1], coords[i ? i - 1 : 0][0]);
                newdist += opts.imperial ? s.distanceTo(e) * this.__mileFactor : s.distanceTo(e);

                dist = dist + Math.round(newdist / 1000 * 100000) / 100000;
                var elevationValue = this._getElevation(feature, coords[i]);
                ele = ele < elevationValue ? elevationValue : ele;
                data.push({
                    dist: dist,
                    altitude: opts.imperial ? elevationValue * this.__footFactor : elevationValue,
                    x: coords[i][0],
                    y: coords[i][1],
                    latlng: s
                });
            }
            this.lastPoint = e;
            this._dist = dist;
            this._data = data;
            ele = opts.imperial ? ele * this.__footFactor : ele;
            this._maxElevation = ele;
        }
    },
    _getElevation: function(feature, coord) {
        if (this.options.elevationAttribute) {
            return feature.properties[this.options.elevationAttribute];
        }

        return coord[2];
    },
    _clearData: function() {
        this._data = null;
        this._dist = null;
        this._maxElevation = null;
        this.samplePointsCounter = 0;
    },
});

L.control.elevationCarto = function(options) {
    return new L.Control.ElevationCarto(options);
};
