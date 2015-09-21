/*global giant */
giant.postpone(giant, 'Image', function (ns, className) {
    "use strict";

    var base = giant.Widget,
        self = base.extend(className);

    /**
     * Creates an Image instance.
     * @name giant.Image.create
     * @function
     * @returns {giant.Image}
     */

    /**
     * The Image displays an <em>img</em> tag.
     * @class
     * @extends giant.Widget
     */
    giant.Image = self
        .addMethods(/** @lends giant.Image# */{
            /** @ignore */
            init: function () {
                base.init.call(this);
                this.setTagName('img');

                /** @type {giant.ImageUrl} */
                this.imageUrl = undefined;
            },

            /**
             * Sets absolute image URL.
             * @param {giant.ImageUrl} imageUrl ImageUrl instance.
             * @example
             * image.setImageUrl('http://httpcats.herokuapp.com/418'.toImageUrl())
             * @returns {giant.Image}
             */
            setImageUrl: function (imageUrl) {
                giant.isLocation(imageUrl, "Invalid image URL");
                this.addAttribute('src', imageUrl.toString());
                this.imageUrl = imageUrl;
                return this;
            }
        });
});