/*global giant */
$oop.postpone(giant, 'DataList', function (ns, className) {
    "use strict";

    var base = giant.List,
        self = base.extend(className)
            .addTrait($entity.EntityBound)
            .addTrait(giant.EntityWidget)
            .addTraitAndExtend(giant.FieldBound);

    /**
     * Creates a DataList instance.
     * @name giant.DataList.create
     * @function
     * @param {$entity.FieldKey} fieldKey Key to an ordered reference collection.
     * @returns {giant.DataList}
     */

    /**
     * The DataList maintains a list of widgets based on a collection field in the cache.
     * Keeps list in sync with the changes of the corresponding collection.
     * Expects to be bound to an *ordered* collection.
     * Expects to have items that are also EntityWidgets.
     * TODO: Add unit tests.
     * @class
     * @extends giant.List
     * @extends $entity.EntityBound
     * @extends giant.EntityWidget
     * @extends giant.FieldBound
     */
    giant.DataList = self
        .addPrivateMethods(/** @lends giant.DataList# */{
            /**
             * @param {string} childName
             * @param {$entity.ItemKey} itemKey
             * @private
             * @memberOf giant.DataList
             */
            _getSetKey: function (childName, itemKey) {
                return childName + '|' + itemKey.toString();
            },

            /**
             * @param {$entity.ItemKey} itemKey
             * @returns {giant.Widget}
             * @private
             */
            _spawnPreparedItemWidget: function (itemKey) {
                return this.spawnItemWidget(itemKey)
                    .setItemKey(itemKey)
                    .setChildName(this.spawnItemName(itemKey));
            },

            /**
             * @param {$entity.ItemKey} itemKey
             * @private
             */
            _addItem: function (itemKey) {
                var oldChildName = this.childNamesByItemKey.getItem(itemKey.toString());

                if (oldChildName) {
                    // renaming existing item widget
                    this.getChild(oldChildName)
                        .setChildName(this.spawnItemName(itemKey));
                } else {
                    // adding new item widget
                    this.addItemWidget(this._spawnPreparedItemWidget(itemKey));
                }
            },

            /**
             * @param {$entity.ItemKey} itemKey
             * @private
             */
            _removeItem: function (itemKey) {
                var childName = this.childNamesByItemKey.getItem(itemKey.toString());
                if (childName) {
                    this.getChild(childName).removeFromParent();
                }
            },

            /** @private */
            _initChildLookup: function () {
                this.childNamesByItemKey = this.children
                    .mapKeys(function (childWidget) {
                        return childWidget.itemKey.toString();
                    })
                    .mapValues(function (childWidget) {
                        return childWidget.childName;
                    });
            }
        })
        .addMethods(/** @lends giant.DataList# */{
            /**
             * @param {$entity.FieldKey} fieldKey
             * @ignore
             */
            init: function (fieldKey) {
                $assertion.isFieldKey(fieldKey, "Invalid field key");

                base.init.call(this);
                $entity.EntityBound.init.call(this);
                giant.EntityWidget.init.call(this, fieldKey);

                this
                    .elevateMethod('onItemAdd')
                    .elevateMethod('onItemRemove');

                /**
                 * Lookup associating item keys with widget (child) names.
                 * @type {$data.Collection}
                 */
                this.childNamesByItemKey = $data.Collection.create();
            },

            /** @ignore */
            afterAdd: function () {
                base.afterAdd.call(this);
                giant.FieldBound.afterAdd.call(this);

                this._initChildLookup();

                this
                    .subscribeTo(giant.EVENT_DATA_LIST_ITEM_ADD, this.onItemAdd)
                    .subscribeTo(giant.EVENT_DATA_LIST_ITEM_REMOVE, this.onItemRemove)
                    .bindToEntityContentChange(this.entityKey, 'onItemChange');
            },

            /** @ignore */
            afterRemove: function () {
                base.afterRemove.call(this);
                giant.FieldBound.afterRemove.call(this);
            },

            /**
             * Creates item widget for the specified item key.
             * To specify a custom widget class, either override this method in a subclass, or provide
             * a surrogate definition on DataLabel, in case the custom item widget is also DataLabel-based.
             * @param {$entity.ItemKey} itemKey
             * @returns {giant.Widget}
             */
            spawnItemWidget: function (itemKey) {
                return giant.ItemDataLabel.create(itemKey, itemKey)
                    .setChildName(this.spawnItemName(itemKey));
            },

            /**
             * Retrieves the item childName associated with the specified itemKey. (Child name determines order.)
             * To specify custom child name for item widgets, override this method.
             * @param {$entity.ItemKey} itemKey
             * @returns {string}
             */
            spawnItemName: function (itemKey) {
                return itemKey.itemId;
            },

            /**
             * Fetches item widget by item key.
             * @param {$entity.ItemKey} itemKey
             * @returns {giant.Widget}
             */
            getItemWidgetByKey: function (itemKey) {
                var childName = this.childNamesByItemKey.getItem(itemKey.toString());
                return this.getChild(childName);
            },

            /**
             * @param {object} fieldValue
             * @returns {giant.DataList}
             * @ignore
             */
            setFieldValue: function (fieldValue) {
                var that = this,
                    fieldKey = this.entityKey,
                    itemsWidgetsBefore = this.children
                        .mapKeys(function (itemWidget, childName) {
                            return that._getSetKey(childName, itemWidget.itemKey);
                        })
                        .toSet(),
                    itemsKeysAfter = $data.Collection.create(fieldValue)
                        .mapValues(function (itemValue, itemId) {
                            return fieldKey.getItemKey(itemId);
                        })
                        .mapKeys(function (itemKey) {
                            return that._getSetKey(that.spawnItemName(itemKey), itemKey);
                        })
                        .toSet(),
                    itemWidgetsToRemove = itemsWidgetsBefore.subtract(itemsKeysAfter)
                        .toWidgetCollection(),
                    itemKeysToAdd = itemsKeysAfter.subtract(itemsWidgetsBefore),
                    itemWidgetsToAdd = itemKeysToAdd
                        .toCollection()
                        .mapValues(function (itemKey) {
                            return that._spawnPreparedItemWidget(itemKey);
                        });

                // removing tiles that are no longer on the page
                itemWidgetsToRemove
                    .removeFromParent();

                // revealing new tiles
                itemWidgetsToAdd
                    .passEachItemTo(this.addItemWidget, this);

                this.spawnEvent(giant.EVENT_LIST_ITEMS_CHANGE)
                    .setPayloadItems({
                        itemsRemoved: itemWidgetsToRemove,
                        itemsAdded  : itemWidgetsToAdd
                    })
                    .triggerSync();

                return this;
            },

            /**
             * @param {giant.WidgetEvent} event
             * @ignore
             */
            onItemAdd: function (event) {
                var childWidget;

                if (event.sender === this) {
                    childWidget = event.payload.childWidget;

                    // when child is already associated with an item key
                    this.childNamesByItemKey
                        .setItem(childWidget.itemKey.toString(), childWidget.childName);
                }
            },

            /**
             * @param {giant.WidgetEvent} event
             * @ignore
             */
            onItemRemove: function (event) {
                var childWidget;

                if (event.sender === this) {
                    childWidget = event.payload.childWidget;

                    // updating lookup buffers
                    this.childNamesByItemKey
                        .deleteItem(childWidget.itemKey.toString());
                }
            },

            /**
             * @param {$entity.EntityChangeEvent} event
             * @ignore
             */
            onItemChange: function (event) {
                var itemKey = event.sender;
                if (itemKey.isA($entity.ItemKey)) {
                    if (event.beforeNode !== undefined && event.afterNode === undefined) {
                        // item was removed
                        this._removeItem(itemKey);
                    } else if (event.afterNode !== undefined) {
                        // item was added
                        this._addItem(itemKey);
                    }
                }
            }
        });
});
