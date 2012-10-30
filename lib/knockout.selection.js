/*global ko*/
/*
data-bind="foreach: <observableArray>, selection: <observableArray>"

data-bind="foreach: <observableArray>, selection: { data: <observableArray>, focus: <observable>, single: true, properties: { selected: 'selected', focused: 'focused'} }"
*/
(function () {
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
        }
    };

    function createRange(foreach, start, end) {
        var startIndex = foreach.indexOf(start),
            endIndex = foreach.indexOf(end),
            items = foreach(),
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
                selection = null,
                focused = null,
                anchor = null,
                foreach = (allBindings.foreach && allBindings.foreach.data) ||
                           allBindings.foreach ||
                          (allBindings.template && allBindings.template.foreach);

            if (bindingValue.data) {
                selection = bindingValue.data;
                focused = bindingValue.focus || ko.observable(null);
                anchor = bindingValue.anchor || ko.observable(null);
                single = bindingValue.single === true;
                ko.utils.extend(properties, bindingValue.properties);
            } else {
                selection = value;
                focused = ko.observable(null);
                anchor = ko.observable(null);
            }

            if (!ko.isObservable(selection)) {
                throw 'The selection binding should be bound to either an `observableArray` or a object containing a `data` `observableArray`.';
            }

            if (!foreach) {
                throw 'The selection binding can only be used together with `foreach`, `foreach: { data: ... }` or `template: { foreach: ... }`.';
            }

            // Listen to changes in the `selection` so we can update the `selected` property
            selection.subscribe(function (selection) {
                setAll(selection, properties.selected, false);
            }, this, 'beforeChange');

            selection.subscribe(function (newSelection) {
                setAll(newSelection, properties.selected, true);
            });

            // Set the `selected` property on the initial selection
            setAll(selection, properties.selected, true);

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
                return selection.indexOf(item) !== -1;
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

            function toggleSelection(item) {
                if (isAlreadySelected(item)) {
                    selection([]);
                } else {
                    selection([item]);
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
                    position = items.indexOf(item);
                return items[Math.min(position + 1, items.length - 1)];
            }

            function previousItem(item) {
                var items = foreach(),
                    position = items.indexOf(item);
                return items[Math.max(position - 1, 0)];
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

                matchers.key.register({ which: 38 }, function (event, item) {
                    selectItem(previousItem(item));
                });

                matchers.key.register({ which: 40 }, function (event, item) {
                    selectItem(nextItem(item));
                });
                return matchers;
            }

            function createMultiModeEventMatchers() {
                var matchers = {
                    click: new EventMatcher(),
                    key: new EventMatcher()
                };

                matchers.click.register(
                    { which: 1, ctrlKey: true, shift: true },
                    { which: 1, metaKey: true, shift: true }, function (event, item) {
                    appendSelectionFromAnchor(item);
                });

                matchers.click.register(
                    { which: 1, ctrlKey: true },
                    { which: 1, metaKey: true }, function (event, item) {
                    if (isAlreadySelected(item)) {
                        selection.remove(item);
                    } else {
                        selection.push(item);
                    }
                    anchor(item);
                    focused(item);
                });

                matchers.click.register({ which: 1, shiftKey: true }, function (event, item) {
                    replaceSelectionWithRangeFromAnchor(item);
                });

                matchers.click.register({ which: 1 }, function (event, item) {
                    selectItem(item);
                    anchor(item);
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
                    { which: 38, ctrlKey: true, shiftKey: true },
                    { which: 38, metaKey: true, shiftKey: true }, function (event, item) {
                    appendSelectionFromAnchor(previousItem(item));
                });

                matchers.key.register(
                    { which: 38, ctrlKey: true },
                    { which: 38, metaKey: true }, function (event, item) {
                    extendSelection(previousItem(item));
                });

                matchers.key.register({ which: 38, shiftKey: true }, function (event, item) {
                    replaceSelectionWithRangeFromAnchor(previousItem(item));
                });

                matchers.key.register({ which: 38 }, function (event, item) {
                    selectItem(previousItem(item));
                    anchor(item);
                });

                matchers.key.register(
                    { which: 40, ctrlKey: true, shiftKey: true },
                    { which: 40, metaKey: true, shiftKey: true }, function (event, item) {
                    appendSelectionFromAnchor(nextItem(item));
                });

                matchers.key.register(
                    { which: 40, ctrlKey: true },
                    { which: 40, metaKey: true }, function (event, item) {
                    extendSelection(nextItem(item));
                });

                matchers.key.register({ which: 40, shiftKey: true }, function (event, item) {
                    replaceSelectionWithRangeFromAnchor(nextItem(item));
                });

                matchers.key.register({ which: 40 }, function (event, item) {
                    selectItem(nextItem(item));
                    anchor(item);
                });

                return matchers;
            }

            var matchers = single ? createSingleModeEventMatchers() : createMultiModeEventMatchers();

            ko.utils.registerEventHandler(element, 'mousedown', function (e) {
                var item = ko.dataFor(e.target);
                if (foreach.indexOf(item) === -1) {
                    return;
                }
                matchers.click.match(e, item);
            });


            ko.utils.registerEventHandler(element, 'keydown', function (e) {
                var item = focused();

                if (item === null) {
                    return;
                }

                matchers.key.match(e, item);

                // Prevent the event from propogating
                e.preventDefault();
                e.stopPropagation();
            });
        }
    };
}());
