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
        this.cleanup();

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
            that.cleanup();
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
    };

    SelectionState.prototype.cleanup = function () {
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
        modes: {
            single: function (selectionApi) {
                if (selectionApi.state.focused()) {
                    selectionApi.state.selection([selectionApi.state.focused()]);
                } else {
                    selectionApi.state.selection.splice(1);
                }

                var matchers = new EventMatcher();

                matchers.register({ type: 'mousedown', which: 1 }, function (event, item) {
                    selectionApi.selectItem(item);
                    selectionApi.state.anchor(item);
                });

                matchers.register({ type: 'keydown', which: 32 }, function (event, item) {
                    selectionApi.toggleSelection(item);
                    selectionApi.state.anchor(item);
                });

                matchers.register({ type: 'keydown', which: 35 }, function (event, item) {
                    var lastItem = selectionApi.lastItem();
                    selectionApi.selectItem(lastItem);
                    selectionApi.state.anchor(lastItem);
                });

                matchers.register({ type: 'keydown', which: 36 }, function (event, item) {
                    var firstItem = selectionApi.firstItem();
                    selectionApi.selectItem(firstItem);
                    selectionApi.state.anchor(firstItem);
                });

                matchers.register({ type: 'keydown', which: 38 }, function (event, item) {
                    var previousItem = selectionApi.previousItem(item);
                    selectionApi.selectItem(previousItem);
                    selectionApi.state.anchor(previousItem);
                });

                matchers.register({ type: 'keydown', which: 40 }, function (event, item) {
                    var nextItem = selectionApi.nextItem(item);
                    selectionApi.selectItem(nextItem);
                    selectionApi.state.anchor(nextItem);
                });

                return matchers;
            },
            multi: function (selectionApi) {
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
                    selectionApi.state.anchor(item);
                });

                matchers.register({ type: 'mousedown', which: 1, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(item);
                });

                var selectItemOnMouseUp = false;

                matchers.register({ type: 'mousedown', which: 1 }, function (event, item) {
                    if (ko.utils.arrayIndexOf(selectionApi.state.selection(), item) === -1) {
                        // Item is not selected
                        selectionApi.selectItem(item);
                        selectionApi.state.anchor(item);
                    } else {
                        // Item is selected - update selection on mouse up
                        // This will give drag and drop libraries the ability
                        // to cancel the selection event.
                        selectItemOnMouseUp = true;
                    }
                });

                matchers.register({ type: 'mouseup', which: 1 }, function (event, item) {
                    if (selectItemOnMouseUp) {
                        selectionApi.selectItem(item);
                        selectionApi.state.anchor(item);
                        selectItemOnMouseUp = false;
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
                    selectionApi.state.focused(last);
                    selectionApi.state.anchor(last);
                });

                matchers.register({ type: 'keydown', which: 35, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(selectionApi.lastItem());
                });

                matchers.register({ type: 'keydown', which: 35 }, function (event, item) {
                    var last = selectionApi.lastItem();
                    selectionApi.selectItem(last);
                    selectionApi.state.anchor(last);
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
                    selectionApi.state.focused(first);
                    selectionApi.state.anchor(first);
                });

                matchers.register({ type: 'keydown', which: 36, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(selectionApi.firstItem());
                });

                matchers.register({ type: 'keydown', which: 36 }, function (event, item) {
                    var first = selectionApi.firstItem();
                    selectionApi.selectItem(first);
                    selectionApi.state.anchor(first);
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
                    selectionApi.state.focused(prev);
                    selectionApi.state.anchor(prev);
                });

                matchers.register({ type: 'keydown', which: 38, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(selectionApi.previousItem(item));
                });

                matchers.register({ type: 'keydown', which: 38 }, function (event, item) {
                    var prev = selectionApi.previousItem(item);
                    selectionApi.selectItem(prev);
                    selectionApi.state.anchor(prev);
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
                    selectionApi.state.focused(next);
                    selectionApi.state.anchor(next);
                });

                matchers.register({ type: 'keydown', which: 40, shiftKey: true }, function (event, item) {
                    selectionApi.replaceSelectionWithRangeFromAnchor(selectionApi.nextItem(item));
                });

                matchers.register({ type: 'keydown', which: 40 }, function (event, item) {
                    var next = selectionApi.nextItem(item);
                    selectionApi.selectItem(next);
                    selectionApi.state.anchor(next);
                });

                matchers.register(
                    { type: 'keydown', which: 65, ctrlKey: true },
                    { type: 'keydown', which: 65, metaKey: true }, function (event, item) {
                    selectionApi.selectAll();
                });

                return matchers;
            }
        },

        getMode: function (modeName) {
            var mode = ko.bindingHandlers.selection.modes[modeName];
            if (!mode) {
                throw new Error('Unknown mode: "' + modeName + '"');
            }
            return mode;
        },

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
                selectionState.mode = ko.observable(config.mode);
            }

            selectionState.init(config);

            var selectionApi = new SelectionApi(selectionState);

            var matchers = ko.bindingHandlers.selection.getMode(selectionState.mode())(selectionApi);
            var modeSubscription = selectionState.mode.subscribe(function (modeName) {
                matchers = ko.bindingHandlers.selection.getMode(selectionState.mode())(selectionApi);
            });

            function handleMouseEvent(e) {
                var item = selectionApi.findItemData(e.target || e.srcElement);
                if (!item) {
                    return;
                }
                matchers.match(e, item);
            }

            ko.utils.registerEventHandler(element, 'mousedown', handleMouseEvent);
            ko.utils.registerEventHandler(element, 'mouseup', handleMouseEvent);

            ko.utils.registerEventHandler(element, 'keydown', function (e) {
                var item = selectionState.focused();
                if (item === null) {
                    return;
                }

                if (matchers.match(e, item)) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            });

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                selectionState.subscriptions.forEach(function (subscription) {
                    subscription.dispose();
                });
                modeSubscription.dispose();
            });
        }
    };

    return ko.bindingHandlers.selection;
}));
