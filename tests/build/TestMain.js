var TSLisp;
(function (TSLisp) {
    (function (Test) {
        var Assert;
        (function (Assert) {
            function equal(val, expect) {
                if(val != expect) {
                    Common.HtmlConsole.println(Utils.substituteTemplate("Assertion failed; {val} != {expect}", {
                        val: val,
                        expect: expect
                    }), "errorMessage");
                    return false;
                }
                return true;
            }
            Assert.equal = equal;
        })(Assert || (Assert = {}));
        var console = Common.HtmlConsole;
        function doTest(test_name, test_obj, interp) {
            for(var i = 0; i < test_obj.length; ++i) {
                if(test_obj[i].name == "Initialization") {
                    interp.evaluateString(test_obj[i].body);
                    continue;
                }
                var tests = test_obj[i].body.split("\n"), ret = undefined;
                for(var j = 0; j < tests.length; ++j) {
                    ret = interp.evaluateString(tests[j]);
                    if(Assert.equal(ret, test_obj[i].expected[j])) {
                        console.printFormatted("Test pass: {name},{number}", {
                            name: test_name,
                            number: j + 1
                        }, "testPassed");
                    }
                }
            }
        }
        function doParserTest(test_name, test_obj) {
            for(var i = 0; i < test_obj.length; ++i) {
                var parser = new TSLisp.Reader(TSLisp.Lines.fromString(test_obj[i].body));
                var ret;
                for(var j = 0; (ret = parser.read()) != TSLisp.LL.S_EOF; ++j) {
                    if(Assert.equal(ret, test_obj[i].expected[j])) {
                        console.printFormatted("Test pass: {name},{number}", {
                            name: test_name,
                            number: j + 1
                        }, "testPassed");
                    }
                }
            }
        }
        function run() {
            console.initialize(false, "TSLisp test suite.\n");
            doParserTest(TSLisp.Test.parser_test.suite_name, TSLisp.Test.parser_test.body);
            var interp = new TSLisp.Interpreter(null);
            interp.loadNatives();
            interp.evaluateStrings(TSLisp.Snippets.PRELUDE);
            doTest(TSLisp.Test.basic_operators.suite_name, TSLisp.Test.basic_operators.body, interp);
        }
        Test.run = run;
    })(TSLisp.Test || (TSLisp.Test = {}));
    var Test = TSLisp.Test;
})(TSLisp || (TSLisp = {}));
TSLisp.Test.run();
