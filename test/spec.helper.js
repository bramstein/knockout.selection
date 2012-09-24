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
    expect.Assertion.prototype.cssClass = function (expected) {
        var $element = $(this.obj);
        var elementClass = $element.attr("class");

        if (this.flags.not) {
            if (elementClass) {
                expect(elementClass).to.not.contain(expected);
            }
            expect($element.hasClass(expected)).to.not.be.ok();
        } else {
            expect(elementClass).to.not.be(undefined);
            expect(elementClass).to.contain(expected);
            expect($element.hasClass(expected)).to.be.ok();
        }

        return this;
    };

    expect.Assertion.prototype.selectionCount = function (expected) {
        var selectionCount = $('.selected', this.obj).length;

        expect(selectionCount).to.be(expected);
        
        return this;
    };
});
