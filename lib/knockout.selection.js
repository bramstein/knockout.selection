/*global ko, EventMatcher*/
/*
data-bind="foreach: <observableArray>, selection: <observableArray>"

data-bind="foreach: <observableArray>, selection: { selection: <observableArray>, focused: <observable>, mode: 'single', properties: { selected: 'selected', focused: 'focused'} }"

data-bind="selection: { data: <observableArray>, selection: <observableArray>, focused: <observable>, mode: 'single', properties: { selected: 'selected', focused: 'focused'} }"
*/
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('knockout'), require('./eventmatcher'));
    } else if (typeof define === 'function' && define.amd) {
        define(['knockout', './eventmatcher'], factory);
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

    function SelectionModel() {
        this.items = null;
        this.selection = null;
        this.focused = null;
        this.mode = null;
        this.direction = null;
        this.anchor = null;
        this.focusedIndex = -1;

        this.subscriptions = [];
    }

    function hasCssClass(element, className) {
        return !!(element &&
                  element.className &&
                  element.className.indexOf(className) !== -1 &&
                  element.className.match('\\b' + className  + '\\b'));
    }

    function getParentElement(element) {
        return (element && element.parentNode) || null;
    }

    function insideElementWithClass(element, className, stopSearchingAtElement) {
        stopSearchingAtElement = stopSearchingAtElement || null;
        var currentElement = element;

        while (currentElement) {
            if (hasCssClass(currentElement, className)) {
                return true;
            }

            if (currentElement === stopSearchingAtElement) {
                return false;
            }

            currentElement = getParentElement(currentElement);
        }

        return false;
    }

    SelectionModel.prototype.init = function (config) {
        var that = this;

        if (!this.items) {
            throw new Error('The selection binding can only be used together with `foreach`, `foreach: { data: ... }`, `template: { foreach: ... }` or like `selection: { data: ... }`.');
        }

        if (!ko.isObservable(this.selection)) {
            throw new Error('The selection binding should be bound to either an `observableArray` or a object containing a `selection` `observableArray`.');
        }

        // Make sure focused, anchor and selection are all in the foreach
        setTimeout(function () {
            that.cleanup();
        }, 0);

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

    SelectionModel.prototype.cleanup = function () {
        var allItems = this.items.peek(),
            stillPresentSelectedItems = [];

        if (this.focused.peek() && ko.utils.arrayIndexOf(allItems, this.focused.peek()) === -1) {
            var focusOnIndex = Math.min(this.focusedIndex, allItems.length - 1);
            if (allItems[focusOnIndex]) {
                this.focused(allItems[focusOnIndex]);
            } else {
                this.focused(null);
            }
        }

        if (this.anchor.peek() && ko.utils.arrayIndexOf(allItems, this.anchor.peek()) === -1) {
            this.anchor(null);
        }

        ko.utils.arrayForEach(this.selection.peek(), function (selectedItem) {
            if (ko.utils.arrayIndexOf(allItems, selectedItem) !== -1) {
                stillPresentSelectedItems.push(selectedItem);
            }
        });

        if (stillPresentSelectedItems.length !== this.selection.peek().length) {
            this.selection(stillPresentSelectedItems);
        }
    };

    SelectionModel.prototype.hasHorizontal = function () {
        return this.direction.peek() === 'horizontal';
    };

    SelectionModel.prototype.hasVertical = function () {
        return this.direction.peek() === 'vertical';
    };

    SelectionModel.prototype.selectAll = function () {
        this.selection(this.items().slice());
    };

    SelectionModel.prototype.selectItem = function (item) {
        // Selecting an item deselects everything and selects that item.
        var selection = [];
        if (item) {
            selection.push(item);
        }
        this.selection(selection);
        this.focused(item);
    };

    SelectionModel.prototype.firstItem = function () {
        return this.items()[0];
    };

    SelectionModel.prototype.lastItem = function () {
        return this.items()[this.items().length - 1];
    };

    SelectionModel.prototype.nextItem = function (item) {
        var position = ko.utils.arrayIndexOf(this.items(), item);
        return this.items()[Math.min(position + 1, this.items().length - 1)];
    };

    SelectionModel.prototype.previousItem = function (item) {
        var position = ko.utils.arrayIndexOf(this.items(), item);
        return this.items()[Math.max(position - 1, 0)];
    };

    SelectionModel.prototype.leftItem = function (item) {
        return this.previousItem(item);
    };

    SelectionModel.prototype.aboveItem = function (item) {
        return this.previousItem(item);
    };

    SelectionModel.prototype.rightItem = function (item) {
        return this.nextItem(item);
    };

    SelectionModel.prototype.belowItem = function (item) {
        return this.nextItem(item);
    };

    SelectionModel.prototype.isAlreadySelected = function (item) {
        return ko.utils.arrayIndexOf(this.selection(), item) !== -1;
    };

    SelectionModel.prototype.toggleSelection = function (item) {
        // Toggling selection only changes
        if (this.isAlreadySelected(item)) {
            this.selection.remove(item);
        } else {
            this.selection.push(item);
        }
        this.focused(item);
    };

    SelectionModel.prototype.appendSelectionFromAnchor = function (item) {
        if (!this.anchor()) { this.anchor(item); }
        // Append the selection from `anchor` to `item` to the existing selection
        createRange(this.items, this.anchor(), item).forEach(function (itemToSelect) {
            if (!this.isAlreadySelected(itemToSelect)) {
                this.selection.push(itemToSelect);
            }
        }, this);
        this.focused(item);
    };

    SelectionModel.prototype.replaceSelectionWithRangeFromAnchor = function (item) {
        if (!this.anchor()) { this.anchor(item); }
        // Replace the selection from `anchor` to `data`
        this.selection(createRange(this.items, this.anchor(), item));
        this.focused(item);
    };

    SelectionModel.prototype.findItemData = function (target) {
        var context = ko.contextFor(target);
        while (context && ko.utils.arrayIndexOf(this.items(), context.$data) === -1) {
            context = context.$parentContext;
        }
        return context && context.$data;
    };

    ko.bindingHandlers.selection = {
        modes: {
            single: function (selectionModel) {
                if (selectionModel.focused()) {
                    selectionModel.selection([selectionModel.focused()]);
                } else {
                    selectionModel.selection.splice(1);
                }

                var matchers = new EventMatcher();

                var selectItemOnMouseUp = false;

                matchers.register({ type: 'mousedown', which: 1, hasItem: true, isClickOnToggleElement: false }, function (event, item) {
                    if (selectionModel.lateSelect || selectionModel.isAlreadySelected(item)) {
                        // Item is selected - update selection on mouse up
                        // This will give drag and drop libraries the ability
                        // to cancel the selection event.
                        selectItemOnMouseUp = true;
                    } else {
                        selectionModel.selectItem(item);
                        selectionModel.anchor(item);
                        selectItemOnMouseUp = false;
                    }
                });

                matchers.register({ type: 'mouseup', which: 1, hasItem: true, isClickOnToggleElement: false }, function (event, item) {
                    if (selectItemOnMouseUp) {
                        selectionModel.selectItem(item);
                        selectionModel.anchor(item);
                        selectItemOnMouseUp = false;
                    }
                });

                matchers.register({ type: 'mousedown', which: 1, hasItem: true, isClickOnToggleElement: true }, function (event, item) {
                    selectionModel.selectItem(item);
                    selectionModel.anchor(item);
                });

                matchers.register({ type: 'keydown', which: 32, hasItem: true }, function (event, item) {
                    selectionModel.toggleSelection(item);
                    selectionModel.anchor(item);
                });

                matchers.register({ type: 'keydown', which: 35 }, function (event, item) {
                    var lastItem = selectionModel.lastItem();
                    selectionModel.selectItem(lastItem);
                    selectionModel.anchor(lastItem);
                });

                matchers.register({ type: 'keydown', which: 36 }, function (event, item) {
                    var firstItem = selectionModel.firstItem();
                    selectionModel.selectItem(firstItem);
                    selectionModel.anchor(firstItem);
                });

                if (selectionModel.hasVertical()) {
                    matchers.register(
                        { type: 'keydown', which: 38, hasItem: false },
                        { type: 'keydown', which: 40, hasItem: false }, function (event, item) {
                        var first = selectionModel.firstItem();
                        selectionModel.selectItem(first);
                        selectionModel.anchor(first);
                    });

                    matchers.register({ type: 'keydown', which: 38, hasItem: true }, function (event, item) {
                        var previousItem = selectionModel.aboveItem(item);
                        selectionModel.selectItem(previousItem);
                        selectionModel.anchor(previousItem);
                    });

                    matchers.register({ type: 'keydown', which: 40, hasItem: true }, function (event, item) {
                        var nextItem = selectionModel.belowItem(item);
                        selectionModel.selectItem(nextItem);
                        selectionModel.anchor(nextItem);
                    });
                }

                if (selectionModel.hasHorizontal()) {
                    matchers.register(
                        { type: 'keydown', which: 37, hasItem: false },
                        { type: 'keydown', which: 39, hasItem: false }, function (event, item) {
                        var first = selectionModel.firstItem();
                        selectionModel.selectItem(first);
                        selectionModel.anchor(first);
                    });

                    matchers.register({ type: 'keydown', which: 37, hasItem: true }, function (event, item) {
                        var previousItem = selectionModel.leftItem(item);
                        selectionModel.selectItem(previousItem);
                        selectionModel.anchor(previousItem);
                    });

                    matchers.register({ type: 'keydown', which: 39, hasItem: true }, function (event, item) {
                        var nextItem = selectionModel.rightItem(item);
                        selectionModel.selectItem(nextItem);
                        selectionModel.anchor(nextItem);
                    });
                }

                return matchers;
            },
            toggle: function (selectionModel) {
                var matchers = new EventMatcher();

                matchers.register({ type: 'mousedown', which: 1, hasItem: true }, function (event, item) {
                    selectionModel.toggleSelection(item);
                });

                matchers.register({ type: 'keydown', which: 32, hasItem: true }, function (event, item) {
                    selectionModel.toggleSelection(item);
                });

                return matchers;
            },
            off: function (selectionModel) {
                return new EventMatcher();
            },
            multi: function (selectionModel) {
                var matchers = new EventMatcher();

                matchers.register(
                    { type: 'mousedown', which: 1, ctrlKey: true, shiftKey: true, hasItem: true },
                    { type: 'mousedown', which: 1, metaKey: true, shiftKey: true, hasItem: true }, function (event, item) {
                    selectionModel.appendSelectionFromAnchor(item);
                });

                matchers.register(
                    { type: 'mousedown', which: 1, ctrlKey: true, hasItem: true },
                    { type: 'mousedown', which: 1, metaKey: true, hasItem: true }, function (event, item) {
                    selectionModel.toggleSelection(item);
                    selectionModel.anchor(item);
                });

                matchers.register({ type: 'mousedown', which: 1, shiftKey: true, hasItem: true }, function (event, item) {
                    selectionModel.replaceSelectionWithRangeFromAnchor(item);
                });

                var selectItemOnMouseUp = false;

                matchers.register({ type: 'mousedown', which: 1, hasItem: true, isClickOnToggleElement: false }, function (event, item) {
                    if (selectionModel.lateSelect || selectionModel.isAlreadySelected(item)) {
                        // Item is selected - update selection on mouse up
                        // This will give drag and drop libraries the ability
                        // to cancel the selection event.
                        selectItemOnMouseUp = true;
                    } else {
                        selectionModel.selectItem(item);
                        selectionModel.anchor(item);
                    }
                });

                matchers.register({ type: 'mouseup', which: 1, hasItem: true, isClickOnToggleElement: false }, function (event, item) {
                    if (selectItemOnMouseUp) {
                        selectionModel.selectItem(item);
                        selectionModel.anchor(item);
                        selectItemOnMouseUp = false;
                    }
                });

                matchers.register({ type: 'mousedown', which: 1, hasItem: true, isClickOnToggleElement: true }, function (event, item) {
                    selectionModel.toggleSelection(item);
                    selectionModel.anchor(item);
                });

                matchers.register({ type: 'keydown', which: 32, hasItem: true }, function (event, item) {
                    selectionModel.toggleSelection(item);
                });

                matchers.register(
                    { type: 'keydown', which: 35, ctrlKey: true, shiftKey: true },
                    { type: 'keydown', which: 35, metaKey: true, shiftKey: true }, function (event, item) {
                    selectionModel.appendSelectionFromAnchor(selectionModel.lastItem());
                });

                matchers.register(
                    { type: 'keydown', which: 35, ctrlKey: true },
                    { type: 'keydown', which: 35, metaKey: true }, function (event, item) {
                    var last = selectionModel.lastItem();
                    selectionModel.focused(last);
                    selectionModel.anchor(last);
                });

                matchers.register({ type: 'keydown', which: 35, shiftKey: true }, function (event, item) {
                    selectionModel.replaceSelectionWithRangeFromAnchor(selectionModel.lastItem());
                });

                matchers.register({ type: 'keydown', which: 35 }, function (event, item) {
                    var last = selectionModel.lastItem();
                    selectionModel.selectItem(last);
                    selectionModel.anchor(last);
                });

                matchers.register(
                    { type: 'keydown', which: 36, ctrlKey: true, shiftKey: true },
                    { type: 'keydown', which: 36, metaKey: true, shiftKey: true }, function (event, item) {
                    selectionModel.appendSelectionFromAnchor(selectionModel.firstItem());
                });

                matchers.register(
                    { type: 'keydown', which: 36, ctrlKey: true },
                    { type: 'keydown', which: 36, metaKey: true }, function (event, item) {
                    var first = selectionModel.firstItem();
                    selectionModel.focused(first);
                    selectionModel.anchor(first);
                });

                matchers.register({ type: 'keydown', which: 36, shiftKey: true }, function (event, item) {
                    selectionModel.replaceSelectionWithRangeFromAnchor(selectionModel.firstItem());
                });

                matchers.register({ type: 'keydown', which: 36 }, function (event, item) {
                    var first = selectionModel.firstItem();
                    selectionModel.selectItem(first);
                    selectionModel.anchor(first);
                });

                if (selectionModel.hasVertical()) {
                    matchers.register(
                        { type: 'keydown', which: 38, ctrlKey: false, shiftKey: false, hasItem: false },
                        { type: 'keydown', which: 38, metaKey: false, shiftKey: false, hasItem: false },
                        { type: 'keydown', which: 40, ctrlKey: false, shiftKey: false, hasItem: false },
                        { type: 'keydown', which: 40, metaKey: false, shiftKey: false, hasItem: false }, function (event, item) {
                        var first = selectionModel.firstItem();
                        selectionModel.selectItem(first);
                        selectionModel.anchor(first);
                    });

                    matchers.register(
                        { type: 'keydown', which: 38, ctrlKey: true, shiftKey: true, hasItem: true },
                        { type: 'keydown', which: 38, metaKey: true, shiftKey: true, hasItem: true }, function (event, item) {
                        selectionModel.appendSelectionFromAnchor(selectionModel.aboveItem(item));
                    });

                    matchers.register(
                        { type: 'keydown', which: 38, ctrlKey: true, hasItem: true },
                        { type: 'keydown', which: 38, metaKey: true, hasItem: true }, function (event, item) {
                        var prev = selectionModel.aboveItem(item);
                        selectionModel.focused(prev);
                        selectionModel.anchor(prev);
                    });

                    matchers.register({ type: 'keydown', which: 38, shiftKey: true, hasItem: true }, function (event, item) {
                        selectionModel.replaceSelectionWithRangeFromAnchor(selectionModel.aboveItem(item));
                    });

                    matchers.register({ type: 'keydown', which: 38, hasItem: true }, function (event, item) {
                        var prev = selectionModel.aboveItem(item);
                        selectionModel.selectItem(prev);
                        selectionModel.anchor(prev);
                    });

                    matchers.register(
                        { type: 'keydown', which: 40, ctrlKey: true, shiftKey: true, hasItem: true },
                        { type: 'keydown', which: 40, metaKey: true, shiftKey: true, hasItem: true }, function (event, item) {
                        selectionModel.appendSelectionFromAnchor(selectionModel.belowItem(item));
                    });

                    matchers.register(
                        { type: 'keydown', which: 40, ctrlKey: true, hasItem: true },
                        { type: 'keydown', which: 40, metaKey: true, hasItem: true }, function (event, item) {
                        var next = selectionModel.belowItem(item);
                        selectionModel.focused(next);
                        selectionModel.anchor(next);
                    });

                    matchers.register({ type: 'keydown', which: 40, shiftKey: true, hasItem: true }, function (event, item) {
                        selectionModel.replaceSelectionWithRangeFromAnchor(selectionModel.belowItem(item));
                    });

                    matchers.register({ type: 'keydown', which: 40, hasItem: true }, function (event, item) {
                        var next = selectionModel.belowItem(item);
                        selectionModel.selectItem(next);
                        selectionModel.anchor(next);
                    });
                }

                if (selectionModel.hasHorizontal()) {
                    matchers.register(
                        { type: 'keydown', which: 37, ctrlKey: false, shiftKey: false, hasItem: false },
                        { type: 'keydown', which: 37, metaKey: false, shiftKey: false, hasItem: false },
                        { type: 'keydown', which: 39, ctrlKey: false, shiftKey: false, hasItem: false },
                        { type: 'keydown', which: 39, metaKey: false, shiftKey: false, hasItem: false }, function (event, item) {
                        var first = selectionModel.firstItem();
                        selectionModel.selectItem(first);
                        selectionModel.anchor(first);
                    });

                    matchers.register(
                        { type: 'keydown', which: 37, ctrlKey: true, shiftKey: true, hasItem: true },
                        { type: 'keydown', which: 37, metaKey: true, shiftKey: true, hasItem: true }, function (event, item) {
                        selectionModel.appendSelectionFromAnchor(selectionModel.leftItem(item));
                    });

                    matchers.register(
                        { type: 'keydown', which: 37, ctrlKey: true, hasItem: true },
                        { type: 'keydown', which: 37, metaKey: true, hasItem: true }, function (event, item) {
                        var prev = selectionModel.leftItem(item);
                        selectionModel.focused(prev);
                        selectionModel.anchor(prev);
                    });

                    matchers.register({ type: 'keydown', which: 37, shiftKey: true, hasItem: true }, function (event, item) {
                        selectionModel.replaceSelectionWithRangeFromAnchor(selectionModel.leftItem(item));
                    });

                    matchers.register({ type: 'keydown', which: 37, hasItem: true }, function (event, item) {
                        var prev = selectionModel.leftItem(item);
                        selectionModel.selectItem(prev);
                        selectionModel.anchor(prev);
                    });

                    matchers.register(
                        { type: 'keydown', which: 39, ctrlKey: true, shiftKey: true, hasItem: true },
                        { type: 'keydown', which: 39, metaKey: true, shiftKey: true, hasItem: true }, function (event, item) {
                        selectionModel.appendSelectionFromAnchor(selectionModel.rightItem(item));
                    });

                    matchers.register(
                        { type: 'keydown', which: 39, ctrlKey: true, hasItem: true },
                        { type: 'keydown', which: 39, metaKey: true, hasItem: true }, function (event, item) {
                        var next = selectionModel.rightItem(item);
                        selectionModel.focused(next);
                        selectionModel.anchor(next);
                    });

                    matchers.register({ type: 'keydown', which: 39, shiftKey: true, hasItem: true }, function (event, item) {
                        selectionModel.replaceSelectionWithRangeFromAnchor(selectionModel.rightItem(item));
                    });

                    matchers.register({ type: 'keydown', which: 39, hasItem: true }, function (event, item) {
                        var next = selectionModel.rightItem(item);
                        selectionModel.selectItem(next);
                        selectionModel.anchor(next);
                    });
                }

                matchers.register(
                    { type: 'keydown', which: 65, ctrlKey: true },
                    { type: 'keydown', which: 65, metaKey: true }, function (event, item) {
                    selectionModel.selectAll();
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
                    direction: 'vertical',
                    properties: {
                        selected: 'selected',
                        focused: 'focused'
                    }
                };

            var selectionModel = new SelectionModel();

            if (bindingValue.data) {
                selectionModel.items = bindingValue.data;
            } else {
                selectionModel.items = (allBindings.foreach && allBindings.foreach.data) ||
                           allBindings.foreach ||
                          (allBindings.template && allBindings.template.foreach);
            }

            if (bindingValue.selection) {
                selectionModel.selection = bindingValue.selection;
                selectionModel.focused = bindingValue.focused || ko.observable(null);
                selectionModel.anchor = bindingValue.anchor || ko.observable(null);
                selectionModel.toggleClass = bindingValue.toggleClass || null;

                if (ko.isObservable(bindingValue.mode)) {
                    selectionModel.mode = bindingValue.mode;
                } else {
                    selectionModel.mode = ko.observable(bindingValue.mode || config.mode);
                }

                if (ko.isObservable(bindingValue.direction)) {
                    selectionModel.direction = bindingValue.direction;
                } else {
                    selectionModel.direction = ko.observable(bindingValue.direction || config.direction);
                }

                ko.utils.extend(config.properties, bindingValue.properties);

                selectionModel.lateSelect = !!bindingValue.lateSelect;
            } else {
                selectionModel.selection = value;
                selectionModel.focused = ko.observable(null);
                selectionModel.anchor = ko.observable(null);
                selectionModel.mode = ko.observable(config.mode);
                selectionModel.direction = ko.observable(config.direction);
                selectionModel.lateSelect = false;
            }

            selectionModel.init(config);

            var matchers = ko.bindingHandlers.selection.getMode(selectionModel.mode())(selectionModel);
            var modeSubscription = selectionModel.mode.subscribe(function (modeName) {
                matchers = ko.bindingHandlers.selection.getMode(selectionModel.mode())(selectionModel);
            });

            var directionSubscription = selectionModel.direction.subscribe(function (direction) {
                matchers = ko.bindingHandlers.selection.getMode(selectionModel.mode.peek())(selectionModel);
            });

            function isClickOnToggleElement(element, event) {
                var toggleClass = selectionModel.toggleClass;
                return toggleClass ? insideElementWithClass(event.target, toggleClass, element) : false;
            }

            function matchEventWithItem(e) {
                var item = selectionModel.findItemData(e.target || e.srcElement);

                e.hasItem = !!item;
                e.isClickOnToggleElement = isClickOnToggleElement(this, e);

                matchers.match(e, item);
            }

            ko.utils.registerEventHandler(element, 'touchstart', matchEventWithItem);
            ko.utils.registerEventHandler(element, 'touchend', matchEventWithItem);
            ko.utils.registerEventHandler(element, 'touchmove', matchEventWithItem);

            ko.utils.registerEventHandler(element, 'mousedown', matchEventWithItem);
            ko.utils.registerEventHandler(element, 'mouseup', matchEventWithItem);

            ko.utils.registerEventHandler(element, 'keydown', function (e) {
                var item = selectionModel.focused();

                e.hasItem = !!item;

                if (matchers.match(e, item)) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            });

            ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                selectionModel.cleanup();
                ko.utils.arrayForEach(selectionModel.subscriptions, function (subscription) {
                    subscription.dispose();
                });
                modeSubscription.dispose();
                directionSubscription.dispose();
            });
        }
    };

    return ko.bindingHandlers.selection;
}));
