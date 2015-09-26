$oop.postpone($commonWidgets, 'OptionList', function () {
    "use strict";

    var base = $oop.Base,
        self = base.extend();

    /**
     * The OptionList trait modifies List classes so that they can be used in dropdowns.
     * Should only accept widgets as list items that implement the Option trait.
     * Whatever uses the OptionList should take care of initializing the focused and selected states in afterAdd.
     * The OptionList returns to its neutral state after being removed from the hierarchy.
     * @class
     * @extends $oop.Base
     * @extends $commonWidgets.List
     */
    $commonWidgets.OptionList = self
        .addPrivateMethods(/** @lends $commonWidgets.OptionList# */{
            /**
             * @param {string} optionName
             * @param {*} optionValue
             * @private
             */
            _triggerSelectEvent: function (optionName, optionValue) {
                this.spawnEvent($commonWidgets.EVENT_OPTION_SELECT)
                    .setPayloadItems({
                        optionName : optionName,
                        optionValue: optionValue
                    })
                    .triggerSync();
            },

            /**
             * @param {string} newFocusedOptionName
             * @private
             */
            _setFocusedOptionName: function (newFocusedOptionName) {
                var oldFocusedOptionName = this.focusedOptionName,
                    oldFocusedOption;
                if (oldFocusedOptionName !== newFocusedOptionName) {
                    oldFocusedOption = this.getChild(oldFocusedOptionName);
                    if (oldFocusedOption) {
                        // old focused option might not be a child anymore
                        oldFocusedOption.markAsBlurred();
                    }
                    this.focusedOptionName = newFocusedOptionName;
                }
            },

            /**
             * @param {string} newActiveOptionName
             * @private
             */
            _setActiveOptionName: function (newActiveOptionName) {
                var oldActiveOptionName = this.activeOptionName,
                    oldActiveOption;
                if (oldActiveOptionName !== newActiveOptionName) {
                    oldActiveOption = this.getChild(oldActiveOptionName);
                    if (oldActiveOption) {
                        // old active option might not be a child anymore
                        oldActiveOption.markAsInactive();
                    }
                    this.activeOptionName = newActiveOptionName;
                }
            },

            /**
             * Looks into current options and sets active option name.
             * @private
             */
            _updateFocusedOptionName: function () {
                var focusedOption = this.getFocusedOption();
                if (focusedOption) {
                    this.focusedOptionName = focusedOption.childName;
                }
            },

            /**
             * Looks into current options and sets active option name.
             * @private
             */
            _updateActiveOptionName: function () {
                var selectedOption = this.getSelectedOption();
                if (selectedOption) {
                    this.activeOptionName = selectedOption.childName;
                }
            },

            /**
             * Focuses on the first available option.
             * @private
             */
            _focusOnOption: function () {
                var focusedOption = this.getFocusedOption() ||
                    this.getSelectedOption() ||
                    this.children.getFirstValue();

                if (focusedOption) {
                    // there is a suitable option to focus on
                    focusedOption.markAsFocused();
                }
            }
        })
        .addMethods(/** @lends $commonWidgets.OptionList# */{
            /** Call from host's init. */
            init: function () {
                this
                    .elevateMethod('onItemsChange')
                    .elevateMethod('onHotKeyPress')
                    .elevateMethod('onOptionFocus')
                    .elevateMethod('onOptionActive')
                    .elevateMethod('onOptionSelect');

                /**
                 * Identifier of option in focus.
                 * Name of corresponding child (item) widget.
                 * @type {string}
                 */
                this.focusedOptionName = undefined;

                /**
                 * Identifier of active option.
                 * Name of corresponding child widget.
                 * @type {string}
                 */
                this.activeOptionName = undefined;
            },

            /** Call from host's afterAdd. */
            afterAdd: function () {
                this
                    .subscribeTo($commonWidgets.EVENT_LIST_ITEMS_CHANGE, this.onItemsChange)
                    .subscribeTo($commonWidgets.EVENT_HOT_KEY_DOWN, this.onHotKeyPress)
                    .subscribeTo($commonWidgets.EVENT_OPTION_FOCUS, this.onOptionFocus)
                    .subscribeTo($commonWidgets.EVENT_OPTION_ACTIVE, this.onOptionActive)
                    .subscribeTo($commonWidgets.EVENT_OPTION_SELECT, this.onOptionSelect);

                this._focusOnOption();
                this._updateFocusedOptionName();
                this._updateActiveOptionName();
            },

            /** @ignore */
            afterRemove: function () {
                // destructing widget state
                var focusedOption = this.getFocusedOption(),
                    selectedOption = this.getSelectedOption();

                if (focusedOption) {
                    focusedOption.markAsBlurred();
                }
                if (selectedOption) {
                    selectedOption.markAsInactive();
                }

                this.focusedOptionName = undefined;
                this.activeOptionName = undefined;
            },

            /**
             * Fetches option widget based on its option value.
             * TODO: maintain an lookup of option values -> option widgets.
             * @param {*} optionValue
             * @returns {$commonWidgets.Option}
             */
            getOptionByValue: function (optionValue) {
                return this.children
                    .filterBySelector(function (option) {
                        return option.optionValue === optionValue;
                    })
                    .getFirstValue();
            },

            /**
             * Fetches currently focused option, or an arbitrary option if none focused.
             * @returns {$commonWidgets.Option}
             */
            getFocusedOption: function () {
                return this.children.filterBySelector(
                    function (option) {
                        return option.isFocused();
                    })
                    .getFirstValue();
            },

            /**
             * Fetches option that is currently selected, or undefined.
             * @returns {$commonWidgets.Option}
             */
            getSelectedOption: function () {
                return this.children.filterBySelector(
                    function (option) {
                        return option.isActive();
                    })
                    .getFirstValue();
            },

            /**
             * Selects an option on the list.
             * @param {string} optionName
             * @returns {$commonWidgets.OptionList}
             */
            selectOption: function (optionName) {
                var option = this.getChild(optionName);
                $assertion.assert(!!option, "Invalid option name");
                option.markAsActive();

                return this;
            },

            /**
             * @ignore
             */
            onItemsChange: function () {
                this._focusOnOption();
                this._updateFocusedOptionName();
            },

            /**
             * TODO: break up into smaller methods
             * @param {$widget.WidgetEvent} event
             * @ignore
             */
            onHotKeyPress: function (event) {
                var charCode = event.payload.charCode,
                    children = this.children,
                    sortedChildNames = children.getKeys().sort(),
                    currentChildIndex = sortedChildNames.indexOf(this.focusedOptionName),
                    newFocusedOptionName;

                switch (charCode) {
                case 38: // up
                    currentChildIndex = Math.max(currentChildIndex - 1, 0);
                    newFocusedOptionName = sortedChildNames[currentChildIndex];
                    this.getChild(newFocusedOptionName)
                        .markAsFocused();
                    break;

                case 40: // down
                    currentChildIndex = Math.min(currentChildIndex + 1, sortedChildNames.length - 1);
                    newFocusedOptionName = sortedChildNames[currentChildIndex];
                    this.getChild(newFocusedOptionName)
                        .markAsFocused();
                    break;

                case 27: // esc
                    this.triggerSync($commonWidgets.EVENT_OPTIONS_ESCAPE);
                    break;

                case 13: // enter
                    this.getChild(this.focusedOptionName)
                        .markAsActive();
                    break;
                }
            },

            /**
             * @param {$widget.WidgetEvent} event
             * @ignore
             */
            onOptionFocus: function (event) {
                var newFocusedOptionName = event.sender.childName;
                this._setFocusedOptionName(newFocusedOptionName);
            },

            /**
             * @param {$widget.WidgetEvent} event
             * @ignore
             */
            onOptionActive: function (event) {
                var optionWidget = event.sender;
                this._triggerSelectEvent(optionWidget.childName, optionWidget.optionValue);
            },

            /**
             * @param {$widget.WidgetEvent} event
             * @ignore
             */
            onOptionSelect: function (event) {
                var optionName = event.payload.optionName;
                this._setActiveOptionName(optionName);
            }
        });
});

(function () {
    "use strict";

    $oop.addGlobalConstants.call($commonWidgets, /** @lends $commonWidgets */{
        /**
         * Signals that an Option was selected.
         * @constant
         */
        EVENT_OPTION_SELECT: 'widget.select.on.option',

        /**
         * Signals that ESC was pressed while an Option is in focus.
         * @constant
         */
        EVENT_OPTIONS_ESCAPE: 'widget.select.off.option'
    });
}());
