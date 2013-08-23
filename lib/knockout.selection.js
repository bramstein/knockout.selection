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

    function SelectionState() {
        this.items = null;
        this.selection = null;
        this.focused = null;
        this.mode = null;
        this.anchor = null;
        this.focusedIndex = -1;

        this.subscriptions = [];
    }

    SelectionState.prototype.init = function (config) {
        var that = this;

        if (!this.items) {
            throw new Error('The selection binding can only be used together with `foreach`, `foreach: { data: ... }` or `template: { foreach: ... }`.');
        }

        if (!ko.isObservable(this.selection)) {
            throw new Error('The selection binding should be bound to either an `observableArray` or a object containing a `selection` `observableArray`.');
        }

        // Make sure focused, anchor and selection are all in the foreach
        this.cleanUpState();

        this.subscriptions.push(this.focused.subscribe(function (newFocused) {
            that.focusedIndex = newFocused ? ko.utils.arrayIndexOf(that.items(), that.focused()) : -1;
        }));

        // Listen to changes in the `selection` so we can update the `selected` property
        this.subscriptions.push(this.selection.subscribe(function (selection) {
            setAll(that.selection(), config.properties.selected, false);
        }, this, 'beforeChange'));

        this.subscriptions.push(this.selection.subscribe(function (newSelection) {
            if (that.mode() === 'single' && newSelection.length > 1) {
                //in single select mode, make sure to select max. 1
                that.selection([newSelection.slice(-1)[0]]);
            } else {
                setAll(newSelection, config.properties.selected, true);
            }
        }));

        this.subscriptions.push(this.items.subscribe(function (newItems) {
            that.cleanUpState();
        }));

        // Set the `selected` property on the initial selection
        setAll(this.selection(), config.properties.selected, true);

        this.subscriptions.push(this.focused.subscribe(function (focused) {
            set(focused, config.properties.focused, false);
        }, this, 'beforeChange'));

        this.subscriptions.push(this.focused.subscribe(function (newFocused) {
            set(newFocused, config.properties.focused, true);
        }));

        if (this.focused()) {
            set(this.focused(), config.properties.focused, true);
        }

        if (['single', 'multi'].indexOf(this.mode()) === -1) {
            throw new Error('Unknown mode: "' + this.mode() + '"');
        }
    };

    SelectionState.prototype.cleanUpState = function () {
        var allItems = this.items(),
            stillPresentSelectedItems = [];

        if (this.focused() && ko.utils.arrayIndexOf(allItems, this.focused()) === -1) {
            var focusOnIndex = Math.min(this.focusedIndex, allItems.length - 1);
            if (allItems[focusOnIndex]) {
                this.focused(allItems[focusOnIndex]);
            } else {
                this.focused(null);
            }
        }

        if (this.anchor() && ko.utils.arrayIndexOf(allItems, this.anchor()) === -1) {
            this.anchor(null);
        }

        ko.utils.arrayForEach(this.selection(), function (selectedItem) {
            if (ko.utils.arrayIndexOf(allItems, selectedItem) !== -1) {
                stillPresentSelectedItems.push(selectedItem);
            }
        });

        if (stillPresentSelectedItems.length !== this.selection().length) {
            this.selection(stillPresentSelectedItems);
        }
    };

    function SelectionApi(selectionState) {
        this.state = selectionState;
    }

    SelectionApi.prototype.selectAll = function () {
        this.state.selection(this.state.items().slice());
    };

    SelectionApi.prototype.selectItem = function (item) {
        // Selecting an item deselects everything and selects that item.
        this.state.selection([item]);
        this.state.focused(item);
    };

    SelectionApi.prototype.firstItem = function () {
        return this.state.items()[0];
    };

    SelectionApi.prototype.lastItem = function () {
        return this.state.items()[this.state.items().length - 1];
    };

    SelectionApi.prototype.nextItem = function (item) {
        var position = ko.utils.arrayIndexOf(this.state.items(), item);
        return this.state.items()[Math.min(position + 1, this.state.items().length - 1)];
    };

    SelectionApi.prototype.previousItem = function (item) {
        var position = ko.utils.arrayIndexOf(this.state.items(), item);
        return this.state.items()[Math.max(position - 1, 0)];
    };

    SelectionApi.prototype.isAlreadySelected = function (item) {
        return ko.utils.arrayIndexOf(this.state.selection(), item) !== -1;
    };

    SelectionApi.prototype.toggleSelection = function (item) {
        // Toggling selection only changes
        if (this.isAlreadySelected(item)) {
            this.state.selection.remove(item);
        } else {
            this.state.selection.push(item);
        }
        this.state.focused(item);
    };

    SelectionApi.prototype.appendSelectionFromAnchor = function (item) {
        if (!this.state.anchor()) { this.state.anchor(item); }
        // Append the selection from `anchor` to `item` to the existing selection
        this.state.selection.push.apply(this.state.selection, createRange(this.state.items, this.state.anchor(), item));
        this.state.focused(item);
    };

    SelectionApi.prototype.replaceSelectionWithRangeFromAnchor = function (item) {
        if (!this.state.anchor()) { this.state.anchor(item); }
        // Replace the selection from `anchor` to `data`
        this.state.selection(createRange(this.state.items, this.state.anchor(), item));
        this.state.focused(item);
    };

    SelectionApi.prototype.findItemData = function (target) {
        var context = ko.contextFor(target);
        while (context && ko.utils.arrayIndexOf(this.state.items(), context.$data) === -1) {
            context = context.$parentContext;
        }
        return context && context.$data;
    };

    ko.bindingHandlers.selection = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor(),
                bindingValue = ko.utils.unwrapObservable(valueAccessor()),
                allBindings = allBindingsAccessor(),
                config = {
                    mode: 'multi',
                    properties: {
                        selected: 'selected',
                        focused: 'focused'
                    }
                };

            var selectionState = new SelectionState();

            if (bindingValue.data) {
                selectionState.items = bindingValue.data;
            } else {
                selectionState.items = (allBindings.foreach && allBindings.foreach.data) ||
                           allBindings.foreach ||
                          (allBindings.template && allBindings.template.foreach);
            }

            if (bindingValue.selection) {
                selectionState.selection = bindingValue.selection;
                selectionState.focused = bindingValue.focused || ko.observable(null);
                selectionState.anchor = bindingValue.anchor || ko.observable(null);

                if (ko.isObservable(bindingValue.mode)) {
                    selectionState.mode = bindingValue.mode;
                } else {
                    selectionState.mode = ko.observable(bindingValue.mode || config.mode);
                }
                ko.utils.extend(config.properties, bindingValue.properties);
            } else {
                selectionState.selection = value;
                selectionState.focused = ko.observable(null);
                selectionState.anchor = ko.observable(null);
            }

            selectionState.init(config);

            var selectionApi = new SelectionApi(selectionState);

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
                    selectionState.anchor(item);
                });

                matchers.register({ type: 'mousedown', which: 1, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(item);
                });

                matchers.register({ type: 'mousedown', which: 1 }, function (event, item) {
                    if (ko.utils.arrayIndexOf(selectionState.selection(), item) === -1) {
                        // Item is not selected
                        selectionApi.selectItem(item);
                        selectionState.anchor(item);
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
                    selectionState.focused(last);
                    selectionState.anchor(last);
                });

                matchers.register({ type: 'keydown', which: 35, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(selectionApi.lastItem());
                });

                matchers.register({ type: 'keydown', which: 35 }, function (event, item) {
                    var last = selectionApi.lastItem();
                    selectionApi.selectItem(last);
                    selectionState.anchor(last);
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
                    selectionState.focused(first);
                    selectionState.anchor(first);
                });

                matchers.register({ type: 'keydown', which: 36, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(selectionApi.firstItem());
                });

                matchers.register({ type: 'keydown', which: 36 }, function (event, item) {
                    var first = selectionApi.firstItem();
                    selectionApi.selectItem(first);
                    selectionState.anchor(first);
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
                    selectionState.focused(prev);
                    selectionState.anchor(prev);
                });

                matchers.register({ type: 'keydown', which: 38, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(selectionApi.previousItem(item));
                });

                matchers.register({ type: 'keydown', which: 38 }, function (event, item) {
                    var prev = selectionApi.previousItem(item);
                    selectionApi.selectItem(prev);
                    selectionState.anchor(prev);
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
                    selectionState.focused(next);
                    selectionState.anchor(next);
                });

                matchers.register({ type: 'keydown', which: 40, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(selectionApi.nextItem(item));
                });

                matchers.register({ type: 'keydown', which: 40 }, function (event, item) {
                    var next = selectionApi.nextItem(item);
                    selectionApi.selectItem(next);
                    selectionState.anchor(next);
                });

                matchers.register(
                    { type: 'keydown', which: 65, ctrlKey: true },
                    { type: 'keydown', which: 65, metaKey: true }, function (event, item) {
                    selectionApi.selectAll();
                });

                return matchers;
            }

            var matchers = selectionState.mode() === 'single' ? createSingleModeEventMatchers() : createMultiModeEventMatchers();

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
                    selectionState.anchor(item);
                }
            });


            ko.utils.registerEventHandler(element, 'keydown', function (e) {
                var item = selectionState.focused();

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
                selectionState.subscriptions.forEach(function (subscription) {
                    subscription.dispose();
                });
            });
        }
    };

    return ko.bindingHandlers.selection;
}));
