'use strict';

const util = require('../util/util');
const interpolate = require('../util/interpolate');
const browser = require('../util/browser');
const LngLat = require('../geo/lng_lat');
const LngLatBounds = require('../geo/lng_lat_bounds');
const Point = require('point-geometry');
const Evented = require('../util/evented');

/**
 * Options common to {@link Map#setCamera}, {@link Map#zoomTo}, and {@link Map#setBearing},
 * controlling the destination's location, zoom level, bearing, and pitch.
 * All properties are optional. Unspecified
 * options will default to the map's current value for that property.
 *
 * @typedef {Object} CameraOptions
 * @property {LngLatLike} center The destination's center.
 * @property {number} zoom The destination's zoom level.
 * @property {number} bearing The destination's bearing (rotation), measured in degrees counter-clockwise from north.
 * @property {number} pitch The destination's pitch (tilt), measured in degrees.
 * @property {LngLatLike} around If a `zoom` is specified, `around` determines the zoom center (defaults to the center of the map).
 * @property {LngLatBoundsLike} bounds The bounds to fit the visible area into. If this is set, `zoom` is ignored.
 */

/**
 * Options common to map movement methods that involve animation, such as {@link Map#setCamera} and
 * {@link Map#zoomTo}, controlling the duration and easing function of the animation. All properties
 * are optional.
 *
 * @typedef {Object} AnimationOptions
 * @property {string} [type='none'] The type of animation used to transition between two camera states. Available values are `ease`, `fly`, and `none`.
 * @property {number} duration The animation's duration, measured in milliseconds.
 * @property {Function} easing The animation's easing function.
 * @property {PointLike} offset `x` and `y` coordinates representing the animation's origin of movement relative to the map's center.
 * @property {boolean} animate If `false`, no animation will occur.
 */

class Camera extends Evented {

    constructor(transform, options) {
        super();
        this.transform = transform;
        this._bearingSnap = options.bearingSnap;
    }

    /**
     * Returns the map's geographical centerpoint.
     *
     * @memberof Map#
     * @returns {LngLat} The map's geographical centerpoint.
     */
    getCenter() { return this.transform.center; }

    /**
     * Sets the map's geographical centerpoint. Equivalent to `jumpTo({center: center})`.
     *
     * @memberof Map#
     * @param {LngLatLike} center The centerpoint to set.
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires moveend
     * @returns {Map} `this`
     * @example
     * map.setCenter([-74, 38]);
     * @see [Move symbol with the keyboard](https://www.mapbox.com/mapbox-gl-js/example/rotating-controllable-marker/)
     */
    setCenter(center, eventData) {
        this.setCamera({center: center}, {type: 'none'}, eventData);
        return this;
    }

    /**
     * Pans the map by the specified offest.
     *
     * @memberof Map#
     * @param {Array<number>} offset `x` and `y` coordinates by which to pan the map.
     * @param {AnimationOptions} [options]
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires moveend
     * @returns {Map} `this`
     * @see [Navigate the map with game-like controls](https://www.mapbox.com/mapbox-gl-js/example/game-controls/)
     */
    panBy(offset, animationOptions, eventData) {
        this.panTo(
            this.transform.center, 
            { offset: Point.convert(offset).mult(-1) },
            util.extend({ type: 'ease' }, animationOptions),
            eventData
        );
        return this;
    }

    /**
     * Pans the map to the specified location, with an animated transition.
     *
     * @memberof Map#
     * @param {LngLatLike} lnglat The location to pan the map to.
     * @param {AnimationOptions} [options]
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires moveend
     * @returns {Map} `this`
     */
    panTo(lnglat, cameraOptions, animationOptions, eventData) {
        return this.setCamera(
            util.extend({ center: lnglat }, cameraOptions),
            util.extend({ type: 'ease'}, animationOptions), 
            eventData
        );
    }

    /**
     * Returns the map's current zoom level.
     *
     * @memberof Map#
     * @returns {number} The map's current zoom level.
     */
    getZoom() { return this.transform.zoom; }

