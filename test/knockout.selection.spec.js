/*global describe, it, beforeEach, afterEach*/
defineTest([
    'jquery',
    'knockout',
    'test/spec.helper',
    'unexpected'
], function ($, ko, specHelper, unexpected) {
    var expect = unexpected.clone();

    specHelper.installInto(expect);

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
                    var indexes = specHelper.toArray(arguments);
                    var newSelection = indexes.map(function (index) {
                        return that.items()[index];
                    });
                    that.selection(newSelection);
                }
            };
            model.itemsWrappedInAnObservable = ko.observable(model.items);
        });

        afterEach(function (done) {
            // Use a setTimeout so IE8 doesn't run out of stack space (see
            // https://github.com/visionmedia/mocha/issues/502)
            window.setTimeout(function () {
                done();
            }, 0);
        });

        describe.skip('with a dynamic observable array bound to foreach', function () {
            beforeEach(function () {
                element = specHelper.createTestElement(
                    "foreach: itemsWrappedInAnObservable(), selection: { selection: selection, mode: 'single', focused: focused, anchor: anchor }",
                    'attr: { id: id }, css: { selected: selected }'
                );
                ko.applyBindings(model, element);
            });

            describe('with a selection', function () {
                beforeEach(function () {
                    model.select(7);
                    model.focusItem(7);
                    expect(element, 'to have selection count', 1);
                });

                it('empties its selection when the observableArray bound to the foreach changes', function () {
                    model.items = ko.observableArray(createItems(9));
                    model.itemsWrappedInAnObservable(model.items);
                    expect(model.selection().length, 'to be', 0);
                    expect(element, 'to have selection count', 0);
                    expect(model.focused(), 'to be falsy');
                    expect(model.anchor(), 'to be falsy');
                });
            });
        });

        describe('in single selection mode', function () {
            beforeEach(function () {
                element = specHelper.createTestElement(
                    "foreach: items, selection: { selection: selection, mode: 'single', focused: focused, anchor: anchor }",
                    'attr: { id: id }, css: { selected: selected }'
                );
                ko.applyBindings(model, element);
            });

            describe('with no selection', function () {
                it('has no elements marked as selected', function () {
                    expect(element, 'to have selection count', 0);
                });

                it('selects the clicked element', function () {
                    specHelper.click($('#item3'));
                    expect(element, 'to have selection count', 1);
                });

                it('select focused element on space', function () {
                    model.focusItem(3);
                    specHelper.space($('ul', element));
                    expect($('#item3'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects the element after the focused element on down-arrow', function () {
                    model.focusItem(3);
                    specHelper.arrowDown($('ul', element));
                    expect($('#item4'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects the element before the focused element on up-arrow', function () {
                    model.focusItem(3);
                    specHelper.arrowUp($('ul', element));
                    expect($('#item2'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects first element on down-arrow when there is no focused item', function () {
                    specHelper.arrowDown($('ul', element));
                    expect($('#item0'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects first element on up-arrow when there is no focused item', function () {
                    specHelper.arrowUp($('ul', element));
                    expect($('#item0'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects first element on home', function () {
                    specHelper.home($('ul', element));
                    expect($('#item0'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects last element on end', function () {
                    specHelper.end($('ul', element));
                    expect($('#item9'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                describe('when first element is focused', function () {
                    beforeEach(function () {
                        model.focusItem(0);
                    });

                    it('selects the focused element on up-arrow', function () {
                        specHelper.arrowUp($('ul', element));
                        expect($('#item0'), 'to have css class', 'selected');
                        expect(element, 'to have selection count', 1);
                    });
                });

                describe('when last element is focused', function () {
                    beforeEach(function () {
                        model.focusItem(9);
                    });

                    it('selects the focused element on down-arrow', function () {
                        specHelper.arrowDown($('ul', element));
                        expect($('#item9'), 'to have css class', 'selected');
                        expect(element, 'to have selection count', 1);
                    });
                });

                describe('when the selection is set manually', function () {

                    it('selects one item manually', function () {
                        model.selection([model.items()[3]]);

                        expect($('#item3'), 'to have css class', 'selected');
                        expect(element, 'to have selection count', 1);
                    });

                    it('selects multiple items manually', function () {
                        model.selection([model.items()[3], model.items()[9]]);

                        expect(element, 'to have selection count', 1);
                        expect($('#item9'), 'to have css class', 'selected');
                    });

                });
            });

            describe('with one selected item', function () {
                beforeEach(function () {
                    model.select(7);
                    model.focusItem(7);
                });

                it('has one selection', function () {
                    expect(element, 'to have selection count', 1);
                    expect($('#item7'), 'to have css class', 'selected');
                });

                it('moves the selection to the clicked element', function () {
                    specHelper.click($('#item3'));
                    expect(element, 'to have selection count', 1);
                    expect($('#item3'), 'to have css class', 'selected');
                    expect($('#item7'), 'not to have css class', 'selected');
                });

                it('ignores clicks on selected element', function () {
                    specHelper.click($('#item7'));
                    expect(element, 'to have selection count', 1);
                    expect($('#item7'), 'to have css class', 'selected');
                });

                it('ignores shift', function () {
                    specHelper.click($('#item3'), { shiftKey: true });
                    expect(element, 'to have selection count', 1);
                    expect($('#item3'), 'to have css class', 'selected');
                    expect($('#item4'), 'not to have css class', 'selected');
                    expect($('#item7'), 'not to have css class', 'selected');
                });

                it('ignores ctrl', function () {
                    specHelper.click($('#item3'), { ctrlKey: true });
                    expect(element, 'to have selection count', 1);
                    expect($('#item3'), 'to have css class', 'selected');
                    expect($('#item7'), 'not to have css class', 'selected');
                });

                it('selects next element on down-arrow', function () {
                    specHelper.arrowDown($('ul', element));
                    expect($('#item7'), 'not to have css class', 'selected');
                    expect($('#item8'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects previous element on up-arrow', function () {
                    specHelper.arrowUp($('ul', element));
                    expect($('#item7'), 'not to have css class', 'selected');
                    expect($('#item6'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('deselects item on space', function () {
                    specHelper.space($('ul', element));
                    expect($('#item7'), 'not to have css class', 'selected');
                    expect(element, 'to have selection count', 0);
                });

                it('selects first element on home', function () {
                    specHelper.home($('ul', element));
                    expect($('#item0'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects last element on end', function () {
                    specHelper.end($('ul', element));
                    expect($('#item9'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('keeps its selection and focused item after one of the unselected items is removed from the observable array', function () {
                    model.items.remove(model.getItem(6));
                    expect(model.focused(), 'to be truthy');
                    expect(element, 'to have selection count', 1);
                    expect(model.selection().length, 'to be', 1);
                });

                it('has no selection after the selected item is removed from the observable array', function () {
                    model.items.remove(model.getItem(7));
                    expect(element, 'to have selection count', 0);
                    expect(model.selection().length, 'to be', 0);
                });

                it('focuses the item at the same index after the focused item is removed from the observable array', function () {
                    model.items.remove(model.getItem(7));
                    expect(model.focused(), 'to be', model.getItem(7));
                    expect(model.focused().id, 'to be', 'item8');
                });

                it('focuses the new last item if the last item was focused and removed from the observable array', function () {
                    model.focusItem(9);
                    model.items.remove(model.getItem(9));
                    expect(model.focused(), 'to be', model.getItem(8));
                    expect(model.focused().id, 'to be', 'item8');
                });

                it('has its anchor observable set to null after the anchor item is removed from the observable array', function () {
                    model.anchorItem(7);
                    expect(model.anchor(), 'to be truthy');
                    model.items.remove(model.getItem(7));
                    expect(model.anchor(), 'to be falsy');
                });

                describe('when the selection is set manually', function () {

                    it('selects one item manually', function () {
                        model.selection([model.items()[3]]);

                        expect($('#item3'), 'to have css class', 'selected');
                        expect(element, 'to have selection count', 1);
                    });

                    it('selects multiple items manually', function () {
                        model.selection([model.items()[3], model.items()[9]]);

                        expect(element, 'to have selection count', 1);
                        expect($('#item9'), 'to have css class', 'selected');
                    });

                });

                describe('when the content of foreach is altered', function () {

                    it('keeps items selected when they are still in foreach', function () {
                        model.items(model.items().slice(5));

                        expect(element, 'to have selection count', 1);
                        expect($('#item7'), 'to have css class', 'selected');
                        expect(model.selection().length, 'to be', 1);
                    });

                    it('removes items from selection when they are removed from foreach', function () {
                        model.items(model.items().slice(0, 4));

                        expect(element, 'to have selection count', 0);
                        expect(model.selection().length, 'to be', 0);
                    });
                });
            });

            it('focuses selected element', function () {
                specHelper.click($('#item3'));
                var focused = model.focused();
                expect(focused.id, 'to be', 'item3');
                expect(focused.focused(), 'to be truthy');
            });
        });

        describe('in single selection mode, horizontal', function () {
            beforeEach(function () {
                element = specHelper.createTestElement(
                    "foreach: items, selection: { selection: selection, mode: 'single', direction: 'horizontal', focused: focused, anchor: anchor }",
                    'attr: { id: id }, css: { selected: selected }'
                );
                ko.applyBindings(model, element);
            });

            describe('with no selection', function () {
                it('selects the element after the focused element on right-arrow', function () {
                    model.focusItem(3);
                    specHelper.arrowRight($('ul', element));
                    expect($('#item4'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects the element before the focused element on left-arrow', function () {
                    model.focusItem(3);
                    specHelper.arrowLeft($('ul', element));
                    expect($('#item2'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects the first element on right-arrow when there is no focus', function () {
                    specHelper.arrowRight($('ul', element));
                    expect($('#item0'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects the first element on left-arrow when there is no focus', function () {
                    specHelper.arrowLeft($('ul', element));
                    expect($('#item0'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                describe('when first element is focused', function () {
                    beforeEach(function () {
                        model.focusItem(0);
                    });

                    it('selects the focused element on left-arrow', function () {
                        specHelper.arrowLeft($('ul', element));
                        expect($('#item0'), 'to have css class', 'selected');
                        expect(element, 'to have selection count', 1);
                    });
                });

                describe('when last element is focused', function () {
                    beforeEach(function () {
                        model.focusItem(9);
                    });

                    it('selects the focused element on right-arrow', function () {
                        specHelper.arrowRight($('ul', element));
                        expect($('#item9'), 'to have css class', 'selected');
                        expect(element, 'to have selection count', 1);
                    });
                });
            });

            describe('with one selected item', function () {
                beforeEach(function () {
                    model.select(7);
                    model.focusItem(7);
                });

                it('selects next element on right-arrow', function () {
                    specHelper.arrowRight($('ul', element));
                    expect($('#item7'), 'not to have css class', 'selected');
                    expect($('#item8'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects previous element on left-arrow', function () {
                    specHelper.arrowLeft($('ul', element));
                    expect($('#item7'), 'not to have css class', 'selected');
                    expect($('#item6'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });
            });
        });

        describe('in toggle selection mode', function () {
            beforeEach(function () {
                element = specHelper.createTestElement(
                    "foreach: items, selection: { selection: selection, mode: 'toggle', focused: focused, anchor: anchor }",
                    'attr: { id: id }, css: { selected: selected }'
                );
                ko.applyBindings(model, element);
            });

            describe('with no selection', function () {
                it('has no elements marked as selected', function () {
                    expect(element, 'to have selection count', 0);
                });

                it('selects the clicked element', function () {
                    specHelper.click($('#item3'));
                    expect(element, 'to have selection count', 1);
                });

                it('select focused element on space', function () {
                    model.focusItem(3);
                    specHelper.space($('ul', element));
                    expect($('#item3'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });
            });

            describe('with one item selected', function () {
                beforeEach(function () {
                    model.select(7);
                    model.focusItem(7);
                });

                it('should have one selected item', function () {
                    expect(element, 'to have selection count', 1);
                });

                it('selects another item', function () {
                    specHelper.click($('#item3'));
                    expect(element, 'to have selection count', 2);
                });

                it('deselects an item by selecting it', function () {
                    specHelper.click($('#item7'));
                    expect(element, 'to have selection count', 0);
                });
            });
        });

        describe('in off selection mode', function () {
            beforeEach(function () {
                element = specHelper.createTestElement(
                    "foreach: items, selection: { selection: selection, mode: 'off', focused: focused, anchor: anchor }",
                    'attr: { id: id }, css: { selected: selected }'
                );
                ko.applyBindings(model, element);
            });

            describe('with no selection', function () {
                it('has no elements marked as selected', function () {
                    expect(element, 'to have selection count', 0);
                });

                it('does not select the clicked element', function () {
                    specHelper.click($('#item3'));
                    expect(element, 'to have selection count', 0);
                });

                it('does not select focused element on space', function () {
                    model.focusItem(3);
                    specHelper.space($('ul', element));
                    expect(element, 'to have selection count', 0);
                });
            });

            describe('with one item selected', function () {
                beforeEach(function () {
                    model.select(7);
                    model.focusItem(7);
                });

                it('should have one selected item', function () {
                    expect(element, 'to have selection count', 1);
                });

                it('should not select another item', function () {
                    specHelper.click($('#item3'));
                    expect(element, 'to have selection count', 1);
                });

                it('should not deselect an item by selecting it', function () {
                    specHelper.click($('#item7'));
                    expect(element, 'to have selection count', 1);
                });
            });
        });

        describe('in multiple selection mode', function () {
            beforeEach(function () {
                element = specHelper.createTestElement(
                    'foreach: items, selection: { selection: selection, focused: focused, anchor: anchor, toggleClass: \'checkbox\' }'
                );

                var item = $('<li data-bind="attr: { id: id }, css: { selected: selected, focused: focused }">' +
                             '  <span class="checkbox">' +
                             '    <span class="inside-checkbox"></span>' +
                             '  </span>' +
                             '</li>');

                $('ul', element).append(item);

                ko.applyBindings(model, element);
            });

            describe('with no selection', function () {
                it('has no elements marked as selected', function () {
                    expect(element, 'to have selection count', 0);
                });

                it('selects the clicked element', function () {
                    specHelper.click($('#item3'));
                    expect(element, 'to have selection count', 1);
                    expect($('#item3'), 'to have css class', 'selected');
                });

                it('selects the clicked element on shift-click', function () {
                    specHelper.click($('#item3'), { shiftKey: true });
                    expect(element, 'to have selection count', 1);
                    expect($('#item3'), 'to have css class', 'selected');
                });

                it('selects the clicked element on ctrl-click', function () {
                    specHelper.click($('#item3'), { ctrlKey: true });
                    expect(element, 'to have selection count', 1);
                    expect($('#item3'), 'to have css class', 'selected');
                });

                it('select focused element on space', function () {
                    model.focusItem(3);
                    specHelper.space($('ul', element));
                    expect($('#item3'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects first element on home', function () {
                    specHelper.home($('ul', element));
                    expect($('#item0'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects last element on end', function () {
                    specHelper.end($('ul', element));
                    expect($('#item9'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects the element after the focused element on down-arrow', function () {
                    model.focusItem(3);
                    specHelper.arrowDown($('ul', element));
                    expect($('#item4'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects the element before the focused element on up-arrow', function () {
                    model.focusItem(3);
                    specHelper.arrowUp($('ul', element));
                    expect($('#item2'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects first element on up-arrow when there is no focused element', function () {
                    specHelper.arrowUp($('ul', element));
                    expect($('#item0'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects first element on down-arrow when there is no focused element', function () {
                    specHelper.arrowDown($('ul', element));
                    expect($('#item0'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects and focuses the element after the focused element on shift-down-arrow', function () {
                    model.focusItem(3);
                    model.anchorItem(3);
                    specHelper.arrowDown($('ul', element), { shiftKey: true });
                    expect($('#item3'), 'to have css class', 'selected');
                    expect($('#item4'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 2);
                });

                it('selects and focuses the element before the focused element on shift-up-arrow', function () {
                    model.focusItem(3);
                    model.anchorItem(3);
                    specHelper.arrowUp($('ul', element), { shiftKey: true });
                    expect($('#item3'), 'to have css class', 'selected');
                    expect($('#item2'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 2);
                });

                it('selects everything on ctrl-a', function () {
                    specHelper.keyDown($('ul', element), { ctrlKey: true, which: 65 });
                    expect(element, 'to have selection count', 10);
                });

                describe('when first element is focused', function () {
                    beforeEach(function () {
                        model.focusItem(0);
                    });

                    it('selects the focused element on up-arrow', function () {
                        specHelper.arrowUp($('ul', element));
                        expect($('#item0'), 'to have css class', 'selected');
                        expect(element, 'to have selection count', 1);
                    });
                });

                describe('when last element is focused', function () {
                    beforeEach(function () {
                        model.focusItem(9);
                    });

                    it('selects the focused element on down-arrow', function () {
                        specHelper.arrowDown($('ul', element));
                        expect($('#item9'), 'to have css class', 'selected');
                        expect(element, 'to have selection count', 1);
                    });
                });

                describe('when the selection is set manually', function () {

                    it('selects one item manually', function () {
                        model.selection([model.items()[3]]);

                        expect($('#item3'), 'to have css class', 'selected');
                        expect(element, 'to have selection count', 1);
                    });

                    it('selects multiple items manually', function () {
                        model.selection([model.items()[3], model.items()[9]]);

                        expect(element, 'to have selection count', 2);
                        expect($('#item3'), 'to have css class', 'selected');
                        expect($('#item9'), 'to have css class', 'selected');
                    });

                });
            });

            describe('with selected items', function () {
                beforeEach(function () {
                    model.select(7, 4, 2);
                    model.focusItem(2);
                    model.anchorItem(2);
                });

                it('should not add duplicates when ctrl-shift-clicking with a range that overlaps the selection', function () {
                    expect(model.selection(), 'to have length', 3);
                    specHelper.click($('#item1'), { ctrlKey: true, shiftKey: true });
                    expect(model.selection(), 'to have length', 4);
                });

                it('expands the selection with ctrl-click', function () {
                    specHelper.click($('#item3'), { ctrlKey: true });
                    expect(element, 'to have selection count', 4);
                    [2, 3, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('deselected selected items with ctrl-click', function () {
                    specHelper.click($('#item4'), { ctrlKey: true });
                    expect(element, 'to have selection count', 2);
                    [2, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('expands the selection on space', function () {
                    model.focusItem(6);
                    specHelper.space($('ul', element));
                    [2, 4, 6, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                    expect(element, 'to have selection count', 4);
                });

                it('ignores ctrl key on space', function () {
                    model.focusItem(6);
                    specHelper.space($('ul', element), { ctrlKey: true });
                    [2, 4, 6, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                    expect(element, 'to have selection count', 4);
                });

                it('ignores shift key on space', function () {
                    model.focusItem(6);
                    specHelper.space($('ul', element), { shiftKey: true });
                    [2, 4, 6, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                    expect(element, 'to have selection count', 4);
                });

                it('maintains the selection of non-focused, but selected, elements on space', function () {
                    specHelper.space($('ul', element));
                    [4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                    expect(element, 'to have selection count', 2);
                });

                it('expands the selection with shift-click', function () {
                    specHelper.click($('#item5'), { shiftKey: true });
                    expect(element, 'to have selection count', 4);
                    [2, 3, 4, 5].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('expands the selection downward on shift-down-arrow', function () {
                    specHelper.arrowDown($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 2);
                    [2, 3].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('expands the selection further downward on successive shift-down-arrow', function () {
                    specHelper.arrowDown($('ul', element), { shiftKey: true });
                    specHelper.arrowDown($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 3);
                    [2, 3, 4].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('expands the selection upward on shift-up-arrow', function () {
                    specHelper.arrowUp($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 2);
                    [1, 2].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('expands the selection further upward on successive shift-up-arrow', function () {
                    specHelper.arrowUp($('ul', element), { shiftKey: true });
                    specHelper.arrowUp($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 3);
                    [0, 1, 2].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('does not move the selection anchor on successive shift-up/down-arrow', function () {
                    specHelper.arrowDown($('ul', element), { shiftKey: true });
                    specHelper.arrowDown($('ul', element), { shiftKey: true });
                    specHelper.arrowUp($('ul', element), { shiftKey: true });
                    specHelper.arrowDown($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 3);
                    [2, 3, 4].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('maintains the selection on ctrl-down-arrow', function () {
                    specHelper.arrowDown($('ul', element), { ctrlKey: true });
                    expect(element, 'to have selection count', 3);
                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('maintains the selection on successive ctrl-down-arrow', function () {
                    specHelper.arrowDown($('ul', element), { ctrlKey: true });
                    specHelper.arrowDown($('ul', element), { ctrlKey: true });
                    expect(element, 'to have selection count', 3);
                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('moves the selection anchor downwards on ctrl-down-arrow', function () {
                    specHelper.arrowDown($('ul', element), { ctrlKey: true });
                    specHelper.arrowDown($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 2);
                    [3, 4].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('moves the selection anchor further downward on successive ctrl-down-arrow', function () {
                    specHelper.arrowDown($('ul', element), { ctrlKey: true });
                    specHelper.arrowDown($('ul', element), { ctrlKey: true });
                    specHelper.arrowDown($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 2);
                    [4, 5].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('maintains the selection on ctrl-up-arrow', function () {
                    specHelper.arrowUp($('ul', element), { ctrlKey: true });
                    expect(element, 'to have selection count', 3);
                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('maintains the selection on successive ctrl-up-arrow', function () {
                    specHelper.arrowUp($('ul', element), { ctrlKey: true });
                    specHelper.arrowUp($('ul', element), { ctrlKey: true });
                    expect(element, 'to have selection count', 3);
                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('moves the selection anchor upward on ctrl-up-arrow', function () {
                    specHelper.arrowUp($('ul', element), { ctrlKey: true });

                    expect(model.anchor().id, 'to be', 'item1');
                });

                it('moves the selection anchor further upward on successive ctrl-up-arrow', function () {
                    specHelper.arrowUp($('ul', element), { ctrlKey: true });
                    specHelper.arrowUp($('ul', element), { ctrlKey: true });
                    expect(model.anchor().id, 'to be', 'item0');
                });

                it('moves the selection anchor on successive ctrl-up/down-arrow', function () {
                    specHelper.arrowDown($('ul', element), { ctrlKey: true });
                    specHelper.arrowDown($('ul', element), { ctrlKey: true });
                    specHelper.arrowUp($('ul', element), { ctrlKey: true });
                    expect(model.anchor().id, 'to be', 'item3');
                });

                it('maintains selection on successive ctrl-up/down-arrow', function () {
                    specHelper.arrowDown($('ul', element), { ctrlKey: true });
                    specHelper.arrowDown($('ul', element), { ctrlKey: true });
                    specHelper.arrowUp($('ul', element), { ctrlKey: true });

                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                    expect(element, 'to have selection count', 3);
                });

                it('selects all items from anchor to top on shift-home', function () {
                    specHelper.home($('ul', element), { shiftKey: true });

                    expect(element, 'to have selection count', 3);
                    [0, 1, 2].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('selects all items from anchor to bottom on shift-end', function () {
                    specHelper.end($('ul', element), { shiftKey: true });

                    expect(element, 'to have selection count', 8);
                    [2, 3, 4, 5, 6, 7, 8, 9].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('moves the selection anchor to top on ctrl-home', function () {
                    specHelper.home($('ul', element), { ctrlKey: true });
                    expect(model.anchor().id, 'to be', 'item0');

                    expect(element, 'to have selection count', 3);
                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('moves the selection anchor to bottom on ctrl-end', function () {
                    specHelper.end($('ul', element), { ctrlKey: true });
                    expect(model.anchor().id, 'to be', 'item9');

                    expect(element, 'to have selection count', 3);
                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('expands selection with range from anchor to top on ctrl-shift-home', function () {
                    specHelper.home($('ul', element), { ctrlKey: true, shiftKey: true });

                    expect(element, 'to have selection count', 5);
                    [0, 1, 2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('expands selection with range from anchor to bottom on ctrl-shift-end', function () {
                    model.focusItem(6);
                    model.anchorItem(6);
                    specHelper.end($('ul', element), { ctrlKey: true, shiftKey: true });

                    expect(element, 'to have selection count', 6);
                    [2, 4, 6, 7, 8, 9].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('removes the selection and selects next element on down-arrow', function () {
                    model.focusItem(3);
                    specHelper.arrowDown($('ul', element));
                    expect(element, 'to have selection count', 1);
                    expect($('#item4'), 'to have css class', 'selected');
                });

                it('removes the selection and selects previous element on up-arrow', function () {
                    model.focusItem(3);
                    specHelper.arrowUp($('ul', element));
                    expect(element, 'to have selection count', 1);
                    expect($('#item2'), 'to have css class', 'selected');
                });

                it('removes the selection and selects clicked item on mouse click', function () {
                    model.focusItem(3);
                    specHelper.click($('#item8'));
                    expect(element, 'to have selection count', 1);
                    expect($('#item8'), 'to have css class', 'selected');
                });

                it('keeps its selection count after one of the unselected items is removed from the observable array', function () {
                    model.items.remove(model.getItem(6));
                    expect(element, 'to have selection count', 3);
                });

                it('has its selection count decremented after one of selected items is removed from the observable array', function () {
                    model.items.remove(model.getItem(7));
                    expect(element, 'to have selection count', 2);
                });

                it('has its selection count decremented after the focused and selected item is removed from the observable array', function () {
                    model.items.remove(model.getItem(2));
                    expect(element, 'to have selection count', 2);
                });

                it('focuses the item at the same index after the focused item is removed from the observable array', function () {
                    model.items.remove(model.getItem(2));
                    expect(model.focused(), 'to be', model.getItem(2));
                    expect(model.focused().id, 'to be', 'item3');
                });

                it('focuses the new last item if the last item was focused and removed from the observable array', function () {
                    model.focusItem(9);
                    model.items.remove(model.getItem(9));
                    expect(model.focused(), 'to be', model.getItem(8));
                    expect(model.focused().id, 'to be', 'item8');
                });

                it('has its anchor observable set to null after the anchor item is removed from the observable array', function () {
                    model.items.remove(model.getItem(2));
                    expect(model.anchor(), 'to be falsy');
                });

                it('is possible to cancel the selection event if the item is alreay selected', function () {
                    $('#item4').one('mouseup', function (e) {
                        e.stopPropagation();
                    });

                    var focused = model.focused();
                    var anchor = model.anchor();

                    specHelper.click($('#item4'));
                    expect(focused, 'to be', model.focused());
                    expect(anchor, 'to be', model.anchor());
                    expect(element, 'to have selection count', 3);
                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                describe('when the selection is set manually', function () {

                    it('selects one item manually', function () {
                        model.selection([model.items()[3]]);

                        expect($('#item3'), 'to have css class', 'selected');
                        expect(element, 'to have selection count', 1);
                    });

                    it('selects multiple items manually', function () {
                        model.selection([model.items()[3], model.items()[9]]);

                        expect(element, 'to have selection count', 2);
                        expect($('#item3'), 'to have css class', 'selected');
                        expect($('#item9'), 'to have css class', 'selected');
                    });
                });

                describe('when the content of foreach is altered', function () {

                    it('keeps items selected when they are still in the foreach', function () {
                        model.items(model.items().slice(2, 8));

                        expect(element, 'to have selection count', 3);
                        [2, 4, 7].forEach(function (index) {
                            expect($('#item' + index), 'to have css class', 'selected');
                        });
                        expect(model.selection().length, 'to be', 3);
                    });

                    it('removes items from selection when they are removed from foreach', function () {
                        model.items(model.items().slice(5));

                        expect(element, 'to have selection count', 1);
                        expect($('#item7'), 'to have css class', 'selected');
                        expect(model.selection().length, 'to be', 1);
                    });
                });

                describe('clicking on an element that have the toggleClass', function () {
                    describe('and the item is selected', function () {
                        beforeEach(function () {
                            specHelper.click($('#item7 .checkbox'));
                        });

                        it('unselects the item', function () {
                            expect($('#item7'), 'not to have css class', 'selected');
                        });

                        it('does not change the selection of the other items', function () {
                            expect(element, 'to have selection count', 2);
                            expect($('#item2'), 'to have css class', 'selected');
                            expect($('#item4'), 'to have css class', 'selected');
                        });

                        it('sets the item as the focus', function () {
                            expect(model.focused().id, 'to be', 'item7');
                        });

                        it('sets the item as the anchor', function () {
                            expect(model.anchor().id, 'to be', 'item7');
                        });
                    });

                    describe('and the item is not selected', function () {
                        beforeEach(function () {
                            specHelper.click($('#item3 .checkbox'));
                        });

                        it('selects the item in addition to the current selection', function () {
                            expect(element, 'to have selection count', 4);
                            expect($('#item3'), 'to have css class', 'selected');
                            expect($('#item2'), 'to have css class', 'selected');
                            expect($('#item4'), 'to have css class', 'selected');
                            expect($('#item7'), 'to have css class', 'selected');
                        });

                        it('sets the item as the focus', function () {
                            expect(model.focused().id, 'to be', 'item3');
                        });

                        it('sets the item as the anchor', function () {
                            expect(model.anchor().id, 'to be', 'item3');
                        });
                    });
                });
            });

            describe('clicking on an element that have the toggleClass', function () {
                beforeEach(function () {
                    specHelper.click($('#item7 .checkbox'));
                });

                it('selects the item', function () {
                    expect($('#item7'), 'to have css class', 'selected');
                });

                it('sets the item as the focus', function () {
                    expect(model.focused().id, 'to be', 'item7');
                });

                it('sets the item as the anchor', function () {
                    expect(model.anchor().id, 'to be', 'item7');
                });
            });

            describe('clicking on an element inside an element that have the toggleClass', function () {
                beforeEach(function () {
                    specHelper.click($('#item7 .inside-checkbox'));
                });

                it('selects the item', function () {
                    expect($('#item7'), 'to have css class', 'selected');
                });

                it('sets the item as the focus', function () {
                    expect(model.focused().id, 'to be', 'item7');
                });

                it('sets the item as the anchor', function () {
                    expect(model.anchor().id, 'to be', 'item7');
                });
            });

            describe('clicking on elements that have the toggleClass', function () {
                it('sets the item as the focus', function () {
                    specHelper.click($('#item7 .checkbox'));
                    expect(model.focused().id, 'to be', 'item7');
                });

                it('sets the item as the anchor', function () {
                    specHelper.click($('#item7 .checkbox'));
                    expect(model.anchor().id, 'to be', 'item7');
                });
            });

            it('updates the DOM when the selection data is changed', function () {
                model.selection([2, 3, 4, 7].map(function (index) {
                    return model.items()[index];
                }));

                expect(element, 'to have selection count', 4);
                [2, 3, 4, 7].forEach(function (index) {
                    expect($('#item' + index), 'to have css class', 'selected');
                });
            });

            it('updates the DOM when the focus changes', function () {
                model.focused(model.items()[4]);
                expect(element, 'to have selection count', 0);
                expect($('#item4'), 'to have css class', 'focused');
            });

            it('updates selected field of items when the selection data is changed', function () {
                model.selection([2, 3, 4, 7].map(function (index) {
                    return model.items()[index];
                }));

                var selectionCount = model.items().reduce(function (result, item) {
                    return result + item.selected();
                }, 0);
                expect(selectionCount, 'to be', 4);
            });

            it('updates focused field of the items when the focus changes', function () {
                model.focused(model.items()[4]);
                var focusCount = model.items().reduce(function (result, item) {
                    return result + item.focused();
                }, 0);
                expect(focusCount, 'to be', 1);
                expect(model.items()[4].focused(), 'to be truthy');
            });
        });

        describe('in multiple selection mode, horizontal', function () {
            beforeEach(function () {
                element = specHelper.createTestElement(
                    'foreach: items, selection: { selection: selection, focused: focused, anchor: anchor, direction: "horizontal" }',
                    'attr: { id: id }, css: { selected: selected, focused: focused }'
                );
                ko.applyBindings(model, element);
            });

            describe('with no selection', function () {
                it('selects the element after the focused element on right-arrow', function () {
                    model.focusItem(3);
                    specHelper.arrowRight($('ul', element));
                    expect($('#item4'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects the element before the focused element on left-arrow', function () {
                    model.focusItem(3);
                    specHelper.arrowLeft($('ul', element));
                    expect($('#item2'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 1);
                });

                it('selects and focuses the element after the focused element on shift-right-arrow', function () {
                    model.focusItem(3);
                    model.anchorItem(3);
                    specHelper.arrowRight($('ul', element), { shiftKey: true });
                    expect($('#item3'), 'to have css class', 'selected');
                    expect($('#item4'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 2);
                });

                it('selects and focuses the element before the focused element on shift-left-arrow', function () {
                    model.focusItem(3);
                    model.anchorItem(3);
                    specHelper.arrowLeft($('ul', element), { shiftKey: true });
                    expect($('#item3'), 'to have css class', 'selected');
                    expect($('#item2'), 'to have css class', 'selected');
                    expect(element, 'to have selection count', 2);
                });

                describe('when first element is focused', function () {
                    beforeEach(function () {
                        model.focusItem(0);
                    });

                    it('selects the focused element on left-arrow', function () {
                        specHelper.arrowLeft($('ul', element));
                        expect($('#item0'), 'to have css class', 'selected');
                        expect(element, 'to have selection count', 1);
                    });
                });

                describe('when last element is focused', function () {
                    beforeEach(function () {
                        model.focusItem(9);
                    });

                    it('selects the focused element on right-arrow', function () {
                        specHelper.arrowRight($('ul', element));
                        expect($('#item9'), 'to have css class', 'selected');
                        expect(element, 'to have selection count', 1);
                    });
                });
            });

            describe('with selected items', function () {
                beforeEach(function () {
                    model.select(7, 4, 2);
                    model.focusItem(2);
                    model.anchorItem(2);
                });

                it('expands the selection downward on shift-right-arrow', function () {
                    specHelper.arrowRight($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 2);
                    [2, 3].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('expands the selection further downward on successive shift-right-arrow', function () {
                    specHelper.arrowRight($('ul', element), { shiftKey: true });
                    specHelper.arrowRight($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 3);
                    [2, 3, 4].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('expands the selection upward on shift-left-arrow', function () {
                    specHelper.arrowLeft($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 2);
                    [1, 2].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('expands the selection further upward on successive shift-left-arrow', function () {
                    specHelper.arrowLeft($('ul', element), { shiftKey: true });
                    specHelper.arrowLeft($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 3);
                    [0, 1, 2].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('does not move the selection anchor on successive shift-left/right-arrow', function () {
                    specHelper.arrowRight($('ul', element), { shiftKey: true });
                    specHelper.arrowRight($('ul', element), { shiftKey: true });
                    specHelper.arrowLeft($('ul', element), { shiftKey: true });
                    specHelper.arrowRight($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 3);
                    [2, 3, 4].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('maintains the selection on ctrl-right-arrow', function () {
                    specHelper.arrowRight($('ul', element), { ctrlKey: true });
                    expect(element, 'to have selection count', 3);
                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('maintains the selection on successive ctrl-right-arrow', function () {
                    specHelper.arrowRight($('ul', element), { ctrlKey: true });
                    specHelper.arrowRight($('ul', element), { ctrlKey: true });
                    expect(element, 'to have selection count', 3);
                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('moves the selection anchor downwards on ctrl-right-arrow', function () {
                    specHelper.arrowRight($('ul', element), { ctrlKey: true });
                    specHelper.arrowRight($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 2);
                    [3, 4].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('moves the selection anchor further downward on successive ctrl-right-arrow', function () {
                    specHelper.arrowRight($('ul', element), { ctrlKey: true });
                    specHelper.arrowRight($('ul', element), { ctrlKey: true });
                    specHelper.arrowRight($('ul', element), { shiftKey: true });
                    expect(element, 'to have selection count', 2);
                    [4, 5].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('maintains the selection on ctrl-left-arrow', function () {
                    specHelper.arrowLeft($('ul', element), { ctrlKey: true });
                    expect(element, 'to have selection count', 3);
                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('maintains the selection on successive ctrl-left-arrow', function () {
                    specHelper.arrowLeft($('ul', element), { ctrlKey: true });
                    specHelper.arrowLeft($('ul', element), { ctrlKey: true });
                    expect(element, 'to have selection count', 3);
                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                });

                it('moves the selection anchor upward on ctrl-left-arrow', function () {
                    specHelper.arrowLeft($('ul', element), { ctrlKey: true });

                    expect(model.anchor().id, 'to be', 'item1');
                });

                it('moves the selection anchor further upward on successive ctrl-left-arrow', function () {
                    specHelper.arrowLeft($('ul', element), { ctrlKey: true });
                    specHelper.arrowLeft($('ul', element), { ctrlKey: true });
                    expect(model.anchor().id, 'to be', 'item0');
                });

                it('moves the selection anchor on successive ctrl-left/right-arrow', function () {
                    specHelper.arrowRight($('ul', element), { ctrlKey: true });
                    specHelper.arrowRight($('ul', element), { ctrlKey: true });
                    specHelper.arrowLeft($('ul', element), { ctrlKey: true });
                    expect(model.anchor().id, 'to be', 'item3');
                });

                it('maintains selection on successive ctrl-left/right-arrow', function () {
                    specHelper.arrowDown($('ul', element), { ctrlKey: true });
                    specHelper.arrowDown($('ul', element), { ctrlKey: true });
                    specHelper.arrowLeft($('ul', element), { ctrlKey: true });

                    [2, 4, 7].forEach(function (index) {
                        expect($('#item' + index), 'to have css class', 'selected');
                    });
                    expect(element, 'to have selection count', 3);
                });

                it('removes the selection and selects next element on right-arrow', function () {
                    model.focusItem(3);
                    specHelper.arrowRight($('ul', element));
                    expect(element, 'to have selection count', 1);
                    expect($('#item4'), 'to have css class', 'selected');
                });

                it('removes the selection and selects previous element on left-arrow', function () {
                    model.focusItem(3);
                    specHelper.arrowLeft($('ul', element));
                    expect(element, 'to have selection count', 1);
                    expect($('#item2'), 'to have css class', 'selected');
                });
            });
        });

        describe('when data is given as a argument', function () {
            var items;
            beforeEach(function () {
                element = specHelper.createTestElement(
                    'foreach: items, selection: { data: allItems, selection: selection, focused: focused, anchor: anchor }',
                    'attr: { id: id }, css: { selected: selected, focused: focused }'
                );

                items = createItems(20);
                model.allItems = ko.observableArray(items);
                model.items(items.slice(0, 10));
                ko.applyBindings(model, element);
                model.selection([items[4], items[11], items[15]]);
            });

            it('can have selected elements outside the shown elements', function () {
                expect(element, 'to have selection count', 1);
                expect($('#item4'), 'to have css class', 'selected');
                expect(items[11].selected(), 'to be truthy');
                expect(items[15].selected(), 'to be truthy');
                expect(model.selection().length, 'to be', 3);
            });

            it('can update the visible selection by clicking', function () {
                specHelper.click($('#item2'), { ctrlKey: true });

                expect(element, 'to have selection count', 2);
                expect($('#item2'), 'to have css class', 'selected');
                expect($('#item4'), 'to have css class', 'selected');
                expect(items[11].selected(), 'to be truthy');
                expect(items[15].selected(), 'to be truthy');
                expect(model.selection().length, 'to be', 4);
            });

            it('selects everything on ctrl-a', function () {
                specHelper.keyDown($('ul', element), { ctrlKey: true, which: 65 });
                expect(model.selection().length, 'to be', 20);
            });
        });

        describe('in conditional rendering mode', function () {
            beforeEach(function () {
                element = specHelper.createTestElement(
                    'foreach: items, selection: { selection: selection, focused: focused, anchor: anchor }',
                    'attr: { id: id }, css: { selected: selected, focused: focused }',
                    'if: items().length > 5'
                );
                ko.applyBindings(model, element);
            });

            describe('with selected items', function () {
                beforeEach(function () {
                    model.select(7, 4, 2);
                    model.focusItem(2);
                    model.anchorItem(2);
                });

                it('maintains focus, anchor and selection when dropping below the display threshold', function () {
                    model.items(model.items.slice(0, 5));
                    expect(model.selection().length, 'to be', 2);
                    expect(model.focused(), 'to be', model.items()[2]);
                    expect(model.anchor(), 'to be', model.items()[2]);
                });

                it('cleans up focus, anchor and selection state when removing all items from the collection', function () {
                    model.items([0]);
                    expect(model.selection().length, 'to be', 0);
                    expect(model.focused(), 'to be falsy');
                    expect(model.anchor(), 'to be falsy');
                });
            });
        });

        describe('input data cleanup', function () {
            it('removes items from selection on init when they do not exist in the data source', function (done) {
                element = specHelper.createTestElement(
                    'foreach: items, selection: { selection: selection, focused: focused, anchor: anchor }',
                    'attr: { id: id }, css: { selected: selected, focused: focused }'
                );

                var extraItems = createItems(1);
                extraItems[0].selected(true);
                model.selection.push(extraItems[0]);

                ko.applyBindings(model, element);
                setTimeout(function () {
                    expect(model.selection().length, 'to be', 0);
                    expect(extraItems[0].selected(), 'to be', false);
                    done();
                }, 5);
            });
        });

        describe('error handling', function () {
            it('throws if the selection-binding is not used together with a foreach-binding or a template-binding', function () {
                element = specHelper.createTestElement(
                    'selection: { selection: selection, focused: focused, anchor: anchor }',
                    'attr: { id: id }, css: { selected: selected, focused: focused }'
                );
                expect(function () {
                    ko.applyBindings(model, element);
                }, 'to throw', /used together with `foreach`/);
            });

            it('throws when data is not an observable array', function () {
                element = specHelper.createTestElement(
                    "foreach: items, selection: { selection: selection, mode: 'single', focused: focused, anchor: anchor }",
                    'attr: { id: id }, css: { selected: selected }'
                );
                model.selection = [];
                expect(function () {
                    ko.applyBindings(model, element);
                }, 'to throw', /a object containing a `selection` `observableArray`/);
            });

            it('throws when binding value is not an observable array', function () {
                element = specHelper.createTestElement(
                    'foreach: items, selection: selection',
                    'attr: { id: id }, css: { selected: selected }'
                );
                model.selection = [];
                expect(function () {
                    ko.applyBindings(model, element);
                }, 'to throw', /a object containing a `selection` `observableArray`/);
            });

            it('throws when attempting to use an undefined selection mode', function () {
                element = specHelper.createTestElement(
                    "foreach: items, selection: { selection: selection, mode: 'nonExistingModeName' }",
                    'attr: { id: id }, css: { selected: selected }'
                );
                model.selection = ko.observableArray([]);
                expect(function () {
                    ko.applyBindings(model, element);
                }, 'to throw', /Unknown mode: "nonExistingModeName"/);
            });
        });

        it('handles nested scoping', function () {
            element = specHelper.createTestElement(
                "foreach: items, selection: { selection: selection, mode: 'single', focused: focused, anchor: anchor }",
                'attr: { id: id }, css: { selected: selected }, foreach: [0, 1, 2]'
            );

            $('li', element).each(function (index, el) {
                $(el).append('<span data-bind="text: $data"></span>');
            });

            ko.applyBindings(model, element);
            specHelper.click($('#item3 span:first-child'));
            expect(element, 'to have selection count', 1);
            expect($('#item3'), 'to have css class', 'selected');
        });

        describe('when switching mode', function () {
            var items;
            beforeEach(function () {
                element = specHelper.createTestElement(
                    'foreach: items, selection: { selection: selection, focused: focused, anchor: anchor, mode: mode }',
                    'attr: { id: id }, css: { selected: selected, focused: focused }'
                );

                items = createItems(20);
                model.items = ko.observableArray(items);
                model.mode = ko.observable('multi');
                ko.applyBindings(model, element);
            });

            it('switching to single mode, from multi with an active selection of 3 items should result in only the focused item being in the single mode selection.', function () {
                model.mode('multi');
                model.selection([items[4], items[11], items[15]]);
                model.mode('single');

                expect(model.selection().length, 'to be', 1);
            });

            it('verify that single mode works as expected when changing modes from multi mode.', function () {
                model.mode('multi');
                model.selection([items[4], items[11], items[15]]);
                model.mode('single');

                specHelper.click($('#item2'), { ctrlKey: true });

                expect(model.selection().length, 'to be', 1);
            });

            it('verify that multi mode works as expected when changing modes from single mode.', function () {
                model.mode('single');
                model.selection([items[0]]);
                model.mode('multi');

                specHelper.click($('#item1'), { ctrlKey: true });

                expect(model.selection().length, 'to be', 2);
            });

            it('switching to a non existing mode fails', function () {
                expect(function () {
                    model.mode('nonExistingModeName');
                }, 'to throw', /Unknown mode: "nonExistingModeName"/);
            });
        });

        describe('in late selection mode', function () {
            var items;

            beforeEach(function () {
                element = specHelper.createTestElement(
                    'foreach: items, selection: { selection: selection, focused: focused, anchor: anchor, mode: mode, lateSelect: true }',
                    'attr: { id: id }, css: { selected: selected, focused: focused }'
                );
                items = createItems(2);
                model.items = ko.observableArray(items);
                model.mode = ko.observable('single');
                ko.applyBindings(model, element);
            });

            it('delays selection until mouseup in single mode', function () {
                model.mode('single');

                specHelper.mousedown($('#item1'));
                expect(model.selection(), 'to have length', 0);
                specHelper.mouseup($('#item1'));
                expect(model.selection(), 'to have length', 1);
            });

            it('delays selection until mouseup in multi mode', function () {
                model.mode('multi');

                specHelper.mousedown($('#item1'));
                expect(model.selection(), 'to have length', 0);
                specHelper.mouseup($('#item1'));
                expect(model.selection(), 'to have length', 1);
            });
        });
    });

});
