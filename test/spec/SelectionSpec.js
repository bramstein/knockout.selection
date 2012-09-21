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
                click($('#item3'));
                expect(element).selectionCountToBe(1);
            });
        });

        describe('with one selected item', function () {
            beforeEach(function () {
                click($('#item7'));
            });

            it('has one selection', function () {
                expect(element).selectionCountToBe(1);
                expect($('#item7')).toHaveClass('selected');
            });

            it('moves the selection to the clicked element', function () {
                click($('#item3'));
                expect(element).selectionCountToBe(1);
                expect($('#item3')).toHaveClass('selected');
                expect($('#item7')).toNotHaveClass('selected');
            });

            it('ignores clicks on selected element', function () {
                click($('#item7'));
                expect(element).selectionCountToBe(1);
                expect($('#item7')).toHaveClass('selected');
            });

            it('ignores shift', function () {
                click($('#item3'), { shiftKey: true });
                expect(element).selectionCountToBe(1);
                expect($('#item3')).toHaveClass('selected');
                expect($('#item4')).toNotHaveClass('selected');
                expect($('#item7')).toNotHaveClass('selected');
            });

            it('ignores ctrl', function () {
                click($('#item3'), { ctrlKey: true });
                expect(element).selectionCountToBe(1);
                expect($('#item3')).toHaveClass('selected');
                expect($('#item7')).toNotHaveClass('selected');
            });

            it('selects next element on down-arrow', function () {
                arrowDown($('ul', element));
                expect($('#item7')).toNotHaveClass('selected');
                expect($('#item8')).toHaveClass('selected');
            }); 
            
            it('selects previous element on up-arrow', function () {
                arrowUp($('ul', element));
                expect($('#item7')).toNotHaveClass('selected');
                expect($('#item6')).toHaveClass('selected');
            }); 
        });

        it('focuses selected element', function () {
            click($('#item3'));
            var focus = model.focus();
            expect(focus.id).toBe('item3');
            expect(focus.focused()).toBeTruthy();
        });
    });
});