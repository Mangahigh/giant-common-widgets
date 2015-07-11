/*global giant */
/*global module, test, expect, ok, equal, strictEqual, notStrictEqual, deepEqual, notDeepEqual, raises */
(function () {
    "use strict";

    module("Highlightable");

    var base = giant.Widget,
        Highlightable = base.extend('Highlightable')
            .addTraitAndExtend(giant.BinaryStateful)
            .addTraitAndExtend(giant.Highlightable)
            .addMethods({
                init: function () {
                    base.init.call(this);
                    giant.BinaryStateful.init.call(this);
                    giant.Highlightable.init.call(this);
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
        Highlightable.addMocks({
            addBinaryState: function (stateName) {
                equal(stateName, giant.Highlightable.STATE_NAME_HIGHLIGHTABLE,
                    "should add highlightable state to instance");
            }
        });

        var highlightable = Highlightable.create();

        Highlightable.removeMocks();

        ok(highlightable.highlightIds.isA(giant.Collection), "should add highlightIds property");
        equal(highlightable.highlightIds.getKeyCount(), 0,
            "should initialize highlightIds to empty collection");
    });

    test("Binary state addition", function () {
        expect(4);

        var highlightable = Highlightable.create();

        giant.BinaryStateful.addMocks({
            addBinaryStateSource: function (stateName, sourceId) {
                equal(stateName, 'foo', "should pass state name to super");
                equal(sourceId, 'bar', "should pass source ID to super");
            }
        });

        highlightable.addMocks({
            _updateHighlightedState: function () {
                ok(true, "should update highlighted state");
            }
        });

        strictEqual(highlightable.addBinaryStateSource('foo', 'bar'), highlightable,
            "should be chainable");

        giant.BinaryStateful.removeMocks();

        highlightable.addBinaryStateSource(giant.Highlightable.STATE_NAME_HIGHLIGHTABLE, 'bar');
    });

    test("Imposed state addition", function () {
        expect(3);

        var highlightable = Highlightable.create();

        giant.BinaryStateful.addMocks({
            addImposedStateSource: function (stateName) {
                equal(stateName, 'foo', "should pass state name to super");
            }
        });

        highlightable.addMocks({
            _updateHighlightedState: function () {
                ok(true, "should update highlighted state");
            }
        });

        strictEqual(highlightable.addImposedStateSource('foo'), highlightable,
            "should be chainable");

        giant.BinaryStateful.removeMocks();

        highlightable.addImposedStateSource(giant.Highlightable.STATE_NAME_HIGHLIGHTABLE);
    });

    test("Binary state removal", function () {
        expect(4);

        var highlightable = Highlightable.create();

        giant.BinaryStateful.addMocks({
            removeBinaryStateSource: function (stateName, sourceId) {
                equal(stateName, 'foo', "should pass state name to super");
                equal(sourceId, 'bar', "should pass source ID to super");
            }
        });

        highlightable.addMocks({
            _updateHighlightedState: function () {
                ok(true, "should update highlighted state");
            }
        });

        strictEqual(highlightable.removeBinaryStateSource('foo', 'bar'), highlightable,
            "should be chainable");

        giant.BinaryStateful.removeMocks();

        highlightable.removeBinaryStateSource(giant.Highlightable.STATE_NAME_HIGHLIGHTABLE, 'bar');
    });

    test("Imposed state removal", function () {
        expect(3);

        var highlightable = Highlightable.create();

        giant.BinaryStateful.addMocks({
            removeImposedStateSource: function (stateName) {
                equal(stateName, 'foo', "should pass state name to super");
            }
        });

        highlightable.addMocks({
            _updateHighlightedState: function () {
                ok(true, "should update highlighted state");
            }
        });

        strictEqual(highlightable.removeImposedStateSource('foo'), highlightable,
            "should be chainable");

        giant.BinaryStateful.removeMocks();

        highlightable.removeImposedStateSource(giant.Highlightable.STATE_NAME_HIGHLIGHTABLE);
    });

    test("Highlight on", function () {
        var highlightable = Highlightable.create(),
            result = [];

        raises(function () {
            highlightable.highlightOn(123);
        }, "should raise exception on invalid argument");

        highlightable.addMocks({
            addBinaryStateSource: function (stateName, sourceId) {
                result.push([stateName, sourceId]);
            }
        });

        strictEqual(highlightable.highlightOn('foo'), highlightable, "should be chainable");
        highlightable.highlightOn();

        deepEqual(result, [
            ['state-highlightable', 'foo'],
            ['state-highlightable', 'highlighted']
        ], "should add specified or default sources");
    });

    test("Highlight off", function () {
        var highlightable = Highlightable.create(),
            result = [];

        raises(function () {
            highlightable.highlightOff(123);
        }, "should raise exception on invalid argument");

        highlightable.addMocks({
            removeBinaryStateSource: function (stateName, sourceId) {
                result.push([stateName, sourceId]);
            }
        });

        strictEqual(highlightable.highlightOff('foo'), highlightable, "should be chainable");
        highlightable.highlightOff();

        deepEqual(result, [
            ['state-highlightable', 'foo'],
            ['state-highlightable', 'highlighted']
        ], "should remove specified or default sources");
    });

    test("Highlighted state tester", function () {
        var highlightable = Highlightable.create()
            .highlightOn('foo');

        raises(function () {
            highlightable.isHighlighted(123);
        }, "should raise exception on invalid argument");

        ok(!highlightable.isHighlighted('bar'), "should return false for absent source");
        ok(highlightable.isHighlighted('foo'), "should return true for present source");
        ok(highlightable.isHighlighted(), "should return true for no source at non-zero sources");
    });
}());
