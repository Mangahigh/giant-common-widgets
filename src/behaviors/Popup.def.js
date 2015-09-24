/*global giant, jQuery, UIEvent */
giant.postpone(giant, 'Popup', function (ns, className, /**jQuery*/$) {
    "use strict";

    var base = giant.Base,
        self = base.extend(),
        $document = document && $(document);

    /**
     * The Popup trait allows widgets to be opened and closed like popups.
     * Popups maintain parent-children relationship with the widget that created them,
     * but they are rendered right under the body element. It is vital therefore that whatever happens inside
     * the popup must trigger widget events since they are the only way to notify the parent widget of changes.
     * Popups may be closed by clicking outside of the widget's DOM.
     * Expects to be added to Widget classes.
     * @class
     * @extends giant.Base
     * @extends giant.Widget
     */
    giant.Popup = self
        .addPrivateMethods(/** @lends giant.Popup# */{
            /**
             * @param {boolean} a
             * @param {boolean} b
             * @returns {boolean}
             * @memberOf giant.Popup
             * @private
             */
            _or: function (a, b) {
                return a || b;
            },

            /**
             * @param {jQuery} $element
             * @param {string} selector
             * @returns {boolean}
             * @memberOf giant.Popup
             * @private
             */
            _hasClosest: function ($element, selector) {
                return $element.closest(selector).length > 0;
            },

            /** @private */
            _removeFromDom: function () {
                var element = this.getElement();
                if (element) {
                    $(element).remove();
                }
            },

            /**
             * @param {jQuery} $element
             * @returns {boolean}
             * @private
             */
            _isOutside: function ($element) {
                var element;
                if (this.outsideSelectors
                        .mapValues(this._hasClosest.bind(this, $element))
                        .getValues()
                        .reduce(this._or, false)
                ) {
                    return true;
                } else if (this.insideSelectors
                        .mapValues(this._hasClosest.bind(this, $element))
                        .getValues()
                        .reduce(this._or, false)
                ) {
                    return false;
                } else {
                    element = this.getElement();
                    return element && !$element.closest(element).length;
                }
            },

            /**
             * @returns {UIEvent}
             * @private
             */
            _getLastUiEvent: function () {
                var lastEvent = window && giant.originalEventStack.getLastEvent();
                return lastEvent && giant.Event.isBaseOf(lastEvent) ?
                    lastEvent.getOriginalEventByType(UIEvent) :
                    undefined;
            }
        })
        .addMethods(/** @lends giant.Popup# */{
            /**
             * Call from host's init.
             */
            init: function () {
                this
                    .elevateMethod('onBodyClick')
                    .elevateMethod('onOutsideClick');

                /** @type {boolean} */
                this.isOpen = false;

                /** @type {giant.Collection} */
                this.outsideSelectors = giant.Collection.create();

                /** @type {giant.Collection} */
                this.insideSelectors = giant.Collection.create();

                /**
                 * DOM Event that led to opening the popup.
                 * @type {UIEvent}
                 */
                this.openUiEvent = undefined;
            },

            /**
             * Overrides rendering, ensuring that popups get only rendered inside the document body.
             * This override is supposed to overshadow Widget's implementation.
             * @param {HTMLElement} element
             * @returns {giant.Popup}
             */
            renderInto: function (element) {
                if (element === document.body) {
                    giant.Widget.renderInto.call(this, element);
                }
                return this;
            },

            /**
             * Call from host class' afterAdd.
             */
            afterAdd: function () {
                this.subscribeTo(giant.EVENT_POPUP_OUTSIDE_CLICK, this.onOutsideClick);
            },

            /**
             * Call from host class' afterRemove.
             */
            afterRemove: function () {
                this.unsubscribeFrom(giant.EVENT_POPUP_OUTSIDE_CLICK);

                // removing DOM in case popup was removed via its parent with
                // which does not contain the DOM of the popup
                this._removeFromDom();

                // unsubscribing from global click event
                $document.off('click', this.onBodyClick);

                this.openUiEvent = undefined;
            },

            /**
             * Call from host class' afterRender.
             */
            afterRender: function () {
                $document
                    .off('click', this.onBodyClick)
                    .on('click', this.onBodyClick);
            },

            /**
             * Opens popup. Popup must be added to a parent before calling this method.
             * @returns {giant.Popup}
             */
            openPopup: function () {
                giant.assert(this.parent, "Popup has no parent");

                if (!this.isOpen) {
                    this.openUiEvent = this._getLastUiEvent();

                    this.renderInto(document.body);

                    this.isOpen = true;

                    this.triggerSync(giant.EVENT_POPUP_OPEN);
                }

                return this;
            },

            /**
             * Closes popup, and removes it from the widget hierarchy.
             * @returns {giant.Popup}
             */
            closePopup: function () {
                var openUiEvent = this.openUiEvent,
                    isClosedBySameEvent = openUiEvent && openUiEvent === this._getLastUiEvent();

                if (this.isOpen && !isClosedBySameEvent) {
                    // must set flag before triggering event
                    // otherwise event handlers would see mixed state
                    // (event says it's closed, but widget state says it's open)
                    this.isOpen = false;

                    // must trigger before removing widget from hierarchy
                    // otherwise event won't bubble
                    this.triggerSync(giant.EVENT_POPUP_CLOSE);

                    this.removeFromParent();
                }

                return this;
            },

            /**
             * Treats DOM elements matching the specified global jQuery selector as inside of the popup.
             * Clicking on such elements would not trigger an 'outside-click' event even when they're outside of the
             * popup's DOM.
             * @param {string} globalSelector
             * @returns {giant.Popup}
             */
            treatAsInside: function (globalSelector) {
                if (this.outsideSelectors.getItem(globalSelector)) {
                    this.outsideSelectors.deleteItem(globalSelector);
                }
                this.insideSelectors.setItem(globalSelector, globalSelector);
                return this;
            },

            /**
             * Treats DOM elements matching the specified global jQuery selector as outside of the popup.
             * Clicking on such elements would trigger an 'outside-click' event even when they're inside the popup's DOM.
             * @param {string} selector
             * @returns {giant.Popup}
             */
            treatAsOutside: function (selector) {
                if (this.insideSelectors.getItem(selector)) {
                    this.insideSelectors.deleteItem(selector);
                }
                this.outsideSelectors.setItem(selector, selector);
                return this;
            },

            /**
             * Default outside click handler
             * @ignore
             */
            onOutsideClick: function () {
                this.closePopup();
            },

            /**
             * @param {UIEvent} event
             * @ignore
             */
            onBodyClick: function (event) {
                var link = giant.pushOriginalEvent(event);
                if (this._isOutside($(event.target))) {
                    this.triggerSync(giant.EVENT_POPUP_OUTSIDE_CLICK);
                }
                link.unlink();
            }
        });
}, jQuery);

(function () {
    "use strict";

    giant.addGlobalConstants(/** @lends giant */{
        /**
         * Signals that the user clicked outside an open Popup.
         * @constant
         */
        EVENT_POPUP_OUTSIDE_CLICK: 'widget.click.popup.outside',

        /**
         * Signals that a Popup was opened.
         * @constant
         */
        EVENT_POPUP_OPEN: 'widget.open.on.popup',

        /**
         * Signals tha a Popup was closed.
         * @constant
         */
        EVENT_POPUP_CLOSE: 'widget.open.off.popup'
    });
}());