    /**
     * Sets the map's zoom level. Equivalent to `jumpTo({zoom: zoom})`.
     *
     * @memberof Map#
     * @param {number} zoom The zoom level to set (0-20).
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires zoomstart
     * @fires move
     * @fires zoom
     * @fires moveend
     * @fires zoomend
     * @returns {Map} `this`
     * @example
     * // zoom the map to 5
     * map.setZoom(5);
     */
    setZoom(zoom, eventData) {
        this.setCamera({zoom: zoom}, {type: 'none'}, eventData);
        return this;
    }

    /**
     * Zooms the map to the specified zoom level, with an animated transition.
     *
     * @memberof Map#
     * @param {number} zoom The zoom level to transition to.
     * @param {AnimationOptions} [options]
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires zoomstart
     * @fires move
     * @fires zoom
     * @fires moveend
     * @fires zoomend
     * @returns {Map} `this`
     */
    zoomTo(zoom, animationOptions, eventData) {
        return this.setCamera({
            zoom: zoom
        }, util.extend({type: 'ease'}, animationOptions), eventData);
    }

    /**
     * Increases the map's zoom level by 1.
     *
     * @memberof Map#
     * @param {AnimationOptions} [options]
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires zoomstart
     * @fires move
     * @fires zoom
     * @fires moveend
     * @fires zoomend
     * @returns {Map} `this`
     */
    zoomIn(animationOptions, eventData) {
        this.zoomTo(this.getZoom() + 1, animationOptions, eventData);
        return this;
    }

    /**
     * Decreases the map's zoom level by 1.
     *
     * @memberof Map#
     * @param {AnimationOptions} [options]
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires zoomstart
     * @fires move
     * @fires zoom
     * @fires moveend
     * @fires zoomend
     * @returns {Map} `this`
     */
    zoomOut(animationOptions, eventData) {
        this.zoomTo(this.getZoom() - 1, animationOptions, eventData);
        return this;
    }

    /**
     * Returns the map's current bearing (rotation).
     *
     * @memberof Map#
     * @returns {number} The map's current bearing, measured in degrees counter-clockwise from north.
     * @see [Navigate the map with game-like controls](https://www.mapbox.com/mapbox-gl-js/example/game-controls/)
     */
    getBearing() { return this.transform.bearing; }

    /**
     * Sets the maps' bearing (rotation). Equivalent to `jumpTo({bearing: bearing})`.
     *
     * @memberof Map#
     * @param {number} bearing The bearing to set, measured in degrees counter-clockwise from north.
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires moveend
     * @returns {Map} `this`
     * @example
     * // rotate the map to 90 degrees
     * map.setBearing(90);
     */
    setBearing(bearing, eventData) {
        this.setCamera({bearing: bearing}, {type: 'none'}, eventData);
        return this;
    }

    /**
     * Rotates the map to the specified bearing, with an animated transition.
     *
     * @memberof Map#
     * @param {number} bearing The bearing to rotate the map to, measured in degrees counter-clockwise from north.
     * @param {AnimationOptions} [options]
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires moveend
     * @returns {Map} `this`
     */
    rotateTo(bearing, options, eventData) {
        return this.setCamera(util.extend({
            bearing: bearing
        }, options), {type: 'ease'}, eventData);
    }

    /**
     * Rotates the map to a bearing of 0 (due north), with an animated transition.
     *
     * @memberof Map#
     * @param {AnimationOptions} [options]
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires moveend
     * @returns {Map} `this`
     */
    resetNorth(options, eventData) {
        this.rotateTo(0, util.extend({duration: 1000}, options), eventData);
        return this;
    }

    /**
     * Snaps the map's bearing to 0 (due north), if the current bearing is close enough to it (i.e. within the `bearingSnap` threshold).
     *
     * @memberof Map#
     * @param {AnimationOptions} [options]
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires moveend
     * @returns {Map} `this`
     */
    snapToNorth(options, eventData) {
        if (Math.abs(this.getBearing()) < this._bearingSnap) {
            return this.resetNorth(options, eventData);
        }
        return this;
    }

