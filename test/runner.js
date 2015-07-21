/*global mocha, mochaPhantomJS, require, after, beforeEach*/
if (window.mochaPhantomJS) {
    mocha.ui('bdd').reporter(Mocha.BrowserStack);
} else {
    mocha.ui('bdd');
}

mocha.reporter('html');

require([
    'jquery',
    'test/suite',
    'lib/knockout.selection'
], function ($) {
    mocha.globals('jQuery*'); // HACK: Need better way to allow handlers on window during tests.

    if (window.mochaPhantomJS) {
        mochaPhantomJS.run();
    } else {
        mocha.run();
    }
});
