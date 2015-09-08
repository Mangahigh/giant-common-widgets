/*global giant, jQuery */
giant.postpone(giant, 'Button', function (ns, className, /**jQuery*/$) {
    "use strict";

    var base = giant.Widget,
        self = base.extend(className)
            .addTraitAndExtend(giant.BinaryStateful)
            .addTrait(giant.Disableable);

    /**
     * Creates a Button instance.
     * @name giant.Button.create
     * @function
     * @returns {giant.Button}
     */

    /**
     * General purpose button widget.
     * Supports disabling and click events.
     * @class
     * @extends giant.Widget
     * @extends giant.BinaryStateful
     * @extends giant.Disableable
     */
    giant.Button = self
        .addConstants(/** @lends giant.Button */{
            /** @constants */
            EVENT_BUTTON_CLICK: 'button-click'
        })
        .addMethods(/** @lends giant.Button# */{
            /** @ignore */
            init: function () {
                base.init.call(this);
                giant.BinaryStateful.init.call(this);
                giant.Disableable.init.call(this);

                this.elevateMethod('onClick');
            },

            /** @ignore */
            afterAdd: function () {
                base.afterAdd.call(this);
                giant.BinaryStateful.afterAdd.call(this);
            },

            /** @ignore */
            afterRender: function () {
                base.afterRender.call(this);
                $(this.getElement())
                    .on('click', this.onClick);
            },

            /** @ignore */
            afterRemove: function () {
                base.afterRemove.call(this);
                giant.BinaryStateful.afterRemove.call(this);
            },

            /**
             * Clicks the button.
             * @returns {giant.Button}
             */
            clickButton: function () {
                if (!this.isDisabled()) {
                    this.triggerSync(this.EVENT_BUTTON_CLICK);
                }
                return this;
            },

            /**
             * @ignore
             */
            onClick: function () {
                this.clickButton();
            }
        });
}, jQuery);
