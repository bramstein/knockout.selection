## Knockout.js selection binding

This binding implements a selection model that can be used with Knockout.js's `foreach` and `template` bindings. It handles multiple selections using `<ctrl>`- and `<shift>`-click as well as keyboard navigation.

## Usage

    data-bind="foreach: <observableArray>, selection: <observableArray>"

    data-bind="foreach: <observableArray>, selection: { data: <observableArray>, focus: <observable> }"

## Options

### `data` <observableArray>

An observable array that will reflect the currently selected items from the `foreach` or `template: { foreach: ... }` bindings.

### `focused` <observable>

An observable that contains the currently focused item. This might return `null` if there is no current focus.

### `single` <boolean>

Set to `true` if the selection model should only allow a single selected item. If set to `false` users can use `<ctrl>` and `<shift>` to select multiple items using either a mouse or keyboard. Defaults to `false`.

### `properties` <object>

The selection binding will by default look for `selected` and `focused` observable properties on your `foreach` items and set them to true when the item is selected or focused. Using the `properties` option you can override these default property names to something else. For example:

    data-bind="foreach: mylist, selection: { data: mylistSelection, properties: { selected: 'active', focused: 'highlight' }"

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
