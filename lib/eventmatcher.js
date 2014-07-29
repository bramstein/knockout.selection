(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
        root.EventMatcher = factory();
    }
}(this, function () {
    function compare(pattern, event) {
        for (var prop in pattern) {
            if (pattern.hasOwnProperty(prop) && pattern[prop] !== event[prop]) {
                return false;
            }
        }
        return true;
    }

    function EventMatcher() {
        this.handlers = [];
    }

    EventMatcher.prototype.register = function (pattern, callback) {
        for (var i = 0; i < arguments.length - 1; i += 1) {
            this.handlers.push({
                pattern: arguments[i],
                callback: arguments[arguments.length - 1]
            });
        }
    };

    EventMatcher.prototype.match = function (event, item) {
        for (var i = 0; i < this.handlers.length; i += 1) {
            if (compare(this.handlers[i].pattern, event)) {
                this.handlers[i].callback.call(this, event, item);
                return true;
            }
        }
        return false;
    };

    return EventMatcher;
}));
