function createItems(size) {
    var result  = [];

    for (var i = 0; i < size; i += 1) {
        result.push({
            id: 'item' + i,
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
            focus: ko.observable(),
            focusItem: function (index) {
                this.items().forEach(function (item) {
                    item.focused(false);
                });
                var item = this.items()[index];
                item.focused(true);
                this.focus(item);
            }
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
                model.focusItem(3);
                space($('ul', element));
                expect($('#item3')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(1);
            });

            it('selects the element next to the focused element on arrow down', function () {
                model.focusItem(3);
                arrowDown($('ul', element));
                expect($('#item4')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(1);
            });

            it('selects the element before to the focused element on arrow up', function () {
                model.focusItem(3);
                arrowUp($('ul', element));
                expect($('#item2')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(1);
            });

            describe('when first element is focused', function () {
                beforeEach(function () {
                    model.focusItem(0);
                });
                
                it('selects the focused element on arrow up', function () {
                    model.focusItem(0);
                    arrowUp($('ul', element));
                    expect($('#item0')).to.have.cssClass('selected');
                    expect(element).to.have.selectionCount(1);
                });
            });

            describe('when last element is focused', function () {
                beforeEach(function () {
                    model.focusItem(9);
                });
                
                it('selects the focused element on arrow down');
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