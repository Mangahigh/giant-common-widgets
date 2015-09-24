/*global giant */
(function () {
    "use strict";

    module("Expandable");

    var base = $widget.Widget,
        Expandable = base.extend('Expandable')
            .addTraitAndExtend(giant.BinaryStateful)
            .addTraitAndExtend(giant.Expandable)
            .addMethods({
                init: function () {
                    base.init.call(this);
                    giant.BinaryStateful.init.call(this);
                    giant.Expandable.init.call(this);
                },

                afterAdd: function () {
                    base.afterAdd.call(this);
                    giant.BinaryStateful.afterAdd.call(this);
                },

                afterRemove: function () {
                    base.afterRemove.call(this);
                    giant.BinaryStateful.afterRemove.call(this);
                }
            });

    test("Instantiation", function () {
        Expandable.addMocks({
            addBinaryState: function (stateName) {
                equal(stateName, giant.Expandable.STATE_NAME_EXPANDABLE,
                    "should add expandable state to instance");
            }
        });

        Expandable.create();

        Expandable.removeMocks();
    });

    test("State on handler", function () {
        expect(1);

        var expandable = Expandable.create();

        expandable.addMocks({
            _updateExpandedState: function () {
                ok(true, "should update expandable state");
            }
        });

        expandable.afterStateOn('foo');

        expandable.afterStateOn(giant.Expandable.STATE_NAME_EXPANDABLE);
    });

    test("State off handler", function () {
        expect(1);

        var expandable = Expandable.create();

        expandable.addMocks({
            _updateExpandedState: function () {
                ok(true, "should update expandable state");
            }
        });

        expandable.afterStateOff('foo');

        expandable.afterStateOff(giant.Expandable.STATE_NAME_EXPANDABLE);
    });

    test("Expansion", function () {
        expect(3);

        var expandable = Expandable.create();

        expandable.addMocks({
            addBinaryStateSource: function (stateName, sourceId) {
                equal(stateName, 'state-expandable', "should add source to expandable state");
                equal(sourceId, 'default', "should add specified source");
            }
        });

        strictEqual(expandable.expandWidget(), expandable, "should be chainable");
    });

    test("Contraction", function () {
        expect(3);

        var expandable = Expandable.create();

        expandable.addMocks({
            removeBinaryStateSource: function (stateName, sourceId) {
                equal(stateName, 'state-expandable', "should add source to expandable state");
                equal(sourceId, 'default', "should add specified source");
            }
        });

        strictEqual(expandable.contractWidget(), expandable, "should be chainable");
    });

    test("Highlighted state tester", function () {
        var expandable = Expandable.create();

        ok(!expandable.isExpanded(), "should return false when not expanded");

        expandable.expandWidget();

        ok(expandable.isExpanded(), "should return true when expanded");
    });
}());
