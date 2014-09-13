/*global dessert, troop, sntls, evan, shoeshine, jQuery, candystore */
troop.postpone(candystore, 'Form', function (ns, className) {
    "use strict";

    var base = shoeshine.Widget,
        self = base.extend(className)
            .addTrait(shoeshine.JqueryWidget);

    /**
     * Creates a Form instance.
     * @name candystore.Form.create
     * @function
     * @returns {candystore.Form}
     */

    /**
     * The Form encloses multiple FormField's, provides validity events for the entire form,
     * and supports submitting the form.
     * @class
     * @extends shoeshine.Widget
     * @extends shoeshine.JqueryWidget
     */
    candystore.Form = self
        .addConstants(/** @lends candystore.Form */{
            /** @constant */
            EVENT_FORM_VALID: 'form-valid',

            /** @constant */
            EVENT_FORM_INVALID: 'form-invalid',

            /** @constant */
            EVENT_FORM_SUBMIT: 'form-submit'
        })
        .addPrivateMethods(/** @lends candystore.Form# */{
            /** @private */
            _updateCounters: function () {
                var formFields = this.getFormFields(),
                    validFieldNames = formFields
                        .callOnEachItem('getInputWidget')
                        .callOnEachItem('isValid')
                        .toStringDictionary()
                        .reverse()
                        .getItem('true');

                this.fieldCount = formFields.getKeyCount();
                this.validFieldCount = validFieldNames ?
                    validFieldNames.length :
                    0;
            },

            /**
             * @param {boolean} wasValid
             * @private
             */
            _triggerValidityEvent: function (wasValid) {
                var isValid = this.isValid();

                if (isValid && !wasValid) {
                    this.triggerSync(this.EVENT_FORM_INVALID);
                } else if (!isValid && wasValid) {
                    this.triggerSync(this.EVENT_FORM_VALID);
                }
            },

            /** @private */
            _triggerSubmissionEvent: function () {
                if (this.validFieldCount === this.fieldCount) {
                    this.triggerSync(this.EVENT_FORM_SUBMIT);
                }
            }
        })
        .addMethods(/** @lends candystore.Form# */{
            /** @ignore */
            init: function () {
                base.init.call(this);
                this.setTagName('form');

                this
                    .elevateMethod('onInputSubmit')
                    .elevateMethod('onInputValid')
                    .elevateMethod('onInputInvalid');

                /**
                 * Total number of fields in the form.
                 * @type {number}
                 */
                this.fieldCount = undefined;

                /**
                 * Total number of valid fields in the form. Equal or less than .fieldCount.
                 * @type {number}
                 */
                this.validFieldCount = undefined;
            },

            /** @ignore */
            afterAdd: function () {
                base.afterAdd.call(this);

                this._updateCounters();

                this
                    .subscribeTo(candystore.Input.EVENT_INPUT_SUBMIT, this.onInputSubmit)
                    .subscribeTo(candystore.Input.EVENT_INPUT_VALID, this.onInputValid)
                    .subscribeTo(candystore.Input.EVENT_INPUT_INVALID, this.onInputInvalid);
            },

            /** @ignore */
            afterRender: function () {
                base.afterRender.call(this);
                this.focusOnFirstField();
            },

            /**
             * @returns {string}
             * @ignore
             */
            contentMarkup: function () {
                return [
                    //@formatter:off
                    '<ul class="inputs-container">',
                    this.children,
                    '</ul>'
                    //@formatter:on
                ].join('');
            },

            /**
             * Determines whether the form is valid. The form is valid when and only when all of its fields are valid.
             * @returns {boolean}
             */
            isValid: function () {
                return this.validFieldCount === this.fieldCount;
            },

            /**
             * Adds a field to the form.
             * @param {candystore.FormField} formField
             * @returns {candystore.Form}
             */
            addFormField: function (formField) {
                dessert
                    .isFormField(formField, "Invalid form field")
                    .assert(!this.getChild(formField.childName), "Specified field already exists");

                formField
                    .setTagName('li')
                    .setContainerCssClass('inputs-container')
                    .addToParent(this);

                this.fieldCount++;

                if (formField.getInputWidget().isValid()) {
                    this.validFieldCount++;
                }

                return this;
            },

            /**
             * Fetches the field with the specified name from the form.
             * TODO: make sure returned value is either FormField instance or undefined
             * @param {string} fieldName
             * @returns {candystore.FormField}
             */
            getFormField: function (fieldName) {
                return this.getChild(fieldName);
            },

            /**
             * Fetches all form field widgets as a WidgetCollection.
             * @returns {shoeshine.WidgetCollection}
             */
            getFormFields: function () {
                return this.children.filterByType(candystore.FormField);
            },

            /**
             * Attempts to submit form. It is up to the parent widget to handle the submit event
             * and actually submit the form. (It may not be necessary to submit anything to a server,
             * but rather take some other action.)
             * @returns {candystore.Form}
             */
            trySubmittingForm: function () {
                this._triggerSubmissionEvent();
                return this;
            },

            /**
             * Puts focus on first field of the form.
             * @returns {candystore.Form}
             */
            focusOnFirstField: function () {
                var firstField = this.children
                    .filterByType(candystore.FormField)
                    .getSortedValues()[0];

                if (firstField) {
                    firstField.focusOnField();
                }

                return this;
            },

            /**
             * @param {shoeshine.WidgetEvent} event
             * @ignore
             */
            onInputSubmit: function (event) {
                this
                    .setNextOriginalEvent(event)
                    .trySubmittingForm()
                    .clearNextOriginalEvent();
            },

            /**
             * @param {shoeshine.WidgetEvent} event
             * @ignore
             */
            onInputValid: function (event) {
                var wasValid = this.isValid();

                this.validFieldCount++;
                this.setNextOriginalEvent(event);
                this._triggerValidityEvent(wasValid);
                this.clearNextOriginalEvent();
            },

            /**
             * @param {shoeshine.WidgetEvent} event
             * @ignore
             */
            onInputInvalid: function (event) {
                var wasValid = this.isValid();

                this.validFieldCount--;
                this.setNextOriginalEvent(event);
                this._triggerValidityEvent(wasValid);
                this.clearNextOriginalEvent();
            },

            /**
             * @param {jQuery.Event} event
             * @ignore
             */
            onSubmit: function (event) {
                // suppressing native form submission
                event.preventDefault();
            }
        });

    self.on('submit', '', 'onSubmit');
});

(function () {
    "use strict";

    dessert.addTypes(/** @lends dessert */{
        isForm: function (expr) {
            return candystore.Form.isBaseOf(expr);
        },

        isFormOptional: function (expr) {
            return expr === undefined ||
                   candystore.Form.isBaseOf(expr);
        }
    });
}());
