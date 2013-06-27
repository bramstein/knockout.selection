/*global ko*/
/*
data-bind="foreach: <observableArray>, selection: <observableArray>"

data-bind="foreach: <observableArray>, selection: { selection: <observableArray>, focused: <observable>, single: true, properties: { selected: 'selected', focused: 'focused'} }"

data-bind="selection: { data: <observableArray>, selection: <observableArray>, focused: <observable>, single: true, properties: { selected: 'selected', focused: 'focused'} }"
*/
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('knockout'));
    } else if (typeof define === 'function' && define.amd) {
        define(['knockout'], factory);
    } else {
        factory(ko);
    }
}(this, function (ko) {
    var eventComparison = function (pattern, event) {
        for (var prop in pattern) {
            if (pattern.hasOwnProperty(prop) && pattern[prop] !== event[prop]) {
                return false;
            }
        }
        return true;
    };

    function EventMatcher() {
        this.handlers = [];
    }

    EventMatcher.prototype.register = function (eventPattern, callback) {
        for (var i = 0; i < arguments.length - 1; i += 1) {
            this.handlers.push({
                eventPattern: arguments[i],
                callback: arguments[arguments.length - 1]
            });
        }
    };

    EventMatcher.prototype.match = function (event) {
        var match = ko.utils.arrayFirst(this.handlers, function (handler) {
            return eventComparison(handler.eventPattern, event);
        });
        if (match) {
            match.callback.apply(this, arguments);
            return true;
        }
    };

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

    return ko.bindingHandlers.selection = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = valueAccessor(),
                bindingValue = ko.utils.unwrapObservable(valueAccessor()),
                allBindings = allBindingsAccessor(),
                single = false,
                properties = {
                    selected: 'selected',
                    focused: 'focused'
                },
                selection = null,
                focused = null,
                anchor = null,
                foreach = (allBindings.foreach && allBindings.foreach.data) ||
                           allBindings.foreach ||
                          (allBindings.template && allBindings.template.foreach);

            if (bindingValue.selection) {
                if (!foreach) {
                    foreach = bindingValue.data;
                }

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

            // Listen to changes in the `selection` so we can update the `selected` property
            selection.subscribe(function (selection) {
                setAll(selection, properties.selected, false);
            }, this, 'beforeChange');

            selection.subscribe(function (newSelection) {
                if (single && newSelection.length > 1) {
                    //in single select mode, make sure to select max. 1
                    selection([newSelection.slice(-1)[0]]);
                } else {
                    setAll(newSelection, properties.selected, true);
                }
            });

            function validateSelectionState() {
                var allItems = foreach(),
                    stillPresentSelectedItems = [];

                if (focused() && ko.utils.arrayIndexOf(allItems, focused()) === -1) {
                    focused(null);
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

            foreach.subscribe(function (newItems) {
                validateSelectionState();
            });

            // Set the `selected` property on the initial selection
            setAll(selection(), properties.selected, true);

            // Make sure focused, anchor and selection are all in the foreach
            validateSelectionState();

            focused.subscribe(function (focused) {
                set(focused, properties.focused, false);
            }, this, 'beforeChange');

            focused.subscribe(function (newFocused) {
                set(newFocused, properties.focused, true);
            });

            if (focused()) {
                set(focused(), properties.focused, true);
            }

            function isAlreadySelected(item) {
                return ko.utils.arrayIndexOf(selection(), item) !== -1;
            }

            function appendSelectionFromAnchor(item) {
                if (!anchor()) { anchor(item); }
                // Append the selection from `anchor` to `item` to the existing selection
                selection.push.apply(selection, createRange(foreach, anchor(), item));
                focused(item);
            }

            function replaceSelectionWithRangeFromAnchor(item) {
                if (!anchor()) { anchor(item); }
                // Replace the selection from `anchor` to `data`
                selection(createRange(foreach, anchor(), item));
                focused(item);
            }

            function extendSelection(item) {
                if (!isAlreadySelected(item)) {
                    selection.push(item);
                }
                focused(item);
                anchor(item);
            }

            function selectAll() {
                selection(foreach().slice());
            }

            function toggleSelection(item) {
                // Toggling selection only changes
                if (isAlreadySelected(item)) {
                    selection.remove(item);
                } else {
                    selection.push(item);
                }
                focused(item);
            }

            function selectItem(item) {
                // Selecting an item deselects everything and selects that item.
                selection([item]);
                focused(item);
            }

            function nextItem(item) {
                var items = foreach(),
                    position = ko.utils.arrayIndexOf(items, item);
                return items[Math.min(position + 1, items.length - 1)];
            }

            function previousItem(item) {
                var items = foreach(),
                    position = ko.utils.arrayIndexOf(items, item);
                return items[Math.max(position - 1, 0)];
            }

            function firstItem() {
                return foreach()[0];
            }

            function lastItem() {
                var items = foreach();
                return items[items.length - 1];
            }

            function createSingleModeEventMatchers() {
                var matchers = {
                    click: new EventMatcher(),
                    key: new EventMatcher()
                };

                matchers.click.register({ which: 1 }, function (event, item) {
                    selectItem(item);
                });

                matchers.key.register({ which: 32 }, function (event, item) {
                    toggleSelection(item);
                });

                matchers.key.register({ which: 35 }, function (event, item) {
                    selectItem(lastItem());
                });

                matchers.key.register({ which: 36 }, function (event, item) {
                    selectItem(firstItem());
                });

                matchers.key.register({ which: 38 }, function (event, item) {
                    selectItem(previousItem(item));
                });

                matchers.key.register({ which: 40 }, function (event, item) {
                    selectItem(nextItem(item));
                });
                return matchers;
            }

            var selectItemOnMouseUp = false;

            function createMultiModeEventMatchers() {
                var matchers = {
                    click: new EventMatcher(),
                    key: new EventMatcher()
                };

                matchers.click.register(
                    { which: 1, ctrlKey: true, shiftKey: true },
                    { which: 1, metaKey: true, shiftKey: true }, function (event, item) {
                    appendSelectionFromAnchor(item);
                });

                matchers.click.register(
                    { which: 1, ctrlKey: true },
                    { which: 1, metaKey: true }, function (event, item) {
                    toggleSelection(item);
                    anchor(item);
                });

                matchers.click.register({ which: 1, shiftKey: true }, function (event, item) {
                    replaceSelectionWithRangeFromAnchor(item);
                });

                matchers.click.register({ which: 1 }, function (event, item) {
                    if (ko.utils.arrayIndexOf(selection(), item) === -1) {
                        // Item is not selected
                        selectItem(item);
                        anchor(item);
                    } else {
                        // Item is selected - update selection on mouse up
                        // This will give drag and drop libraries the ability
                        // to cancel the selection event.
                        selectItemOnMouseUp = true;
                    }
                });

                matchers.key.register({ which: 32 }, function (event, item) {
                    if (event.ctrlKey || event.shiftKey) {
                        selectItem(item);
                        anchor(item);
                    } else {
                        toggleSelection(item);
                    }
                });

                matchers.key.register(
                    { which: 35, ctrlKey: true, shiftKey: true },
                    { which: 35, metaKey: true, shiftKey: true }, function (event, item) {
                    appendSelectionFromAnchor(lastItem());
                });

                matchers.key.register(
                    { which: 35, ctrlKey: true },
                    { which: 35, metaKey: true }, function (event, item) {
                    var last = lastItem();
                    focused(last);
                    anchor(last);
                });

                matchers.key.register({ which: 35, shiftKey: true }, function (event, item) {
                    replaceSelectionWithRangeFromAnchor(lastItem());
                });

                matchers.key.register({ which: 35 }, function (event, item) {
                    var last = lastItem();
                    selectItem(last);
                    anchor(last);
                });

                matchers.key.register(
                    { which: 36, ctrlKey: true, shiftKey: true },
                    { which: 36, metaKey: true, shiftKey: true }, function (event, item) {
                    appendSelectionFromAnchor(firstItem());
                });

                matchers.key.register(
                    { which: 36, ctrlKey: true },
                    { which: 36, metaKey: true }, function (event, item) {
                    var first = firstItem();
                    focused(first);
                    anchor(first);
                });

                matchers.key.register({ which: 36, shiftKey: true }, function (event, item) {
                    replaceSelectionWithRangeFromAnchor(firstItem());
                });

                matchers.key.register({ which: 36 }, function (event, item) {
                    var first = firstItem();
                    selectItem(first);
                    anchor(first);
                });

                matchers.key.register(
                    { which: 38, ctrlKey: true, shiftKey: true },
                    { which: 38, metaKey: true, shiftKey: true }, function (event, item) {
                    appendSelectionFromAnchor(previousItem(item));
                });

                matchers.key.register(
                    { which: 38, ctrlKey: true },
                    { which: 38, metaKey: true }, function (event, item) {
                    var prev = previousItem(item);
                    focused(prev);
                    anchor(prev);
                });

                matchers.key.register({ which: 38, shiftKey: true }, function (event, item) {
                    replaceSelectionWithRangeFromAnchor(previousItem(item));
                });

                matchers.key.register({ which: 38 }, function (event, item) {
                    var prev = previousItem(item);
                    selectItem(prev);
                    anchor(prev);
                });

                matchers.key.register(
                    { which: 40, ctrlKey: true, shiftKey: true },
                    { which: 40, metaKey: true, shiftKey: true }, function (event, item) {
                    appendSelectionFromAnchor(nextItem(item));
                });

                matchers.key.register(
                    { which: 40, ctrlKey: true },
                    { which: 40, metaKey: true }, function (event, item) {
                    var next = nextItem(item);
                    focused(next);
                    anchor(next);
                });

                matchers.key.register({ which: 40, shiftKey: true }, function (event, item) {
                    replaceSelectionWithRangeFromAnchor(nextItem(item));
                });

                matchers.key.register({ which: 40 }, function (event, item) {
                    var next = nextItem(item);
                    selectItem(next);
                    anchor(next);
                });

                matchers.key.register(
                    { which: 65, ctrlKey: true },
                    { which: 65, metaKey: true }, function (event, item) {
                    selectAll();
                });

                return matchers;
            }

            var matchers = single ? createSingleModeEventMatchers() : createMultiModeEventMatchers();

            ko.utils.registerEventHandler(element, 'mousedown', function (e) {
                var item = ko.dataFor(e.target || e.srcElement);
                if (ko.utils.arrayIndexOf(foreach(), item) === -1) {
                    return;
                }
                matchers.click.match(e, item);
            });

            ko.utils.registerEventHandler(element, 'mouseup', function (e) {
                if (selectItemOnMouseUp) {
                    var item = ko.dataFor(e.target || e.srcElement);
                    if (ko.utils.arrayIndexOf(foreach(), item) === -1) {
                        return;
                    }

                    selectItemOnMouseUp = false;

                    selectItem(item);
                    anchor(item);
                }
            });


            ko.utils.registerEventHandler(element, 'keydown', function (e) {
                var item = focused();

                if (item === null) {
                    return;
                }

                if (matchers.key.match(e, item)) {
                    // Prevent the event from propagating if we handled it
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        }
    };
}));
