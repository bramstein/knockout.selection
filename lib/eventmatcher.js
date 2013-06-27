(function (root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.EventMatcher = factory();
  }
}(this, function () {
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
    for (var i = 0; i < this.handlers.length; i += 1) {
      if (eventComparison(this.handlers[i].eventPattern, event)) {
        this.handlers[i].callback.apply(this, arguments);
        return true;
      }
    }
    return false;
  };

  return EventMatcher;
}));
