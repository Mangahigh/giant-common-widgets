/*global giant, jQuery */
$oop.postpone(giant, 'Label', function (ns, className, /**jQuery*/$) {
    "use strict";

    var base = giant.Widget,
        self = base.extend(className);

    /**
     * Creates a Label instance.
     * @name giant.Label.create
     * @function
     * @returns {giant.Label}
     */

    /**
     * Displays text, optionally HTML escaped, based on a string literal or stringifiable object.
     * @class
     * @extends giant.Widget
     */
    giant.Label = self
        .addPrivateMethods(/** @lends giant.Label# */{
            /**
             * Updates Label's CSS classes based on its content.
             * @private
             */
            _updateLabelStyle: function () {
                var labelText = giant.Stringifier.stringify(this.labelText);
                if (labelText) {
                    this
                        .removeCssClass('no-text')
                        .addCssClass('has-text');
                } else {
                    this
                        .removeCssClass('has-text')
                        .addCssClass('no-text');
                }
            },

            /** @private */
            _updateLabelDom: function () {
                var element = this.getElement(),
                    currentLabelText;

                if (element) {
                    currentLabelText = giant.Stringifier.stringify(this.labelText);
                    $(element).html(this.htmlEscaped ?
                        currentLabelText.toHtml() :
                        currentLabelText);
                }
            }
        })
        .addMethods(/** @lends giant.Label# */{
            /** @ignore */
            init: function () {
                base.init.call(this);

                /**
                 * Text or text provider associated with Label.
                 * @type {string|object}
                 */
                this.labelText = undefined;

                /**
                 * Whether label HTML escapes text before rendering.
                 * @type {boolean}
                 */
                this.htmlEscaped = true;

                this.setTagName('span');

                this._updateLabelStyle();
            },

            /** @ignore */
            contentMarkup: function () {
                var currentLabelText = giant.Stringifier.stringify(this.labelText);
                return this.htmlEscaped ?
                    currentLabelText.toHtml() :
                    currentLabelText;
            },

            /**
             * Sets flag that determines whether label will HTML escape text before rendering.
             * Use with care: script embedded in labelText might compromise security!
             * @param {boolean} htmlEscaped
             * @returns {giant.Label}
             */
            setHtmlEscaped: function (htmlEscaped) {
                this.htmlEscaped = htmlEscaped;
                this._updateLabelDom();
                return this;
            },

            /**
             * Sets text to display on label. Accepts strings or objects that implement .toString().
             * Displayed text will be HTML encoded.
             * @param {string|object} labelText
             * @returns {giant.Label}
             */
            setLabelText: function (labelText) {
                this.labelText = labelText;
                this._updateLabelDom();
                this._updateLabelStyle();
                return this;
            }
        });
}, jQuery);
