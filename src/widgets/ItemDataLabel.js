/*global giant, giant, giant, giant, giant, giant */
giant.postpone(giant, 'ItemDataLabel', function (ns, className) {
    "use strict";

    var base = giant.DataLabel;

    /**
     * Creates a ItemDataLabel instance.
     * @name giant.ItemDataLabel.create
     * @function
     * @param {giant.FieldKey} textFieldKey Identifies field to be displayed.
     * @param {giant.ItemKey} itemKey Identifies item the widget is associated with.
     * @returns {giant.ItemDataLabel}
     */

    /**
     * General DataLabel to be used as a list item.
     * @class
     * @extends giant.DataLabel
     * @extends giant.DataListItem
     */
    giant.ItemDataLabel = base.extend(className)
        .addTrait(giant.DataListItem);
});
