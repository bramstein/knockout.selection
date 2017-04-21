## Knockout.js selection binding [![Build Status](https://travis-ci.org/bramstein/knockout.selection.png?branch=master)](https://travis-ci.org/bramstein/knockout.selection)

This binding implements a selection model that can be used with Knockout.js's `foreach` and `template` bindings, or other bindings through the `data` option. It handles multiple selections using `<ctrl>`- and `<shift>`-click as well as keyboard navigation.

## Usage

    data-bind="foreach: <observableArray>, selection: <observableArray>"

    data-bind="foreach: <observableArray>, selection: { selection: <observableArray>, focused: <observable> }"

    data-bind="selection: { data: <observableArray>, selection: <observableArray>, focused: <observable> }"

If you want to use the built-in keyboard navigation be sure to set `tabindex` so that your element can have focus and therefor receive keyboard events. See `examples/index.html` for an example on how to set `tabindex`.

## Options

### `data` \<observableArray\>

An observable array that contains all items available to the selection model, as an alternative to the `foreach` and `template: { foreach: ... }` bindings.

### `selection` \<observableArray\>

An observable array that will reflect the currently selected items from the `foreach` or `template: { foreach: ... }` bindings, or from the `data` option.

### `focused` \<observable\>

An observable that contains the currently focused item. This might return `null` if there is no current focus.

### `mode` \<observable\>

Set to `single` if the selection model should only allow a single selected item.

If set to `multi` users can use `<ctrl>` and `<shift>` to select multiple items using either a mouse or keyboard.

When set to `toggle` the selection model supports multiple selections, but selections are "sticky". Once selected they can only be deselect by selecting them again. This is useful on, for example, touch devices.

Set to `off` to disable the selection.

Defaults to `multi`.

The mode will be altered on the fly when the value of the observable changes.

### `direction` \<string\>

Set to `horizontal` to allow navigating with left/right arrow keys, when `mode` is either `single` or `multi`.

When set to `vertical`, the up/down arrow keys are available for navigating.

Defaults to `vertical`.

### `properties` \<object\>

The selection binding will by default look for `selected` and `focused` observable properties on your `foreach` items and set them to true when the item is selected or focused. Using the `properties` option you can override these default property names to something else. For example:

    data-bind="foreach: mylist, selection: { selection: mylistSelection, properties: { selected: 'active', focused: 'highlight' }"

This will set the `active` and `highlight` observable properties on items in `mylist` when they are selected or focused.

### `toggleClass` \<string\>

In multi selection mode you can mark an element as a selection toggle. Clicking inside such an element will toggle the selection of the item the same way `<ctrl>`-clicking does.

This is useful if you want checkboxes for the selected items.

Example where the `toggleClass` is set to `checkbox`:

```html
<ul data-bind="foreach: items,
               selection: { selection: selection, toggleClass: 'checkbox' }">
    <li data-bind="css: { selected: selected, focused: focused }">
        <span class="checkbox"></span>
        <span data-bind="text: text"></span>
    </li>
</ul>
```

### `lateSelect` \<boolean\>

When `true`, delays selection of items to the `mouseup` event, which is useful when you need to intercept events, react to selections without interrupting either this library or for example drag-and-drop actions, etc. Mouseup events on a different element from the mousedown event will not select.

## Running the tests

This test suite uses [Mocha](http://visionmedia.github.com/mocha/) and
[Expect.js](https://github.com/LearnBoost/expect.js).

You can run the tests in the browser by opening tests.html. It is also
posible to run the tests from the console using [PhantomJS](http://phantomjs.org/), just run `npm test`.

## Browser Support

This project supports the latest Internet Explorer, Firefox, Opera, Chrome, Safari, and Android browsers. Tests are run automatically on [all supported browsers](browsers.json) using [BrowserStack](http://www.browserstack.com/) and [browserstack-test](https://github.com/bramstein/browserstack-test).

## Contributors

* Sune Sloth Simonsen (@sunesimonsen)
* Andreas Lind Petersen (@papandreou)
* Maarten Winter (@mwoc)
* Gustav Nikolaj Olsen (@gustavnikolaj)

## License

knockout.selection is licensed under the three clause BSD license.
