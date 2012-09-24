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

    describe('in single selection mode', function () {
        beforeEach(function () {
            element = useTestElement('#single');
            ko.applyBindings(model, element);
        });

        describe('with no selection', function () {
            it('has no elements marks as selected', function () {
                expect(element).to.have.selectionCount(0);
            });

            it('selects the clicked element', function () {
                click($('#item3'));
                expect(element).to.have.selectionCount(1);
            });

            it('select focused element on space', function () {
                model.focus(model.items()[3]);
                space($('ul', element));
                expect($('#item4')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(1);
            });
        });

        describe('with one selected item', function () {
            beforeEach(function () {
                click($('#item7'));
            });

            it('has one selection', function () {
                expect(element).to.have.selectionCount(1);
                expect($('#item7')).to.have.cssClass('selected');
            });

            it('moves the selection to the clicked element', function () {
                click($('#item3'));
                expect(element).to.have.selectionCount(1);
                expect($('#item3')).to.have.cssClass('selected');
                expect($('#item7')).to.not.have.cssClass('selected');
            });

            it('ignores clicks on selected element', function () {
                click($('#item7'));
                expect(element).to.have.selectionCount(1);
                expect($('#item7')).to.have.cssClass('selected');
            });

            it('ignores shift', function () {
                click($('#item3'), { shiftKey: true });
                expect(element).to.have.selectionCount(1);
                expect($('#item3')).to.have.cssClass('selected');
                expect($('#item4')).to.not.have.cssClass('selected');
                expect($('#item7')).to.not.have.cssClass('selected');
            });

            it('ignores ctrl', function () {
                click($('#item3'), { ctrlKey: true });
                expect(element).to.have.selectionCount(1);
                expect($('#item3')).to.have.cssClass('selected');
                expect($('#item7')).to.not.have.cssClass('selected');
            });

            it('selects next element on down-arrow', function () {
                arrowDown($('ul', element));
                expect($('#item7')).to.not.have.cssClass('selected');
                expect($('#item8')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(1);
            }); 
            
            it('selects previous element on up-arrow', function () {
                arrowUp($('ul', element));
                expect($('#item7')).to.not.have.cssClass('selected');
                expect($('#item6')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(1);
            }); 

            it('deselects item on space', function () {
                space($('ul', element));
                expect($('#item7')).to.not.have.cssClass('selected');
                expect(element).to.have.selectionCount(0);
            }); 
        });

        it('focuses selected element', function () {
            click($('#item3'));
            var focus = model.focus();
            expect(focus.id).to.be('item3');
            expect(focus.focused()).to.be.ok();
        });
    });
});