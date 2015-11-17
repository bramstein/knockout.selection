/*global define*/
window.defineTestSuite = function (tests) {
    define(tests, function () {
        for (var i = 0; i < arguments.length; i += 1) {
            arguments[i]();
        }
    });
};

window.defineTest = function (dependencies, test) {
    define(dependencies, function () {
        var args = arguments;
        return function () {
            return test.apply(null, args);
        };
    });
};
