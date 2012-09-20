function useTestElement(selector) {
    var container = $('#test');
    container.empty();
    var testElement = $(selector).clone();
    testElement.appendTo(container);
    return testElement[0];
}

function rightClick(element) {
    var e = jQuery.Event("mousedown", { which: 1});
    element.trigger(e);
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
