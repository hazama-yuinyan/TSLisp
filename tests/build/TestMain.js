var TSLisp;
(function (TSLisp) {
    (function (Test) {
        var Assert;
        (function (Assert) {
            var AssertError = (function () {
                function AssertError(msg, values) {
                    if(msg) {
                        this.message = Utils.substituteTemplate(msg, values);
                    }
                    this.name = "Assertion Error";
                }
                return AssertError;
            })();            
            function equal(val, expect) {
                if(val !== expect) {
                    Common.HtmlConsole.printFormatted("Assertion failed; {val} != {expect}", {
                        val: val,
                        expect: expect
                    }, "errorMessage");
                    return false;
                }
                return true;
            }
            Assert.equal = equal;
            function structualEqual(val, expect) {
                if(typeof val === "object") {
                    if(typeof expect !== "object") {
                        throw new AssertError("Assertion failed; {val} is an object but {expect} is not!", {
                            val: val,
                            expect: expect
                        });
                    }
                    if($.isArray(val)) {
                        if(!$.isArray(expect)) {
                            throw new AssertError("Assertion failed; {val} is an array but {expect} is not!", {
                                val: val,
                                expect: expect
                            });
                        }
                        if(val.length != expect.length) {
                            throw new AssertError("Assertion failed; The number of elements in {val} doesn't match that of {expect}", {
                                val: val,
                                expect: expect
                            });
                        }
                        for(var i = 0; i < val.length; ++i) {
                            return structualEqual(val[i], expect[i]);
                        }
                    } else {
                        for(var key in val) {
                            for(var expect_key in expect) {
                                if(key === expect_key && val.hasOwnProperty(key) && expect.hasOwnProperty(expect_key)) {
                                    return structualEqual(val[key], expect[expect_key]);
                                } else {
                                    throw new AssertError("Assertion failed; {key} != {expect_key}", {
                                        key: key,
                                        expect_key: expect_key
                                    });
                                }
                            }
                        }
                    }
                } else {
                    return equal(val, expect);
                }
            }
            Assert.structualEqual = structualEqual;
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
                        console.printFormatted("Test pass: {suite_name},{name}:{number}", {
                            suite_name: test_name,
                            name: test_obj[i].name,
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
                    try  {
                        if(Assert.structualEqual(ret, test_obj[i].expected[j])) {
                            console.printFormatted("Test pass: {suite_name},{name}:{number}", {
                                suite_name: test_name,
                                name: test_obj[i].name,
                                number: j + 1
                            }, "testPassed");
                        }
                    } catch (e) {
                        console.println(e.message, "errorMessage");
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
