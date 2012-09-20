function createItems(size) {
    var result  = [];

    for (var i = 0; i < size; i += 1) {
        result.push({
            id: 'item' + (i + 1),
            selected: ko.observable(false),
            focused: ko.observable(false)
        });
    }
    return result;
}

describe('Selection', function () {
    var model, element;
    beforeEach(function () {
        model = {
            items: ko.observableArray(createItems(10)),
            selection: ko.observableArray(),
            focus: ko.observable()
        };
    });

    describe('Single selection', function () {
        beforeEach(function () {
            element = useTestElement('#single');
            ko.applyBindings(model, element);
        });

        describe('with no selection', function () {
            it('has no elements marks as selected', function () {
                expect(element).selectionCountToBe(0);
            });

            it('selects the clicked element', function () {
                rightClick($('#item3'));
                expect(element).selectionCountToBe(1);
            });
        });

        describe('with one selected item', function () {
            beforeEach(function () {
                rightClick($('#item2'));
            });

            it('moves the selection to the clicked element', function () {
                rightClick($('#item3'));
                expect(element).selectionCountToBe(1);
                expect($('#item3')).toHaveClass('selected');
                expect($('#item2')).toNotHaveClass('selected');
            });
        });
    });
});