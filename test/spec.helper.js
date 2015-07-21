/*global beforeEach, expect*/
define([
    'jquery'
], function ($) {
    function SpecHelper() {
    };

    SpecHelper.prototype.createTestElement = function (listBindings, itemBindings, parentBinding) {
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

    SpecHelper.prototype.click = function (element, options) {
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

    SpecHelper.prototype.keyDown = function (element, options) {
        var defaultOptions = {
            shiftKey: false,
            ctrlKey: false
        };
        options = $.extend(defaultOptions, options);
        var e = $.Event("keydown", options);
        element.trigger(e);
    }

    SpecHelper.prototype.arrowDown = function (element, options) {
        var defaultOptions = { which: 40 };
        options = $.extend(defaultOptions, options);
        this.keyDown(element, options);
    }

    SpecHelper.prototype.arrowRight = function (element, options) {
        var defaultOptions = { which: 39 };
        options = $.extend(defaultOptions, options);
        this.keyDown(element, options);
    }

    SpecHelper.prototype.arrowUp = function (element, options) {
        var defaultOptions = { which: 38 };
        options = $.extend(defaultOptions, options);
        this.keyDown(element, options);
    }

    SpecHelper.prototype.arrowLeft = function (element, options) {
        var defaultOptions = { which: 37 };
        options = $.extend(defaultOptions, options);
        this.keyDown(element, options);
    }

    SpecHelper.prototype.space = function (element, options) {
        var defaultOptions = { which: 32 };
        options = $.extend(defaultOptions, options);
        this.keyDown(element, options);
    }

    SpecHelper.prototype.home = function (element, options) {
        var defaultOptions = { which: 36 };
        options = $.extend(defaultOptions, options);
        this.keyDown(element, options);
    }

    SpecHelper.prototype.end = function (element, options) {
        var defaultOptions = { which: 35 };
        options = $.extend(defaultOptions, options);
        this.keyDown(element, options);
    }

    SpecHelper.prototype.toArray = function (args) {
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

    var specHelper = new SpecHelper();

    return specHelper;
});
