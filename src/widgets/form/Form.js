/*global giant, giant, giant, giant, giant, jQuery, giant */
giant.postpone(giant, 'Form', function (ns, className, /**jQuery*/$) {
    "use strict";

    var base = giant.Widget,
        self = base.extend(className)
            .addTraitAndExtend(giant.BinaryStateful)
            .addTrait(giant.Disableable);

    /**
     * Creates a Form instance.
     * @name giant.Form.create
     * @function
     * @returns {giant.Form}
     */

    /**
     * The Form encloses multiple FormField's, provides validity events for the entire form,
     * and supports submitting the form.
     * TODO: Implement disabling for form elements like inputs, etc.
     * @class
     * @extends giant.Widget
     * @extends giant.BinaryStateful
     * @extends giant.Disableable
     */
    giant.Form = self
        .addConstants(/** @lends giant.Form */{
            /** @constant */
            EVENT_FORM_VALID: 'form-valid',

            /** @constant */
            EVENT_FORM_INVALID: 'form-invalid',

            /** @constant */
            EVENT_FORM_SUBMIT: 'form-submit',

            /** @constant */
            EVENT_FORM_RESET: 'form-reset'
        })
        .addPublic(/** @lends giant.Form */{
            /**
             * @type {giant.MarkupTemplate}
             */
            contentTemplate: [
                '<ul class="inputs-container">',
                '</ul>'
            ].join('').toMarkupTemplate()
        })
        .addPrivateMethods(/** @lends giant.Form# */{
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
                    validFieldNames instanceof Array ?
                        validFieldNames.length :
                        1 :
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
        .addMethods(/** @lends giant.Form# */{
            /** @ignore */
            init: function () {
                base.init.call(this);
                giant.BinaryStateful.init.call(this);
                giant.Disableable.init.call(this);

                this.setTagName('form');

                this.elevateMethods(
                    'onSubmit',
                    'onInputSubmit',
                    'onInputValid',
                    'onInputInvalid');

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
                    .subscribeTo(giant.Input.EVENT_INPUT_SUBMIT, this.onInputSubmit)
                    .subscribeTo(giant.Input.EVENT_INPUT_VALID, this.onInputValid)
                    .subscribeTo(giant.Input.EVENT_INPUT_INVALID, this.onInputInvalid);
            },

            /** @ignore */
            afterRender: function () {
                base.afterRender.call(this);

                $(this.getElement())
                    .on('submit', this.onSubmit);

                if (!this.isDisabled()) {
                    this.focusOnFirstField();
                }
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
             * @param {giant.FormField} formField
             * @returns {giant.Form}
             */
            addFormField: function (formField) {
                giant
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
             * @returns {giant.FormField}
             */
            getFormField: function (fieldName) {
                return this.getChild(fieldName);
            },

            /**
             * Fetches all form field widgets as a WidgetCollection.
             * @returns {giant.WidgetCollection}
             */
            getFormFields: function () {
                return this.children.filterByType(giant.FormField);
            },

            /**
             * Fetches input widgets from all form fields.
             * @returns {giant.Collection}
             */
            getInputWidgets: function () {
                return this.getFormFields()
                    .callOnEachItem('getInputWidget');
            },

            /**
             * Fetches input values from all form fields indexed by form field names.
             * @returns {giant.Collection}
             */
            getInputValues: function () {
                return this.getFormFields()
                    .callOnEachItem('getInputValue');
            },

            /**
             * Clears input value in all fields.
             * @param {boolean} [updateDom]
             * @returns {giant.Form}
             */
            resetForm: function (updateDom) {
                // clearing input values
                this.getFormFields()
                    .callOnEachItem('clearInputValue', updateDom);

                // broadcasting form reset event so fields can clean up if they want to
                this.broadcastSync(this.EVENT_FORM_RESET);

                return this;
            },

            /**
             * Attempts to submit form. It is up to the parent widget to handle the submit event
             * and actually submit the form. (It may not be necessary to submit anything to a server,
             * but rather take some other action.)
             * @returns {giant.Form}
             */
            trySubmittingForm: function () {
                this._triggerSubmissionEvent();
                return this;
            },

            /**
             * Puts focus on first field of the form.
             * @returns {giant.Form}
             */
            focusOnFirstField: function () {
                var firstField = this.children
                    .filterByType(giant.FormField)
                    .getSortedValues()[0];

                if (firstField) {
                    firstField.focusOnField();
                }

                return this;
            },

            /**
             * @param {giant.WidgetEvent} event
             * @ignore
             */
            onInputSubmit: function (event) {
                var link = giant.pushOriginalEvent(event);
                this.trySubmittingForm();
                link.unLink();
            },

            /**
             * @param {giant.WidgetEvent} event
             * @ignore
             */
            onInputValid: function (event) {
                var wasValid = this.isValid(),
                    link = giant.pushOriginalEvent(event);

                this.validFieldCount++;
                this._triggerValidityEvent(wasValid);

                link.unLink();
            },

            /**
             * @param {giant.WidgetEvent} event
             * @ignore
             */
            onInputInvalid: function (event) {
                var wasValid = this.isValid(),
                    link = giant.pushOriginalEvent(event);

                this.validFieldCount--;
                this._triggerValidityEvent(wasValid);

                link.unLink();
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
}, jQuery);

(function () {
    "use strict";

    giant.addTypes(/** @lends giant */{
        /** @param {giant.Form} expr */
        isForm: function (expr) {
            return giant.Form.isBaseOf(expr);
        },

        /** @param {giant.Form} [expr] */
        isFormOptional: function (expr) {
            return expr === undefined ||
                giant.Form.isBaseOf(expr);
        }
    });
}());
