## Knockout.js selection binding

This binding implements a selection model that can be used with Knockout.js's `foreach` and `template` bindings, or other bindings through the `data` option. It handles multiple selections using `<ctrl>`- and `<shift>`-click as well as keyboard navigation.

[![browser support](http://ci.testling.com/bramstein/knockout.selection.png)](http://ci.testling.com/bramstein/knockout.selection)

[![Build Status](https://travis-ci.org/bramstein/knockout.selection.png?branch=master)](https://travis-ci.org/bramstein/knockout.selection)

## Usage

    data-bind="foreach: <observableArray>, selection: <observableArray>"

    data-bind="foreach: <observableArray>, selection: { selection: <observableArray>, focused: <observable> }"

    data-bind="selection: { data: <observableArray>, selection: <observableArray>, focused: <observable> }"

If you want to use the built-in keyboard navigation be sure to set `tabindex` so that your element can have focus and therefor receive keyboard events. See `examples/index.html` for an example on how to set `tabindex`.

## Options

### `data` <observableArray>

An observable array that contains all items available to the selection model, as an alternative to the `foreach` and `template: { foreach: ... }` bindings.

### `selection` <observableArray>

An observable array that will reflect the currently selected items from the `foreach` or `template: { foreach: ... }` bindings, or from the `data` option.

### `focused` <observable>

An observable that contains the currently focused item. This might return `null` if there is no current focus.

### `mode` <string>

Set to `single` if the selection model should only allow a single selected item. If set to `multi` users can use `<ctrl>` and `<shift>` to select multiple items using either a mouse or keyboard. Defaults to `multi`.

### `properties` <object>

The selection binding will by default look for `selected` and `focused` observable properties on your `foreach` items and set them to true when the item is selected or focused. Using the `properties` option you can override these default property names to something else. For example:

    data-bind="foreach: mylist, selection: { selection: mylistSelection, properties: { selected: 'active', focused: 'highlight' }"

This will set the `active` and `highlight` observable properties on items in `mylist` when they are selected or focused.

## Running the tests

This test suite uses [Mocha](http://visionmedia.github.com/mocha/) and
[Expect.js](https://github.com/LearnBoost/expect.js).

You can run the tests in the browser by opening tests.html. It is also
posible to run the tests from the console using [PhantomJS](http://phantomjs.org/), just run `npm test`.

## Contributors

* Sune Sloth Simonsen (@sunesimonsen)
* Andreas Lind Petersen (@papandreou)
* Maarten Winter (@mwoc)

## License

knockout.selection is licensed under the three clause BSD license.
