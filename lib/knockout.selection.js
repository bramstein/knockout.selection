/*global ko*/
/*
data-bind="foreach: <observableArray>, selection: <observableArray>"

data-bind="foreach: <observableArray>, selection: { selection: <observableArray>, focused: <observable>, single: true, properties: { selected: 'selected', focused: 'focused'} }"

data-bind="selection: { data: <observableArray>, selection: <observableArray>, focused: <observable>, single: true, properties: { selected: 'selected', focused: 'focused'} }"
*/
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('knockout'), require('eventmatcher'));
    } else if (typeof define === 'function' && define.amd) {
        define(['knockout', 'eventmatcher'], factory);
    } else {
        factory(ko, EventMatcher);
    }
}(this, function (ko, EventMatcher) {
    function createRange(foreach, start, end) {
        var items = foreach(),
            startIndex = ko.utils.arrayIndexOf(items, start),
            endIndex = ko.utils.arrayIndexOf(items, end),
            range = [];

        // Find the correct start and end position
        if (startIndex > endIndex) {
            var tmp = startIndex;
            startIndex = endIndex;
            endIndex = tmp;
        }

        for (var i = startIndex; i <= endIndex; i += 1) {
            range.push(items[i]);
        }
        return range;
    }

    function set(item, property, value) {
        if (item && item.hasOwnProperty(property) && ko.isObservable(item[property])) {
            item[property](value);
        }
    }
    function setAll(items, property, value) {
        ko.utils.arrayForEach(items, function (item) {
            set(item, property, value);
        });
    }

    function SelectionApi(items, selection, focused, anchor) {
        this.items = items;
        this.selection = selection;
        this.focused = focused;
        this.anchor = anchor;
    }

    SelectionApi.prototype.selectAll = function () {
        this.selection(this.items().slice());
    };

    SelectionApi.prototype.selectItem = function (item) {
        // Selecting an item deselects everything and selects that item.
        this.selection([item]);
        this.focused(item);
    };

    SelectionApi.prototype.firstItem = function () {
        return this.items()[0];
    };

    SelectionApi.prototype.lastItem = function () {
        return this.items()[this.items().length - 1];
    };

    SelectionApi.prototype.nextItem = function (item) {
        var position = ko.utils.arrayIndexOf(this.items(), item);
        return this.items()[Math.min(position + 1, this.items().length - 1)];
    };

    SelectionApi.prototype.previousItem = function (item) {
        var position = ko.utils.arrayIndexOf(this.items(), item);
        return this.items()[Math.max(position - 1, 0)];
    };

    SelectionApi.prototype.isAlreadySelected = function (item) {
        return ko.utils.arrayIndexOf(this.selection(), item) !== -1;
    };

    SelectionApi.prototype.toggleSelection = function (item) {
        // Toggling selection only changes
        if (this.isAlreadySelected(item)) {
            this.selection.remove(item);
        } else {
            this.selection.push(item);
        }
        this.focused(item);
    };

    SelectionApi.prototype.appendSelectionFromAnchor = function (item) {
        if (!this.anchor()) { this.anchor(item); }
        // Append the selection from `anchor` to `item` to the existing selection
        this.selection.push.apply(this.selection, createRange(this.items, this.anchor(), item));
        this.focused(item);
    };

    SelectionApi.prototype.replaceSelectionWithRangeFromAnchor = function (item) {
        if (!this.anchor()) { this.anchor(item); }
        // Replace the selection from `anchor` to `data`
        this.selection(createRange(this.items, this.anchor(), item));
        this.focused(item);
    };

    SelectionApi.prototype.findItemData = function (target) {
        var context = ko.contextFor(target);
        while (context && ko.utils.arrayIndexOf(this.items(), context.$data) === -1) {
            context = context.$parentContext;
        }
        return context && context.$data;
    };

    ko.bindingHandlers.selection = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor(),
                bindingValue = ko.utils.unwrapObservable(valueAccessor()),
                allBindings = allBindingsAccessor(),
                single = false,
                properties = {
                    selected: 'selected',
                    focused: 'focused'
                },
                subscriptions = [],
                selection = null,
                focused = null,
                focusedIndex = -1,
                anchor = null,
                foreach = null;

            if (bindingValue.data) {
                foreach = bindingValue.data;
            } else {
                foreach = (allBindings.foreach && allBindings.foreach.data) ||
                           allBindings.foreach ||
                          (allBindings.template && allBindings.template.foreach);
            }

            if (bindingValue.selection) {
                selection = bindingValue.selection;
                focused = bindingValue.focused || ko.observable(null);
                anchor = bindingValue.anchor || ko.observable(null);
                single = bindingValue.single === true;
                ko.utils.extend(properties, bindingValue.properties);
            } else {
                selection = value;
                focused = ko.observable(null);
                anchor = ko.observable(null);
            }

            if (!foreach) {
                throw new Error('The selection binding can only be used together with `foreach`, `foreach: { data: ... }` or `template: { foreach: ... }`.');
            }

            if (!ko.isObservable(selection)) {
                throw new Error('The selection binding should be bound to either an `observableArray` or a object containing a `selection` `observableArray`.');
            }

            var selectionApi = new SelectionApi(foreach, selection, focused, anchor);

            // Listen to changes in the `selection` so we can update the `selected` property
            subscriptions.push(selection.subscribe(function (selection) {
                setAll(selection, properties.selected, false);
            }, this, 'beforeChange'));

            subscriptions.push(selection.subscribe(function (newSelection) {
                if (single && newSelection.length > 1) {
                    //in single select mode, make sure to select max. 1
                    selection([newSelection.slice(-1)[0]]);
                } else {
                    setAll(newSelection, properties.selected, true);
                }
            }));

            function validateSelectionState() {
                var allItems = foreach(),
                    stillPresentSelectedItems = [];

                if (focused() && ko.utils.arrayIndexOf(allItems, focused()) === -1) {
                    var focusOnIndex = Math.min(focusedIndex, allItems.length - 1);
                    if (allItems[focusOnIndex]) {
                        focused(allItems[focusOnIndex]);
                    } else {
                        focused(null);
                    }
                }

                if (anchor() && ko.utils.arrayIndexOf(allItems, anchor()) === -1) {
                    anchor(null);
                }

                ko.utils.arrayForEach(selection(), function (selectedItem) {
                    if (ko.utils.arrayIndexOf(allItems, selectedItem) !== -1) {
                        stillPresentSelectedItems.push(selectedItem);
                    }
                });

                if (stillPresentSelectedItems.length !== selection().length) {
                    selection(stillPresentSelectedItems);
                }
            }

            subscriptions.push(foreach.subscribe(function (newItems) {
                validateSelectionState();
            }));

            // Set the `selected` property on the initial selection
            setAll(selection(), properties.selected, true);

            // Make sure focused, anchor and selection are all in the foreach
            validateSelectionState();

            subscriptions.push(focused.subscribe(function (focused) {
                set(focused, properties.focused, false);
            }, this, 'beforeChange'));

            subscriptions.push(focused.subscribe(function (newFocused) {
                focusedIndex = newFocused ? ko.utils.arrayIndexOf(foreach(), focused()) : -1;
                set(newFocused, properties.focused, true);
            }));

            if (focused()) {
                set(focused(), properties.focused, true);
            }

            function createSingleModeEventMatchers() {
                var matchers = new EventMatcher();

                matchers.register({ type: 'mousedown', which: 1 }, function (event, item) {
                    selectionApi.selectItem(item);
                });

                matchers.register({ type: 'keydown', which: 32 }, function (event, item) {
                    selectionApi.toggleSelection(item);
                });

                matchers.register({ type: 'keydown', which: 35 }, function (event, item) {
                    selectionApi.selectItem(selectionApi.lastItem());
                });

                matchers.register({ type: 'keydown', which: 36 }, function (event, item) {
                    selectionApi.selectItem(selectionApi.firstItem());
                });

                matchers.register({ type: 'keydown', which: 38 }, function (event, item) {
                    selectionApi.selectItem(selectionApi.previousItem(item));
                });

                matchers.register({ type: 'keydown', which: 40 }, function (event, item) {
                    selectionApi.selectItem(selectionApi.nextItem(item));
                });
                return matchers;
            }

            var selectItemOnMouseUp = false;

            function createMultiModeEventMatchers() {
                var matchers = new EventMatcher();

                matchers.register(
                    { type: 'mousedown', which: 1, ctrlKey: true, shiftKey: true },
                    { type: 'mousedown', which: 1, metaKey: true, shiftKey: true }, function (event, item) {
                    selectionApi.appendSelectionFromAnchor(item);
                });

                matchers.register(
                    { type: 'mousedown', which: 1, ctrlKey: true },
                    { type: 'mousedown', which: 1, metaKey: true }, function (event, item) {
                    selectionApi.toggleSelection(item);
                    anchor(item);
                });

                matchers.register({ type: 'mousedown', which: 1, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(item);
                });

                matchers.register({ type: 'mousedown', which: 1 }, function (event, item) {
                    if (ko.utils.arrayIndexOf(selection(), item) === -1) {
                        // Item is not selected
                        selectionApi.selectItem(item);
                        anchor(item);
                    } else {
                        // Item is selected - update selection on mouse up
                        // This will give drag and drop libraries the ability
                        // to cancel the selection event.
                        selectItemOnMouseUp = true;
                    }
                });

                matchers.register({ type: 'keydown', which: 32 }, function (event, item) {
                    selectionApi.toggleSelection(item);
                });

                matchers.register(
                    { type: 'keydown', which: 35, ctrlKey: true, shiftKey: true },
                    { type: 'keydown', which: 35, metaKey: true, shiftKey: true }, function (event, item) {
                    selectionApi.appendSelectionFromAnchor(selectionApi.lastItem());
                });

                matchers.register(
                    { type: 'keydown', which: 35, ctrlKey: true },
                    { type: 'keydown', which: 35, metaKey: true }, function (event, item) {
                    var last = selectionApi.lastItem();
                    focused(last);
                    anchor(last);
                });

                matchers.register({ type: 'keydown', which: 35, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(selectionApi.lastItem());
                });

                matchers.register({ type: 'keydown', which: 35 }, function (event, item) {
                    var last = selectionApi.lastItem();
                    selectionApi.selectItem(last);
                    anchor(last);
                });

                matchers.register(
                    { type: 'keydown', which: 36, ctrlKey: true, shiftKey: true },
                    { type: 'keydown', which: 36, metaKey: true, shiftKey: true }, function (event, item) {
                    selectionApi.appendSelectionFromAnchor(selectionApi.firstItem());
                });

                matchers.register(
                    { type: 'keydown', which: 36, ctrlKey: true },
                    { type: 'keydown', which: 36, metaKey: true }, function (event, item) {
                    var first = selectionApi.firstItem();
                    focused(first);
                    anchor(first);
                });

                matchers.register({ type: 'keydown', which: 36, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(selectionApi.firstItem());
                });

                matchers.register({ type: 'keydown', which: 36 }, function (event, item) {
                    var first = selectionApi.firstItem();
                    selectionApi.selectItem(first);
                    anchor(first);
                });

                matchers.register(
                    { type: 'keydown', which: 38, ctrlKey: true, shiftKey: true },
                    { type: 'keydown', which: 38, metaKey: true, shiftKey: true }, function (event, item) {
                    selectionApi.appendSelectionFromAnchor(selectionApi.previousItem(item));
                });

                matchers.register(
                    { type: 'keydown', which: 38, ctrlKey: true },
                    { type: 'keydown', which: 38, metaKey: true }, function (event, item) {
                    var prev = selectionApi.previousItem(item);
                    focused(prev);
                    anchor(prev);
                });

                matchers.register({ type: 'keydown', which: 38, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(selectionApi.previousItem(item));
                });

                matchers.register({ type: 'keydown', which: 38 }, function (event, item) {
                    var prev = selectionApi.previousItem(item);
                    selectionApi.selectItem(prev);
                    anchor(prev);
                });

                matchers.register(
                    { type: 'keydown', which: 40, ctrlKey: true, shiftKey: true },
                    { type: 'keydown', which: 40, metaKey: true, shiftKey: true }, function (event, item) {
                    selectionApi.appendSelectionFromAnchor(selectionApi.nextItem(item));
                });

                matchers.register(
                    { type: 'keydown', which: 40, ctrlKey: true },
                    { type: 'keydown', which: 40, metaKey: true }, function (event, item) {
                    var next = selectionApi.nextItem(item);
                    focused(next);
                    anchor(next);
                });

                matchers.register({ type: 'keydown', which: 40, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(selectionApi.nextItem(item));
                });

                matchers.register({ type: 'keydown', which: 40 }, function (event, item) {
                    var next = selectionApi.nextItem(item);
                    selectionApi.selectItem(next);
                    anchor(next);
                });

                matchers.register(
                    { type: 'keydown', which: 65, ctrlKey: true },
                    { type: 'keydown', which: 65, metaKey: true }, function (event, item) {
                    selectionApi.selectAll();
                });

                return matchers;
            }

            var matchers = single ? createSingleModeEventMatchers() : createMultiModeEventMatchers();

            ko.utils.registerEventHandler(element, 'mousedown', function (e) {
                var item = selectionApi.findItemData(e.target || e.srcElement);
                if (!item) {
                    return;
                }
                matchers.match(e, item);
            });

            ko.utils.registerEventHandler(element, 'mouseup', function (e) {
                if (selectItemOnMouseUp) {
                    var item = selectionApi.findItemData(e.target || e.srcElement);
                    if (!item) {
                        return;
                    }

                    selectItemOnMouseUp = false;

                    selectionApi.selectItem(item);
                    anchor(item);
                }
            });


            ko.utils.registerEventHandler(element, 'keydown', function (e) {
                var item = focused();

                if (item === null) {
                    return;
                }

                if (matchers.match(e, item)) {
                    // Prevent the event from propagating if we handled it
                    e.preventDefault();
                    e.stopPropagation();
                }
            });

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                subscriptions.forEach(function (subscription) {
                    subscription.dispose();
                });
            });
        }
    };

    return ko.bindingHandlers.selection;
}));
