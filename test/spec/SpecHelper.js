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
    var e = $.Event("mousedown", options);
    element.trigger(e);
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

function arrowDown(element) {
    keyDown(element, {
        which: 40
    });
}

function arrowUp(element) {
    keyDown(element, {
        which: 38
    });
}

function space(element) {
    keyDown(element, {
        which: 32
    });
}

beforeEach(function() {

    this.addMatchers({
        selectionCountToBe: function (expectedCount) {
            return $('.selected', this.actual).length === expectedCount;
        },
        toHaveClass: function (expectedClass) {
            return $(this.actual).hasClass(expectedClass);
        },
        toNotHaveClass: function (unexpectedClass) {
            return !$(this.actual).hasClass(unexpectedClass);
        }
    });
});
