/*global describe, beforeEach, it */
defineTest([
    'unexpected',
    'lib/eventmatcher'
], function (unexpected, EventMatcher) {
    var expect = unexpected.clone();

    describe('EventMatcher', function () {
        var eventMatcher = null;

        beforeEach(function () {
            eventMatcher = new EventMatcher();
        });

        it('has an empty handlers list', function () {
            expect(eventMatcher.handlers, 'to equal', []);
        });

        it('matches with one handler and one matcher', function (done) {
            eventMatcher.register({ which: 1 }, function (e) {
                expect(e, 'to equal', { which: 1 });
                done();
            });

            eventMatcher.match({ which: 1 });
        });

        it('matches with multiple handlers', function (done) {
            eventMatcher.register({ which: 1 }, function (e) {
                expect(e, 'to equal', { which: 1 });
            });

            eventMatcher.register({ which: 2 }, function (e) {
                expect(e, 'to equal', { which: 2 });
                done();
            });

            eventMatcher.match({ which: 1 });
            eventMatcher.match({ which: 2 });
        });

        it('matches with multiple matchers', function (done) {
            eventMatcher.register({ which: 1 }, { which: 2 }, function (e) {
                done();
            });

            eventMatcher.match({ which: 2 });
        });
    });
});
