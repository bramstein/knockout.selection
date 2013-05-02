/*global $, beforeEach, expect*/
function useTestElement(selector) {
    var container = $('#test');
    container.empty();
    var testElement = $(selector).clone();
    testElement.appendTo(container);
    return testElement[0];
}

function click(element, options) {
    var defaultOptions = {
        which: 1,
        shiftKey: false,
        ctrlKey: false
    };
    options = $.extend(defaultOptions, options);
    element.trigger($.Event("mousedown", options));
    element.trigger($.Event("mouseup", options));
    element.trigger($.Event("click", options));
}

function keyDown(element, options) {
    var defaultOptions = {
        shiftKey: false,
        ctrlKey: false
    };
    options = $.extend(defaultOptions, options);
    var e = $.Event("keydown", options);
    element.trigger(e);
}

function arrowDown(element, options) {
    var defaultOptions = { which: 40 };
    options = $.extend(defaultOptions, options);
    keyDown(element, options);
}

function arrowUp(element, options) {
    var defaultOptions = { which: 38 };
    options = $.extend(defaultOptions, options);
    keyDown(element, options);
}

function space(element, options) {
    var defaultOptions = { which: 32 };
    options = $.extend(defaultOptions, options);
    keyDown(element, options);
}

function toArray(args) {
    return Array.prototype.slice.call(args);
}
beforeEach(function () {
    expect.Assertion.prototype.cssClass = function (expected) {
        var $element = $(this.obj);
        var elementClasses = ($element.attr('class') || '').split(' ');

        this.obj = elementClasses;
        this.contain(expected);

        return this;
    };

    expect.Assertion.prototype.selectionCount = function (expected) {
        var selectionCount = $('.selected', this.obj).length;

        this.assert(
            selectionCount === expected,
            function () { return 'expected list to have ' + expected + ' selected items but got ' + selectionCount; },
            function () { return 'expected list to not have ' + expected + ' selected items but got ' + selectionCount; });

        return this;
    };
});