    /**
     * Returns the map's current pitch (tilt).
     *
     * @memberof Map#
     * @returns {number} The map's current pitch, measured in degrees away from the plane of the screen.
     */
    getPitch() { return this.transform.pitch; }

    /**
     * Sets the map's pitch (tilt). Equivalent to `jumpTo({pitch: pitch})`.
     *
     * @memberof Map#
     * @param {number} pitch The pitch to set, measured in degrees away from the plane of the screen (0-60).
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires moveend
     * @returns {Map} `this`
     */
    setPitch(pitch, eventData) {
        this.jumpTo({pitch: pitch}, eventData);
        return this;
    }

    /**
     * Changes any combination of center, zoom, bearing, and pitch, without
     * an animated transition. The map will retain its current values for any
     * details not specified in `options`.
     *
     * @memberof Map#
     * @param {CameraOptions} options
     * @param {Object} [eventData] Data to propagate to any event listeners.
     * @fires movestart
     * @fires zoomstart
     * @fires move
     * @fires zoom
     * @fires rotate
     * @fires pitch
     * @fires zoomend
     * @fires moveend
     * @returns {Map} `this`
     */
    setCamera(cameraOptions, animationOptions, eventData) {
        this.stop();

        // get camera options
        animationOptions.type = animationOptions.type || 'none';
        cameraOptions = cameraOptions.bounds ? this._optionsFromBounds(cameraOptions) : this._defaultCameraOptions(cameraOptions);

        switch(animationOptions.type) {
            case 'fly':
                animationOptions = util.extend({
                    speed: 1.2,
                    curve: 1.42,
                    easing: util.ease
                }, animationOptions);
                this._animateFly(cameraOptions, animationOptions, eventData);
                break;
            case 'ease':
                animationOptions = util.extend({
                    duration: 500,
                    easing: util.ease
                }, animationOptions);
                this._animateEase(cameraOptions, animationOptions, eventData);
                break;
            case 'none':
            default:
                this._animateNone(cameraOptions, eventData);
                break;
        }        

    }

    /**
     * Returns the camera's current state
     *
     */
    getCamera() {
        return {
            center: this.getCenter(),
            zoom: this.getZoom(),
            bearing: this.getBearing(),
            pitch: this.getPitch(),
            bounds: this.getBounds()
        };
    }


    // no animation, just update the camera and events (this is the default animation for setCamera)
    _animateNone(cameraOptions, eventData) {

        const tr = this.transform;
        let zoomChanged = false,
            bearingChanged = false,
            pitchChanged = false;

        if ('zoom' in cameraOptions && tr.zoom !== +cameraOptions.zoom) {
            zoomChanged = true;
            tr.zoom = +cameraOptions.zoom;
        }

        if ('center' in cameraOptions) {
            tr.center = LngLat.convert(cameraOptions.center);
        }

        if ('bearing' in cameraOptions && tr.bearing !== +cameraOptions.bearing) {
            bearingChanged = true;
            tr.bearing = +cameraOptions.bearing;
        }

        if ('pitch' in cameraOptions && tr.pitch !== +cameraOptions.pitch) {
            pitchChanged = true;
            tr.pitch = +cameraOptions.pitch;
        }

        this.fire('movestart', eventData)
            .fire('move', eventData);

        if (zoomChanged) {
            this.fire('zoomstart', eventData)
                .fire('zoom', eventData)
                .fire('zoomend', eventData);
        }

        if (bearingChanged) {
            this.fire('rotate', eventData);
        }

        if (pitchChanged) {
            this.fire('pitch', eventData);
        }

        return this.fire('moveend', eventData);
    }

