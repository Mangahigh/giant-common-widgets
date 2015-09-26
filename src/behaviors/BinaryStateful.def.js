$oop.postpone($commonWidgets, 'BinaryStateful', function () {
    "use strict";

    var base = $oop.Base,
        self = base.extend();

    /**
     * The BinaryStateful trait manages multiple binary states with multiple contributing sources.
     * @class
     * @extends $oop.Base
     * @extends $widget.Widget
     * @see $commonWidgets.BinaryState
     */
    $commonWidgets.BinaryStateful = self
        .addConstants(/** @lends $commonWidgets.BinaryStateful */{
            /**
             * Identifier for imposed source.
             * @constant
             */
            SOURCE_ID_IMPOSED: 'imposed'
        })
        .addMethods(/** @lends $commonWidgets.BinaryStateful# */{
            /**
             * Call from host's init.
             */
            init: function () {
                /**
                 * Holds a collection of BinaryState instances for each binary state.
                 * @type {$data.Collection}
                 */
                this.binaryStates = $data.Collection.create();
            },

            /**
             * Call from host's .afterAdd
             */
            afterAdd: function () {
                var that = this;

                this.binaryStates
                    .forEachItem(function (sources, stateName) {
                        // checking whether any of the parents have matching states set
                        that.applyImposedStateSource(stateName);

                        // initializing binary state
                        if (that.isStateOn(stateName)) {
                            that.afterStateOn(stateName);
                        } else {
                            that.afterStateOff(stateName);
                        }
                    });
            },

            /**
             * Call from host's .afterRemove
             */
            afterRemove: function () {
                var that = this;

                // removing all parent imposed sources from all states
                this.binaryStates
                    .forEachItem(function (binaryState, stateName) {
                        binaryState.stateSources
                            // fetching imposed source IDs
                            .filterByPrefix(self.SOURCE_ID_IMPOSED)
                            .getKeysAsHash()
                            .toCollection()

                            // removing them from current stateful instance
                            .passEachItemTo(that.removeBinaryStateSource, that, 1, stateName);
                    });
            },

            /**
             * Adds a state to the instance. A state must be added before it can be manipulated.
             * TODO: Add test for isCascading argument.
             * @param {string} stateName Identifies the state.
             * @param {boolean} [isCascading=false] Whether new state is cascading.
             * @returns {$commonWidgets.BinaryStateful}
             */
            addBinaryState: function (stateName, isCascading) {
                var binaryStateLayers = this.binaryStates;
                if (!binaryStateLayers.getItem(stateName)) {
                    binaryStateLayers.setItem(
                        stateName,
                        stateName.toBinaryState()
                            .setIsCascading(isCascading));
                }
                return this;
            },

            /**
             * @param {string} stateName
             * @returns {$commonWidgets.BinaryState}
             */
            getBinaryState: function (stateName) {
                return this.binaryStates.getItem(stateName);
            },

            /**
             * Determines whether the specified state evaluates to true.
             * @param {string} stateName Identifies state.
             * @returns {boolean}
             */
            isStateOn: function (stateName) {
                return this.binaryStates.getItem(stateName).isStateOn();
            },

            /**
             * Adds the specified contributing source to the specified state.
             * @param {string} stateName Identifies state.
             * @param {string} sourceId Identifies source.
             * @returns {$commonWidgets.BinaryStateful}
             */
            addBinaryStateSource: function (stateName, sourceId) {
                var state = this.getBinaryState(stateName),
                    sourceCountBefore = state.getSourceCount(),
                    sourceCountAfter;

                // adding source to self
                state.addSource(sourceId);
                sourceCountAfter = state.getSourceCount();

                if (sourceCountAfter && !sourceCountBefore) {
                    // state just switched to "on"

                    // adding source to suitable descendants
                    this.getAllDescendants()
                        .filterBySelector(function (/**$commonWidgets.BinaryStateful*/descendant) {
                            var state = descendant.binaryStates && descendant.getBinaryState(stateName);
                            return state && state.isCascading;
                        })
                        .callOnEachItem('addImposedStateSource', stateName);

                    this.afterStateOn(stateName);
                }

                return this;
            },

            /**
             * Imposes a source on the specified state provided that that state allows cascading.
             * @param {string} stateName
             * @returns {$commonWidgets.BinaryStateful}
             */
            addImposedStateSource: function (stateName) {
                var state = this.getBinaryState(stateName),
                    sourceCountBefore = state.getSourceCount(),
                    sourceCountAfter;

                state.addSource(self.SOURCE_ID_IMPOSED);
                sourceCountAfter = state.getSourceCount();

                if (sourceCountAfter && !sourceCountBefore) {
                    // state just switched to "on"
                    this.afterStateOn(stateName);
                }

                return this;
            },

            /**
             * Applies sources imposed by parents on the current instance.
             * @param {string} stateName Identifies state to add imposed sources to.
             * @returns {$commonWidgets.BinaryStateful}
             */
            applyImposedStateSource: function (stateName) {
                // querying nearest parent for matching state
                var parent = this.getAncestor(function (statefulInstance) {
                    var binaryStates = statefulInstance.binaryStates;
                    return binaryStates && statefulInstance.getBinaryState(stateName);
                });

                if (parent && parent.isStateOn(stateName)) {
                    this.addImposedStateSource(stateName);
                }

                return this;
            },

            /**
             * Removes the specified source from the specified state.
             * @param {string} stateName Identifies state.
             * @param {string} [sourceId] Identifies source. When omitted, all sources will be
             * removed.
             * @returns {$commonWidgets.BinaryStateful}
             */
            removeBinaryStateSource: function (stateName, sourceId) {
                var state = this.getBinaryState(stateName),
                    sourceCountBefore = state.getSourceCount(),
                    sourceCountAfter;

                // adding source to self
                state.removeSource(sourceId);
                sourceCountAfter = state.getSourceCount();

                if (!sourceCountAfter && sourceCountBefore) {
                    // state just switched to "off"

                    // adding source to suitable descendants
                    this.getAllDescendants()
                        .filterBySelector(function (/**$commonWidgets.BinaryStateful*/descendant) {
                            var state = descendant.binaryStates && descendant.getBinaryState(stateName);
                            return state && state.isCascading;
                        })
                        .callOnEachItem('removeImposedStateSource', stateName);

                    this.afterStateOff(stateName);
                }

                return this;
            },

            /**
             * Removes contributing source imposed by the specified instance from the specified state.
             * @param {string} stateName
             * @returns {$commonWidgets.BinaryStateful}
             */
            removeImposedStateSource: function (stateName) {
                var state = this.getBinaryState(stateName),
                    sourceCountBefore = state.getSourceCount(),
                    sourceCountAfter;

                state.removeSource(self.SOURCE_ID_IMPOSED);
                sourceCountAfter = state.getSourceCount();

                if (!sourceCountAfter && sourceCountBefore) {
                    // state just switched to "off"
                    this.afterStateOff(stateName);
                }

                return this;
            },

            /**
             * Sets cascading flag on the specified state and updates imposed state on the current instance.
             * @param {string} stateName
             * @param {boolean} isCascading
             * @returns {$commonWidgets.BinaryStateful}
             */
            setIsCascading: function (stateName, isCascading) {
                var state = this.getBinaryState(stateName),
                    wasCascading = state.isCascading;

                if (isCascading && !wasCascading) {
                    // applying imposed source
                    this.applyImposedStateSource(stateName);
                } else if (!isCascading && wasCascading) {
                    // removing imposed source from this instance only
                    // (descendants might still be cascading)
                    this.removeImposedStateSource(stateName);
                }

                state.setIsCascading(isCascading);

                return this;
            }
        });

    /**
     * Called after the state value changes from false to true.
     * @name $commonWidgets.BinaryStateful#afterStateOn
     * @function
     * @param {string} stateName
     */

    /**
     * Called after the state value changes from true to false.
     * @name $commonWidgets.BinaryStateful#afterStateOff
     * @function
     * @param {string} stateName
     */
});
