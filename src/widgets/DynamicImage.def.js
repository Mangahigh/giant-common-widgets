/*global giant, jQuery */
giant.postpone(giant, 'DynamicImage', function (ns, className, /**jQuery*/$) {
    "use strict";

    var base = giant.Image,
        self = base.extend(className);

    /**
     * Creates a DynamicImage instance.
     * @name giant.DynamicImage.create
     * @function
     * @returns {giant.DynamicImage}
     */

    /**
     * The DynamicImage is an Image that loads images dynamically, and triggers appropriate events
     * at relevant stages of the loading process. No longer is an <em>img</em> tag in itself, but wraps
     * an image tag that may or may not be present, depending on loading success. The image will not load sooner than
     * the widget is rendered.
     * @class
     * @extends giant.Image
     */
    giant.DynamicImage = self
        .addPrivateMethods(/** @lends giant.DynamicImage# */{
            /** @private */
            _updateImageElement: function () {
                var element = this.getElement(),
                    oldImageElement,
                    newImageElement;

                if (element) {
                    oldImageElement = $(element).children('img');
                    newImageElement = this.imageElement;

                    if (oldImageElement.length) {
                        oldImageElement.replaceWith(newImageElement);
                    } else {
                        $(element).append(newImageElement);
                    }
                }
            },

            /**
             * @param {HTMLImageElement} imageElement
             * @private
             */
            _setImageElement: function (imageElement) {
                this.imageElement = imageElement;
                this._updateImageElement();
            }
        })
        .addMethods(/** @lends giant.DynamicImage# */{
            /** @ignore */
            init: function () {
                base.init.call(this);

                this
                    .setTagName('div')
                    .elevateMethod('onImageLoadStart')
                    .elevateMethod('onImageLoadSuccess')
                    .elevateMethod('onImageLoadFailure');

                /**
                 * HTML image element associated with Image widget.
                 * @type {HTMLImageElement}
                 */
                this.imageElement = undefined;

                /**
                 * Transport-level Image instance associated with Image widget.
                 * @type {giant.Image}
                 */
                this.image = undefined;
            },

            /** @ignore */
            afterRender: function () {
                base.afterRender.call(this);
                this._updateImageElement();
            },

            /**
             * Sets image URL. Initiates loading of image when necessary, and subscribes widget
             * to image loading events on the specified URL.
             * @param {giant.ImageUrl} imageUrl ImageUrl instance.
             * @returns {giant.DynamicImage}
             */
            setImageUrl: function (imageUrl) {
                giant.isLocation(imageUrl, "Invalid image URL");

                var oldImageUrl = this.imageUrl;

                if (!imageUrl.equals(oldImageUrl)) {
                    if (oldImageUrl) {
                        oldImageUrl
                            .unsubscribeFrom(giant.EVENT_IMAGE_LOAD_START, this.onImageLoadStart)
                            .unsubscribeFrom(giant.EVENT_IMAGE_LOAD_SUCCESS, this.onImageLoadSuccess)
                            .unsubscribeFrom(giant.EVENT_IMAGE_LOAD_FAILURE, this.onImageLoadFailure);
                    }

                    imageUrl
                        .subscribeTo(giant.EVENT_IMAGE_LOAD_START, this.onImageLoadStart)
                        .subscribeTo(giant.EVENT_IMAGE_LOAD_SUCCESS, this.onImageLoadSuccess)
                        .subscribeTo(giant.EVENT_IMAGE_LOAD_FAILURE, this.onImageLoadFailure);

                    this.imageUrl = imageUrl;

                    this.image = imageUrl.toImageLoader()
                        .loadImage();
                }

                return this;
            },

            /**
             * @ignore
             */
            onImageLoadStart: function () {
                this.triggerSync(giant.EVENT_IMAGE_LOAD_START);
            },

            /**
             * @ignore
             */
            onImageLoadSuccess: function () {
                this._setImageElement(event.imageElement);
                this.triggerSync(giant.EVENT_IMAGE_LOAD_SUCCESS);
            },

            /**
             * @ignore
             */
            onImageLoadFailure: function () {
                this.triggerSync(giant.EVENT_IMAGE_LOAD_FAILURE);
            }
        });
}, jQuery);

(function () {
    "use strict";

    giant.addGlobalConstants(/** @lends giant */{
        /**
         * Signals that an Image started to load.
         * @constant
         */
        EVENT_DYNAMIC_IMAGE_LOAD_START: 'giant.load.start.image.dynamic',

        /**
         * Signals that an Image finished loading.
         * @constant
         */
        EVENT_DYNAMIC_IMAGE_LOAD_SUCCESS: 'giant.load.success.image.dynamic',

        /**
         * Signals that an Image failed loading.
         * @constant
         */
        EVENT_DYNAMIC_IMAGE_LOAD_FAILURE: 'giant.load.failure.image.dynamic'
    });
}());