    // ease animation
    _animateEase(cameraOptions, animationOptions, eventData) {

        const tr = this.transform,
            offset = Point.convert(cameraOptions.offset),
            startZoom = this.getZoom(),
            startBearing = this.getBearing(),
            startPitch = this.getPitch(),

            zoom = 'zoom' in cameraOptions ? +cameraOptions.zoom : startZoom,
            bearing = 'bearing' in cameraOptions ? this._normalizeBearing(cameraOptions.bearing, startBearing) : startBearing,
            pitch = 'pitch' in cameraOptions ? +cameraOptions.pitch : startPitch;

        let toLngLat,
            toPoint;

        if ('center' in cameraOptions) {
            toLngLat = LngLat.convert(cameraOptions.center);
            toPoint = tr.centerPoint.add(offset);
        } else if ('around' in cameraOptions) {
            toLngLat = LngLat.convert(cameraOptions.around);
            toPoint = tr.locationPoint(toLngLat);
        } else {
            toPoint = tr.centerPoint.add(offset);
            toLngLat = tr.pointLocation(toPoint);
        }

        const fromPoint = tr.locationPoint(toLngLat);

        if (animationOptions.animate === false) animationOptions.duration = 0;

        this.zooming = (zoom !== startZoom);
        this.rotating = (startBearing !== bearing);
        this.pitching = (pitch !== startPitch);

        if (animationOptions.smoothEasing && animationOptions.duration !== 0) {
            animationOptions.easing = this._smoothOutEasing(animationOptions.duration);
        }

        if (!animationOptions.noMoveStart) {
            this.fire('movestart', eventData);
        }
        if (this.zooming) {
            this.fire('zoomstart', eventData);
        }

        clearTimeout(this._onEaseEnd);

        this._ease(function (k) {
            if (this.zooming) {
                tr.zoom = interpolate(startZoom, zoom, k);
            }

            if (this.rotating) {
                tr.bearing = interpolate(startBearing, bearing, k);
            }

            if (this.pitching) {
                tr.pitch = interpolate(startPitch, pitch, k);
            }

            tr.setLocationAtPoint(toLngLat, fromPoint.add(toPoint.sub(fromPoint)._mult(k)));

            this.fire('move', eventData);
            if (this.zooming) {
                this.fire('zoom', eventData);
            }
            if (this.rotating) {
                this.fire('rotate', eventData);
            }
            if (this.pitching) {
                this.fire('pitch', eventData);
            }
        }, () => {
            if (animationOptions.delayEndEvents) {
                this._onEaseEnd = setTimeout(this._easeToEnd.bind(this, eventData), animationOptions.delayEndEvents);
            } else {
                this._easeToEnd(eventData);
            }
        }, animationOptions);

        return this;
    }

    _easeToEnd(eventData) {
        const wasZooming = this.zooming;
        this.zooming = false;
        this.rotating = false;
        this.pitching = false;

        if (wasZooming) {
            this.fire('zoomend', eventData);
        }
        this.fire('moveend', eventData);

    }

