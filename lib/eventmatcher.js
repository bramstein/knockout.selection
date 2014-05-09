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

    function hasProperty(obj, property) {
        return property in obj;
    }

	var isKeyEvent = /^key/;
	var isMouseEvent = /^(?:mouse|contextmenu)|click/;
    function nomalizeEvent(event) {
        // Normalize events like jQuery

		// Support: IE<9
		// Fix target property
		if (!hasProperty(event, 'target')) {
			event.target = event.srcElement || document;
		}

		// Support: Chrome 23+, Safari?
		// Target should not be a text node
		if (event.target.nodeType === 3) {
			event.target = event.target.parentNode;
		}

		// Support: IE<9
		// For mouse/key events, metaKey==false if it's undefined
		event.metaKey = !!event.metaKey;

        if (isKeyEvent.test(event.type)) {
			// Add which for key events
			if (!hasProperty(event, 'which')) {
				event.which = typeof event.charCode === 'undefined' ?
                    event.charCode : event.keyCode;
			}
        } else if (isMouseEvent.test(event.type)) {
			var body, eventDoc, doc,
				fromElement = event.fromElement;

			// Calculate pageX/Y if missing and clientX/Y available
			if (!hasProperty(event, 'pageX') && hasProperty(event, 'clientX')) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = event.clientX +
                    (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                    (doc && doc.clientLeft || body && body.clientLeft || 0);
				event.pageY = event.clientY +
                    (doc && doc.scrollTop || body && body.scrollTop || 0) -
                    (doc && doc.clientTop || body && body.clientTop || 0);
			}

			// Add relatedTarget, if necessary
			if (!event.relatedTarget && fromElement) {
				event.relatedTarget = fromElement === event.target ?
                    event.toElement : fromElement;
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if (!hasProperty(event, 'which') && hasProperty(event, 'button')) {
				var button = event.button;
				event.which = (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
			}
        }
    }

    EventMatcher.prototype.match = function (event) {
        nomalizeEvent(event);

        for (var i = 0; i < this.handlers.length; i += 1) {
            if (compare(this.handlers[i].pattern, event)) {
                this.handlers[i].callback.apply(this, arguments);
                return true;
            }
        }
        return false;
    };

    return EventMatcher;
}));
