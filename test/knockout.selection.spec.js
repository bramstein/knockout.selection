function createItems(size) {
    var result = [];

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
            focused: ko.observable(),
            anchor: ko.observable(),
            getItem: function (index) {
                return this.items()[index];
            },
            focusItem: function (index) {
                this.focused(this.getItem(index));
            },
            anchorItem: function (index) {
                this.anchor(this.getItem(index));
            },
            select: function () {
                var that = this;
                var indexes = toArray(arguments);
                var newSelection = indexes.map(function (index) {
                    return that.items()[index];
                });
                that.selection(newSelection);
            }
        };
        model.itemsWrappedInAnObservable = ko.observable(model.items);
    });

    describe('with a dynamic observable array bound to foreach', function () {
        beforeEach(function () {
            element = useTestElement('#dynamicForeach');
            ko.applyBindings(model, element);
        });

        describe('with a selection', function () {
            beforeEach(function () {
                model.select(7);
                model.focusItem(7);
                expect(element).to.have.selectionCount(1);
            });

            it('empties its selection when the observableArray bound to the foreach changes', function () {
                model.items = ko.observableArray(createItems(9));
                model.itemsWrappedInAnObservable(model.items);
                expect(model.selection().length).to.be(0);
                expect(element).to.have.selectionCount(0);
                expect(model.focused()).to.not.be.ok();
                expect(model.anchor()).to.not.be.ok();
            });
        });
    });

    describe('in single selection mode', function () {
        beforeEach(function () {
            element = useTestElement('#single');
            ko.applyBindings(model, element);
        });

        describe('with no selection', function () {
            it('has no elements marked as selected', function () {
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

            it('selects the element after the focused element on down-arrow', function () {
                model.focusItem(3);
                arrowDown($('ul', element));
                expect($('#item4')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(1);
            });

            it('selects the element before the focused element on up-arrow', function () {
                model.focusItem(3);
                arrowUp($('ul', element));
                expect($('#item2')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(1);
            });

            describe('when first element is focused', function () {
                beforeEach(function () {
                    model.focusItem(0);
                });

                it('selects the focused element on up-arrow', function () {
                    arrowUp($('ul', element));
                    expect($('#item0')).to.have.cssClass('selected');
                    expect(element).to.have.selectionCount(1);
                });
            });

            describe('when last element is focused', function () {
                beforeEach(function () {
                    model.focusItem(9);
                });

                it('selects the focused element on down-arrow', function () {
                    arrowDown($('ul', element));
                    expect($('#item9')).to.have.cssClass('selected');
                    expect(element).to.have.selectionCount(1);
                });
            });

            describe('when the selection is set manually', function () {

                it('selects one item manually', function() {
                    model.selection( [ model.items()[3] ] );

                    expect($('#item3')).to.have.cssClass('selected');
                    expect(element).to.have.selectionCount(1);
                });

                it('selects multiple items manually', function() {
                    model.selection( [ model.items()[3], model.items()[9] ] );

                    expect(element).to.have.selectionCount(1);
                    expect($('#item9')).to.have.cssClass('selected');
                });

            });
        });

        describe('with one selected item', function () {
            beforeEach(function () {
                model.select(7);
                model.focusItem(7);
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

            it('keeps its selection and focused item after one of the unselected items is removed from the observable array', function () {
                model.items.remove(model.getItem(6));
                expect(model.focused()).to.be.ok();
                expect(element).to.have.selectionCount(1);
                expect(model.selection().length).to.be(1);
            });

            it('has no selection after the selected item is removed from the observable array', function () {
                model.items.remove(model.getItem(7));
                expect(element).to.have.selectionCount(0);
                expect(model.selection().length).to.be(0);
            });

            it('has its focused observable set to null after the focused item is removed from the observable array', function () {
                model.items.remove(model.getItem(7));
                expect(model.focused()).to.not.be.ok();
            });

            it('has its anchor observable set to null after the anchor item is removed from the observable array', function () {
                model.anchorItem(7);
                expect(model.anchor()).to.be.ok();
                model.items.remove(model.getItem(7));
                expect(model.anchor()).to.not.be.ok();
            });

            describe('when the selection is set manually', function () {

                it('selects one item manually', function() {
                    model.selection( [ model.items()[3] ] );

                    expect($('#item3')).to.have.cssClass('selected');
                    expect(element).to.have.selectionCount(1);
                });

                it('selects multiple items manually', function() {
                    model.selection( [ model.items()[3], model.items()[9] ] );

                    expect(element).to.have.selectionCount(1);
                    expect($('#item9')).to.have.cssClass('selected');
                });

            });
        });

        it('focuses selected element', function () {
            click($('#item3'));
            var focused = model.focused();
            expect(focused.id).to.be('item3');
            expect(focused.focused()).to.be.ok();
        });
    });

    describe('in multiple selection mode', function () {
        beforeEach(function () {
            element = useTestElement('#multi');
            ko.applyBindings(model, element);
        });

        describe('with no selection', function () {
            it('has no elements marked as selected', function () {
                expect(element).to.have.selectionCount(0);
            });

            it('selects the clicked element', function () {
                click($('#item3'));
                expect(element).to.have.selectionCount(1);
                expect($('#item3')).to.have.cssClass('selected');
            });

            it('selects the clicked element on shift-click', function () {
                click($('#item3'), { shiftKey: true });
                expect(element).to.have.selectionCount(1);
                expect($('#item3')).to.have.cssClass('selected');
            });

            it('selects the clicked element on ctrl-click', function () {
                click($('#item3'), { ctrlKey: true });
                expect(element).to.have.selectionCount(1);
                expect($('#item3')).to.have.cssClass('selected');
            });

            it('select focused element on space', function () {
                model.focusItem(3);
                space($('ul', element));
                expect($('#item3')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(1);
            });

            it('selects the element after the focused element on down-arrow', function () {
                model.focusItem(3);
                arrowDown($('ul', element));
                expect($('#item4')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(1);
            });

            it('selects the element before the focused element on up-arrow', function () {
                model.focusItem(3);
                arrowUp($('ul', element));
                expect($('#item2')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(1);
            });

            it('selects and focuses the element after the focused element on shift-down-arrow', function () {
                model.focusItem(3);
                model.anchorItem(3);
                arrowDown($('ul', element), { shiftKey: true });
                expect($('#item3')).to.have.cssClass('selected');
                expect($('#item4')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(2);
            });

            it('selects and focuses the element before the focused element on shift-up-arrow', function () {
                model.focusItem(3);
                model.anchorItem(3);
                arrowUp($('ul', element), { shiftKey: true });
                expect($('#item3')).to.have.cssClass('selected');
                expect($('#item2')).to.have.cssClass('selected');
                expect(element).to.have.selectionCount(2);
            });

            it('selects everything on ctrl-a', function () {
                keyDown($('ul', element), { ctrlKey: true, which: 65 });
                expect(element).to.have.selectionCount(10);
            });

            describe('when first element is focused', function () {
                beforeEach(function () {
                    model.focusItem(0);
                });

                it('selects the focused element on up-arrow', function () {
                    arrowUp($('ul', element));
                    expect($('#item0')).to.have.cssClass('selected');
                    expect(element).to.have.selectionCount(1);
                });
            });

            describe('when last element is focused', function () {
                beforeEach(function () {
                    model.focusItem(9);
                });

                it('selects the focused element on down-arrow', function () {
                    arrowDown($('ul', element));
                    expect($('#item9')).to.have.cssClass('selected');
                    expect(element).to.have.selectionCount(1);
                });
            });

            describe('when the selection is set manually', function () {

                it('selects one item manually', function() {
                    model.selection( [ model.items()[3] ] );

                    expect($('#item3')).to.have.cssClass('selected');
                    expect(element).to.have.selectionCount(1);
                });

                it('selects multiple items manually', function() {
                    model.selection( [ model.items()[3], model.items()[9] ] );

                    expect(element).to.have.selectionCount(2);
                    expect($('#item3')).to.have.cssClass('selected');
                    expect($('#item9')).to.have.cssClass('selected');
                });

            });
        });

        describe('with selected items', function () {
            beforeEach(function () {
                model.select(7, 4, 2);
                model.focusItem(2);
                model.anchorItem(2);
            });

            it('expands the selection with ctrl-click', function () {
                click($('#item3'), { ctrlKey: true });
                expect(element).to.have.selectionCount(4);
                [2,3,4,7].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('deselected selected items with ctrl-click', function () {
                click($('#item4'), { ctrlKey: true });
                expect(element).to.have.selectionCount(2);
                [2,7].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('expands the selection on space', function () {
                model.focusItem(6);
                space($('ul', element));
                [2,4,6,7].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
                expect(element).to.have.selectionCount(4);
            });

            it('maintains the selection of non-focused, but selected, elements on space', function () {
                space($('ul', element));
                [4,7].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
                expect(element).to.have.selectionCount(2);
            });

            it('expands the selection with shift-click', function () {
                click($('#item5'), { shiftKey: true });
                expect(element).to.have.selectionCount(4);
                [2,3,4,5].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('expands the selection downward on shift-down-arrow', function () {
                arrowDown($('ul', element), { shiftKey: true });
                expect(element).to.have.selectionCount(2);
                [2,3].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('expands the selection further downward on successive shift-down-arrow', function () {
                arrowDown($('ul', element), { shiftKey: true });
                arrowDown($('ul', element), { shiftKey: true });
                expect(element).to.have.selectionCount(3);
                [2,3,4].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('expands the selection upward on shift-up-arrow', function () {
                arrowUp($('ul', element), { shiftKey: true });
                expect(element).to.have.selectionCount(2);
                [1,2].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('expands the selection further upward on successive shift-up-arrow', function () {
                arrowUp($('ul', element), { shiftKey: true });
                arrowUp($('ul', element), { shiftKey: true });
                expect(element).to.have.selectionCount(3);
                [0,1,2].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('does not move the selection anchor on successive shift-up/down-arrow', function () {
                arrowDown($('ul', element), { shiftKey: true });
                arrowDown($('ul', element), { shiftKey: true });
                arrowUp($('ul', element), { shiftKey: true });
                arrowDown($('ul', element), { shiftKey: true });
                expect(element).to.have.selectionCount(3);
                [2,3,4].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('maintains the selection on ctrl-down-arrow', function () {
                arrowDown($('ul', element), { ctrlKey: true });
                expect(element).to.have.selectionCount(3);
                [2,4,7].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('maintains the selection on successive ctrl-down-arrow', function () {
                arrowDown($('ul', element), { ctrlKey: true });
                arrowDown($('ul', element), { ctrlKey: true });
                expect(element).to.have.selectionCount(3);
                [2,4,7].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('moves the selection anchor downwards on ctrl-down-arrow', function () {
                arrowDown($('ul', element), { ctrlKey: true });
                arrowDown($('ul', element), { shiftKey: true });
                expect(element).to.have.selectionCount(2);
                [3,4].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('moves the selection anchor further downward on successive ctrl-down-arrow', function () {
                arrowDown($('ul', element), { ctrlKey: true });
                arrowDown($('ul', element), { ctrlKey: true });
                arrowDown($('ul', element), { shiftKey: true });
                expect(element).to.have.selectionCount(2);
                [4,5].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('maintains the selection on ctrl-up-arrow', function () {
                arrowUp($('ul', element), { ctrlKey: true });
                expect(element).to.have.selectionCount(3);
                [2,4,7].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('maintains the selection on successive ctrl-up-arrow', function () {
                arrowUp($('ul', element), { ctrlKey: true });
                arrowUp($('ul', element), { ctrlKey: true });
                expect(element).to.have.selectionCount(3);
                [2,4,7].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('moves the selection anchor upward on ctrl-up-arrow', function () {
                arrowUp($('ul', element), { ctrlKey: true });

                expect(model.anchor().id).to.be('item1');
            });

            it('moves the selection anchor further upward on successive ctrl-up-arrow', function () {
                arrowUp($('ul', element), { ctrlKey: true });
                arrowUp($('ul', element), { ctrlKey: true });
                expect(model.anchor().id).to.be('item0');
            });

            it('moves the selection anchor on successive ctrl-up/down-arrow', function () {
                arrowDown($('ul', element), { ctrlKey: true });
                arrowDown($('ul', element), { ctrlKey: true });
                arrowUp($('ul', element), { ctrlKey: true });
                expect(model.anchor().id).to.be('item3');
            });

            it('maintains selection on successive ctrl-up/down-arrow', function () {
                arrowDown($('ul', element), { ctrlKey: true });
                arrowDown($('ul', element), { ctrlKey: true });
                arrowUp($('ul', element), { ctrlKey: true });
                expect(element).to.have.selectionCount(3);
                [2,4,7].forEach(function (index) {
                    expect($('#item'+index)).to.have.cssClass('selected');
                });
            });

            it('removes the selection and selects next element on down-arrow', function () {
                model.focusItem(3);
                arrowDown($('ul', element));
                expect(element).to.have.selectionCount(1);
                expect($('#item4')).to.have.cssClass('selected');
            });

            it('removes the selection and selects previous element on up-arrow', function () {
                model.focusItem(3);
                arrowUp($('ul', element));
                expect(element).to.have.selectionCount(1);
                expect($('#item2')).to.have.cssClass('selected');
            });

            it('removes the selection and selects clicked item on mouse click', function () {
                model.focusItem(3);
                click($('#item8'));
                expect(element).to.have.selectionCount(1);
                expect($('#item8')).to.have.cssClass('selected');
            });

            it('keeps its selection count after one of the unselected items is removed from the observable array', function () {
                model.items.remove(model.getItem(6));
                expect(element).to.have.selectionCount(3);
            });

            it('has its selection count decremented after one of selected items is removed from the observable array', function () {
                model.items.remove(model.getItem(7));
                expect(element).to.have.selectionCount(2);
            });

            it('has its selection count decremented after the focused and selected item is removed from the observable array', function () {
                model.items.remove(model.getItem(2));
                expect(element).to.have.selectionCount(2);
            });

            it('has its focused observable set to null after the focused item is removed from the observable array', function () {
                model.items.remove(model.getItem(2));
                expect(model.focused()).to.not.be.ok();
            });

            it('has its anchor observable set to null after the anchor item is removed from the observable array', function () {
                model.items.remove(model.getItem(2));
                expect(model.anchor()).to.not.be.ok();
            });

            describe('when the selection is set manually', function () {

                it('selects one item manually', function() {
                    model.selection( [ model.items()[3] ] );

                    expect($('#item3')).to.have.cssClass('selected');
                    expect(element).to.have.selectionCount(1);
                });

                it('selects multiple items manually', function() {
                    model.selection( [ model.items()[3], model.items()[9] ] );

                    expect(element).to.have.selectionCount(2);
                    expect($('#item3')).to.have.cssClass('selected');
                    expect($('#item9')).to.have.cssClass('selected');
                });

            });
        });

        it('updates the DOM when the selection data is changed', function () {
            model.selection([2,3,4,7].map(function (index) {
                return model.items()[index];
            }));

            expect(element).to.have.selectionCount(4);
            [2,3,4,7].forEach(function (index) {
                expect($('#item'+index)).to.have.cssClass('selected');
            });
        });

        it('updates the DOM when the focus changes', function () {
            model.focused(model.items()[4]);
            expect(element).to.have.selectionCount(0);
            expect($('#item4')).to.have.cssClass('focused');
        });

        it('updates selected field of items when the selection data is changed', function () {
            model.selection([2,3,4,7].map(function (index) {
                return model.items()[index];
            }));

            var selectionCount = model.items().reduce(function (result, item) {
                return result + item.selected();
            }, 0);
            expect(selectionCount).to.be(4);
        });

        it('updates focused field of the items when the focus changes', function () {
            model.focused(model.items()[4]);
            var focusCount = model.items().reduce(function (result, item) {
                return result + item.focused();
            }, 0);
            expect(focusCount).to.be(1);
            expect(model.items()[4].focused()).to.be.ok();
        });
    });

    describe('error handling', function () {
        it('throws if the selection-binding is not used together with a foreach-binding or a template-binding', function () {
            element = useTestElement('#missing-foreach');
            expect(function () {
                ko.applyBindings(model, element);
            }).to.throwException(/used together with `foreach`/);
        });

        it('throws when data is not an observable array', function () {
            element = useTestElement('#single');
            model.selection = [];
            expect(function () {
                ko.applyBindings(model, element);
            }).to.throwException(/a object containing a `data` `observableArray`/);
        });

        it('throws when binding value is not an observable array', function () {
            element = useTestElement('#single-with-defaults');
            model.selection = [];
            expect(function () {
                ko.applyBindings(model, element);
            }).to.throwException(/a object containing a `data` `observableArray`/);
        });
    });
});