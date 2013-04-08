/*global ko*/
/*
data-bind="foreach: <observableArray>, selection: <observableArray>"

data-bind="foreach: <observableArray>, selection: { data: <observableArray>, focused: <observable>, single: true, properties: { selected: 'selected', focused: 'focused'} }"
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

            if (bindingValue.data) {
                selection = bindingValue.data;
                focused = bindingValue.focused || ko.observable(null);
                anchor = bindingValue.anchor || ko.observable(null);
                single = bindingValue.single === true;
                ko.utils.extend(properties, bindingValue.properties);
            } else {
                selection = value;
                focused = ko.observable(null);
                anchor = ko.observable(null);
            }

            if (!ko.isObservable(selection)) {
                throw new Error('The selection binding should be bound to either an `observableArray` or a object containing a `data` `observableArray`.');
            }

            if (!foreach) {
                throw new Error('The selection binding can only be used together with `foreach`, `foreach: { data: ... }` or `template: { foreach: ... }`.');
            }

            // Listen to changes in the `selection` so we can update the `selected` property
            selection.subscribe(function (selection) {
                setAll(selection, properties.selected, false);
            }, this, 'beforeChange');

            selection.subscribe(function (newSelection) {
                if(single && newSelection.length > 1){
                    //in single select mode, make sure to select max. 1
                    selection( [ newSelection.slice(-1)[0] ] );
                } else {
                    setAll(newSelection, properties.selected, true);
                }
            });

            foreach.subscribe(function (newItems) {
                if (focused() && newItems.indexOf(focused()) === -1) {
                    focused(null);
                }
                if (anchor() && newItems.indexOf(anchor()) === -1) {
                    anchor(null);
                }
            });

            // Set the `selected` property on the initial selection
            setAll(selection(), properties.selected, true);

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
                    { which: 1, ctrlKey: true, shiftKey: true },
                    { which: 1, metaKey: true, shiftKey: true }, function (event, item) {
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
                    selection(foreach());
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

                if (matchers.key.match(e, item)) {
                    // Prevent the event from propagating if we handled it
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        }
    };
}));
