/*global giant */
/*global module, test, expect, ok, equal, strictEqual, notStrictEqual, deepEqual, notDeepEqual, raises */
(function () {
    "use strict";

    module("String utils");

    test("Left padding", function () {
        equal(giant.StringUtils.padLeft(123, 5), '00123', "should left pad number with zeros");
        equal(giant.StringUtils.padLeft(12345678, 5), '45678', "should left trim number to get target length");
    });
}());