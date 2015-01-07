/*global $, beforeEach, expect*/
function createTestElement(listBindings, itemBindings, parentBinding) {
    var testContainer = $('#test'),
    elementContainer = $('<div></div>'),
    list = $('<ul tabindex="-1"></ul>');

    if (parentBinding) {
        elementContainer.attr('data-bind', parentBinding);
    }

    list.attr('data-bind', listBindings);
    elementContainer.append(list);

    if (itemBindings) {
        var item = $('<li></li>');

        item.attr('data-bind', itemBindings);
        list.append(item);
    }

    testContainer.empty();
    testContainer.append(elementContainer);

    return elementContainer.get(0);
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

function arrowRight(element, options) {
    var defaultOptions = { which: 39 };
    options = $.extend(defaultOptions, options);
    keyDown(element, options);
}

function arrowUp(element, options) {
    var defaultOptions = { which: 38 };
    options = $.extend(defaultOptions, options);
    keyDown(element, options);
}

function arrowLeft(element, options) {
    var defaultOptions = { which: 37 };
    options = $.extend(defaultOptions, options);
    keyDown(element, options);
}

function space(element, options) {
    var defaultOptions = { which: 32 };
    options = $.extend(defaultOptions, options);
    keyDown(element, options);
}

function home(element, options) {
    var defaultOptions = { which: 36 };
    options = $.extend(defaultOptions, options);
    keyDown(element, options);
}

function end(element, options) {
    var defaultOptions = { which: 35 };
    options = $.extend(defaultOptions, options);
    keyDown(element, options);
}

function toArray(args) {
    return Array.prototype.slice.call(args);
}

expect.addAssertion('cssClass', '[not] to have css class', function (expect, subject, value) {
    var $element = $(subject);
    var elementClasses = ($element.attr('class') || '').split(' ');
    expect(elementClasses, '[not] to contain', value);
});

expect.addAssertion('selectionCount', 'to have selection count', function (expect, subject, value) {
    var selection = $('.selected', subject);
    expect(selection, 'to have length', value);
});
