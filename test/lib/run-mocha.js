// TODO should create a json structure that can be handed to
// a console formatting program.
(function () {
    phantom.injectJs('lib/jquery-1.8.1.js');
	var url, timeout, page, defer;
	
	if (phantom.args.length < 1) {
		console.log("Usage: phantomjs run-mocha.js URL [timeout]");
		phantom.exit();
	}



	url = phantom.args[0];
	timeout = phantom.args[1] || 6000;
	
	page = new WebPage();
	
	defer = function (finished, scrapper) {
		var start, condition, func, interval, time, testStart;
		start = new Date().getTime();
		testStart = new Date().getTime();
		condition = false;
		func = function () {
			if (new Date().getTime() - start < timeout && !condition) {
				condition = finished();
			} else {
				if (!condition) {
					console.log("Timeout passed before the tests finished.");
					phantom.exit();
				} else {
					clearInterval(interval);
					time = Math.round((new Date().getTime() - testStart) / 100) / 10;
					console.log("Finished in " + time + "s.\n");
					scrapper();
					phantom.exit();
				}
			}
		};
		interval = setInterval(func, 100);
	};
	page.onConsoleMessage = function (msg) { console.log(msg); };
	page.open(url, function (status) {
		if (status !== "success") {
			console.log("Failed to load the page. Check the url");
			phantom.exit();
		}


		var finished = function () {
			return page.evaluate(function () {
				return $("#mocha.finished").length > 0;
			});
		};

		// Outputs a '.' or 'F' for each test
        function printFailPassString() {
			var failPassString = page.evaluate(function () {
                return $('#mocha .test').map(function (index, element) {
                    return $(element).hasClass('fail') ? 'F' : '.';
                }).get().join('');
			});

            console.log(failPassString);
        }
        
		var scrapper = function () {
			printFailPassString();
            console.log('');
            
			list = page.evaluate(function () {
                var ansi = {
                    colors: {
                        "green" : 32,
                        "red"   : 31,
                        "gray"  : 37
                    },
                    colorize: function(text, color) {
                        var color_code = this.colors[color];
                        return "\033[" + color_code + "m" + text + "\033[0m";
                    }
                };

                function printTest(test, indent) {
                    var title = $('> h2', test).first()[0].innerText;
                    var duration = $('> h2 > span', test).text();
                    var indicator = $(test).hasClass('fail') ?
                        ansi.colorize('(FAIL)', 'red') :
                        ansi.colorize(duration, 'green');
                    console.log(indent + title + ' ' + indicator);
                }

				function printSuite(suite, indent) {
                    var title = $('> h1', suite).text();
                    console.log(indent + ansi.colorize(title, 'gray'));
                    indent += '  ';
                    $('> ul > li.test', suite).each(function (index, test) {
                        printTest(test, indent);
                    });
                    printSuites(suite, indent);
				}

				function printSuites(suite, indent) {
                    $('> ul > li.suite', suite).each(function (index, nestedSuite) {
						printSuite(nestedSuite, indent);
                    });
				}

				return printSuites($("#mocha"), '');
			});
		};
		defer(finished, scrapper);
	});
	
}());