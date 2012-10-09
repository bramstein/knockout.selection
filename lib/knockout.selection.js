/*

data-bind="foreach: <observableArray>, selection: <observableArray>"

data-bind="foreach: <observableArray>, selection: { data: <observableArray>, focus: <observable>, single: true, properties: { selected: 'selected', focused: 'focused'} }"
*/
(function() {
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
        if (item.hasOwnProperty(property) && ko.isObservable(item[property])) {
            item[property](value);
        }
    }

    ko.bindingHandlers.selection = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
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

            function clearSelected(range) {
                ko.utils.arrayForEach(range, function(item) {
                    set(item, properties.selected, false);
                });
            }

            function setSelected(range) {
                ko.utils.arrayForEach(range, function(item) {
                    set(item, properties.selected, true);
                });
            }

            // Listen to changes in the `selection` so we can update the `selected` property
            selection.subscribe(function(newSelection) {
                clearSelected(selection());
                setSelected(newSelection);
            });

            // Set the `selected` property on the initial selection
            setSelected(selection());

            if (focused()) {
                set(focused(), properties.focused, true);
            }

            focused.subscribe(function(newFocused) {
                set(focused(), properties.focused, false);
                set(newFocused, properties.focused, true);
            });

            ko.utils.registerEventHandler(element, 'mousedown', function(e) {
                var item = ko.dataFor(e.target);

                // Only process the mouse event if the left mouse button was used and the item clicked on is a valid item
                if (e.which === 1 && foreach.indexOf(item) !== -1) {
                    var alreadySelected = selection.indexOf(item) !== -1;

                    if (!single && (e.ctrlKey || e.shiftKey)) {
                        if (!anchor()) {
                            anchor(item);
                        }

                        if (e.ctrlKey && e.shiftKey) {
                            var range = createRange(foreach, anchor(), item);

                            // Append the selection from `anchor` to `item` to the existing selection
                            selection.push.apply(selection, range);

                            // Set `selected` property on each new item
                            setSelected(range);
                        } else if (e.ctrlKey) {
                            if (alreadySelected) {
                                selection.remove(item);
                                clearSelected([item]);
                            } else {
                                selection.push(item);
                                setSelected([item]);
                            }
                        } else if (e.shiftKey) {
                            var range = createRange(foreach, anchor(), item);

                            // Since we are replacing the existing selection we set all `selected` properties to `false`
                            clearSelected(selection());

                            // Replace the selection from `anchor` to `data`
                            selection(range);

                            // Set all items in the new selection to `selected`
                            setSelected(range);
                        }
                    } else {
                        // Clear the `selected` property on the existing selection
                        clearSelected(selection());

                        // Clicking on any valid item without modifiers deselects
                        // everything and selects that item.
                        selection([item]);

                        setSelected(selection());
                    }

                    // Always set the focus when we select a valid data item
                    if (focused()) {
                        set(focused(), properties.focused, false);
                    }
                    focused(item);
                    set(item, properties.focused, true);

                    if (!e.shiftKey) {
                        anchor(item);
                    }
                }
            });

            ko.utils.registerEventHandler(element, 'keydown', function(e) {
                var item = focused();

                // Only handle key events if we have a focused item and one of <up>, <down>, or <space> is used
                if (item !== null && (e.which === 38 || e.which === 40 || e.which === 32)) {
                    var items = foreach(),
                        position = items.indexOf(item),
                        alreadySelected = false;

                    // Find the correct position depending on whether the user pressed <up> or <down>
                    if (e.which === 38) {
                        item = items[Math.max(position - 1, 0)];
                    } else if (e.which === 40) {
                        item = items[Math.min(position + 1, items.length - 1)];
                    }

                    alreadySelected = selection.indexOf(item) !== -1;

                    if (!single && (e.ctrlKey || e.shiftKey)) {
                        if (!anchor()) {
                            anchor(item);
                        }

                        if (e.ctrlKey && e.shiftKey) {
                            var range = createRange(foreach, anchor(), item);

                            // Append the selection from `anchor` to `data` to the existing selection
                            selection.push.apply(selection, range);

                            setSelected(range);
                        } else if (e.ctrlKey) {
                            if (!alreadySelected) {
                                selection.push(item);
                                setSelected([item]);
                            }
                        } else if (e.shiftKey) {
                            var range = createRange(foreach, anchor(), item);

                            clearSelected(selection());

                            // Replace the selection from `anchor` to `data`
                            selection(range);

                            setSelected(range);
                        }
                    } else {
                        // Toggle when <space> is pressed, otherwise select it
                        if (e.which === 32 && alreadySelected) {
                            clearSelected(selection());
                            selection([]);
                        } else {
                            clearSelected(selection());

                            selection([item]);

                            setSelected(selection());
                        }
                    }

                    // Always focus the item
                    if (focused()) {
                        set(focused(), properties.focused, false);
                    }
                    focused(item);
                    set(item, properties.focused, true);

                    if (!e.shiftKey) {
                        anchor(item);
                    }

                    // Prevent the event from propogating
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        }
    };
}());