    // `fly` animation type to evoke flight
    _animateFly(cameraOptions, animationOptions, eventData) {
        // This method implements an “optimal path” animation, as detailed in:
        //
        // Van Wijk, Jarke J.; Nuij, Wim A. A. “Smooth and efficient zooming and panning.” INFOVIS
        //   ’03. pp. 15–22. <https://www.win.tue.nl/~vanwijk/zoompan.pdf#page=5>.
        //
        // Where applicable, local variable documentation begins with the associated variable or
        // function in van Wijk (2003).
        const tr = this.transform,
            offset = Point.convert(cameraOptions.offset),
            startZoom = this.getZoom(),
            startBearing = this.getBearing(),
            startPitch = this.getPitch();

        const center = 'center' in cameraOptions ? LngLat.convert(cameraOptions.center) : this.getCenter();
        const zoom = 'zoom' in cameraOptions ?  +cameraOptions.zoom : startZoom;
        const bearing = 'bearing' in cameraOptions ? this._normalizeBearing(cameraOptions.bearing, startBearing) : startBearing;
        const pitch = 'pitch' in cameraOptions ? +cameraOptions.pitch : startPitch;

        // If a path crossing the antimeridian would be shorter, extend the final coordinate so that
        // interpolating between the two endpoints will cross it.
        if (Math.abs(tr.center.lng) + Math.abs(center.lng) > 180) {
            if (tr.center.lng > 0 && center.lng < 0) {
                center.lng += 360;
            } else if (tr.center.lng < 0 && center.lng > 0) {
                center.lng -= 360;
            }
        }

        const scale = tr.zoomScale(zoom - startZoom),
            from = tr.point,
            to = 'center' in cameraOptions ? tr.project(center).sub(offset.div(scale)) : from;

        const startWorldSize = tr.worldSize;
        let rho = animationOptions.curve;

            // w₀: Initial visible span, measured in pixels at the initial scale.
        const w0 = Math.max(tr.width, tr.height),
            // w₁: Final visible span, measured in pixels with respect to the initial scale.
            w1 = w0 / scale,
            // Length of the flight path as projected onto the ground plane, measured in pixels from
            // the world image origin at the initial scale.
            u1 = to.sub(from).mag();

        if ('minZoom' in animationOptions) {
            const minZoom = util.clamp(Math.min(animationOptions.minZoom, startZoom, zoom), tr.minZoom, tr.maxZoom);
            // w<sub>m</sub>: Maximum visible span, measured in pixels with respect to the initial
            // scale.
            const wMax = w0 / tr.zoomScale(minZoom - startZoom);
            rho = Math.sqrt(wMax / u1 * 2);
        }

        // ρ²
        const rho2 = rho * rho;

        /**
         * rᵢ: Returns the zoom-out factor at one end of the animation.
         *
         * @param i 0 for the ascent or 1 for the descent.
         * @private
         */
        function r(i) {
            const b = (w1 * w1 - w0 * w0 + (i ? -1 : 1) * rho2 * rho2 * u1 * u1) / (2 * (i ? w1 : w0) * rho2 * u1);
            return Math.log(Math.sqrt(b * b + 1) - b);
        }

        function sinh(n) { return (Math.exp(n) - Math.exp(-n)) / 2; }
        function cosh(n) { return (Math.exp(n) + Math.exp(-n)) / 2; }
        function tanh(n) { return sinh(n) / cosh(n); }

        // r₀: Zoom-out factor during ascent.
        const r0 = r(0);
            /**
             * w(s): Returns the visible span on the ground, measured in pixels with respect to the
             * initial scale.
             *
             * Assumes an angular field of view of 2 arctan ½ ≈ 53°.
             * @private
             */
        let w = function (s) { return (cosh(r0) / cosh(r0 + rho * s)); },
            /**
             * u(s): Returns the distance along the flight path as projected onto the ground plane,
             * measured in pixels from the world image origin at the initial scale.
             * @private
             */
            u = function (s) { return w0 * ((cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2) / u1; },
            // S: Total length of the flight path, measured in ρ-screenfuls.
            S = (r(1) - r0) / rho;

        // When u₀ = u₁, the optimal path doesn’t require both ascent and descent.
        if (Math.abs(u1) < 0.000001) {
            // Perform a more or less instantaneous transition if the path is too short.
            if (Math.abs(w0 - w1) < 0.000001) return this.setCamera(cameraOptions, util.extend({type: 'ease'}, animationOptions)); // TODO: this creates an endless loop

            const k = w1 < w0 ? -1 : 1;
            S = Math.abs(Math.log(w1 / w0)) / rho;

            u = function() { return 0; };
            w = function(s) { return Math.exp(k * rho * s); };
        }

        if ('duration' in animationOptions) {
            animationOptions.duration = +animationOptions.duration;
        } else {
            const V = 'screenSpeed' in animationOptions ? +animationOptions.screenSpeed / rho : +animationOptions.speed;
            animationOptions.duration = 1000 * S / V;
        }

        this.zooming = true;
        if (startBearing !== bearing) this.rotating = true;
        if (startPitch !== pitch) this.pitching = true;

        this.fire('movestart', eventData);
        this.fire('zoomstart', eventData);

        this._ease(function (k) {
            // s: The distance traveled along the flight path, measured in ρ-screenfuls.
            const s = k * S,
                us = u(s);

            tr.zoom = startZoom + tr.scaleZoom(1 / w(s));
            tr.center = tr.unproject(from.add(to.sub(from).mult(us)), startWorldSize);

            if (this.rotating) {
                tr.bearing = interpolate(startBearing, bearing, k);
            }
            if (this.pitching) {
                tr.pitch = interpolate(startPitch, pitch, k);
            }

            this.fire('move', eventData);
            this.fire('zoom', eventData);
            if (this.rotating) {
                this.fire('rotate', eventData);
            }
            if (this.pitching) {
                this.fire('pitch', eventData);
            }
        }, function() {
            this.zooming = false;
            this.rotating = false;
            this.pitching = false;

            this.fire('zoomend', eventData);
            this.fire('moveend', eventData);
        }, animationOptions);

        return this;
    }

    isEasing() {
        return !!this._abortFn;
    }

    /**
     * Stops any animated transition underway.
     *
     * @memberof Map#
     * @returns {Map} `this`
     */
    stop() {
        if (this._abortFn) {
            this._abortFn();
            this._finishEase();
        }
        return this;
    }

    // used to calculate camera options based on a LatLngBounds object
    _optionsFromBounds(cameraOptions) {
        cameraOptions = util.extend({
            padding: 0,
            offset: [0, 0],
            maxZoom: Infinity
        }, cameraOptions);

        const bounds = LngLatBounds.convert(cameraOptions.bounds);

        const offset = Point.convert(cameraOptions.offset),
            tr = this.transform,
            nw = tr.project(bounds.getNorthWest()),
            se = tr.project(bounds.getSouthEast()),
            size = se.sub(nw),
            scaleX = (tr.width - cameraOptions.padding * 2 - Math.abs(offset.x) * 2) / size.x,
            scaleY = (tr.height - cameraOptions.padding * 2 - Math.abs(offset.y) * 2) / size.y;

        cameraOptions.center = tr.unproject(nw.add(se).div(2));
        cameraOptions.zoom = Math.min(tr.scaleZoom(tr.scale * Math.min(scaleX, scaleY)), cameraOptions.maxZoom);
        cameraOptions.bearing = 0;
        return cameraOptions;
    }

    // default camera options
    _defaultCameraOptions(cameraOptions) {
        return cameraOptions = util.extend({
            offset: [0 ,0]
        }, cameraOptions);
    }

    _ease(frame, finish, animationOptions) {
        this._finishFn = finish;
        this._abortFn = browser.timed(function (t) {
            frame.call(this, animationOptions.easing(t));
            if (t === 1) {
                this._finishEase();
            }
        }, animationOptions.animate === false ? 0 : animationOptions.duration, this);
    }

    _finishEase() {
        delete this._abortFn;
        // The finish function might emit events which trigger new eases, which
        // set a new _finishFn. Ensure we don't delete it unintentionally.
        const finish = this._finishFn;
        delete this._finishFn;
        finish.call(this);
    }

    // convert bearing so that it's numerically close to the current one so that it interpolates properly
    _normalizeBearing(bearing, currentBearing) {
        bearing = util.wrap(bearing, -180, 180);
        const diff = Math.abs(bearing - currentBearing);
        if (Math.abs(bearing - 360 - currentBearing) < diff) bearing -= 360;
        if (Math.abs(bearing + 360 - currentBearing) < diff) bearing += 360;
        return bearing;
    }

    // only used on mouse-wheel zoom to smooth out animation
    _smoothOutEasing(duration) {
        let easing = util.ease;

        if (this._prevEase) {
            const ease = this._prevEase,
                t = (Date.now() - ease.start) / ease.duration,
                speed = ease.easing(t + 0.01) - ease.easing(t),

                // Quick hack to make new bezier that is continuous with last
                x = 0.27 / Math.sqrt(speed * speed + 0.0001) * 0.01,
                y = Math.sqrt(0.27 * 0.27 - x * x);

            easing = util.bezier(x, y, 0.25, 1);
        }

        this._prevEase = {
            start: (new Date()).getTime(),
            duration: duration,
            easing: easing
        };

        return easing;
    }

}

/**
 * Fired whenever the map's pitch (tilt) changes.
 *
 * @event pitch
 * @memberof Map
 * @instance
 * @property {MapEventData} data
 */

module.exports = Camera;
