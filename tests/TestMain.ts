///<reference path='../Utils.ts' />
///<reference path='../Interpreter.ts' />
///<reference path='../jqconsole.d.ts' />
///<reference path='SpecialForms.ts' />
///<reference path='ParserTest.ts' />
///<reference path='BasicOperators.ts' />
///<reference path='TestFramework.ts' />


module TSLisp{
    export module Test{
        module Assert{
            export function equal(val, expect) : bool
            {
                if(val !== expect){
                    Common.HtmlConsole.println(Utils.substituteTemplate("Assertion failed; {val} != {expect}", {val : val, expect : expect}),
                        "errorMessage");
                    return false;
                }
                return true;
            }
        }
        
        var console = Common.HtmlConsole;
        
        function doTest(test_name : string, test_obj : Test.TestFramework[], interp : TSLisp.Interpreter)
        {
            for(var i = 0; i < test_obj.length; ++i){
                if(test_obj[i].name == "Initialization"){
                    interp.evaluateString(test_obj[i].body);
                    continue;
                }
                var tests = test_obj[i].body.split("\n"), ret = undefined;
                for(var j = 0; j < tests.length; ++j){
                    ret = interp.evaluateString(tests[j]);
                    if(Assert.equal(ret, test_obj[i].expected[j]))
                        console.printFormatted("Test pass: {name},{number}", {name : test_name, number : j + 1}, "testPassed");
                }
            }
        }
        
        function doParserTest(test_name : string, test_obj : Test.TestFramework[])
        {
            for(var i = 0; i < test_obj.length; ++i){
                var parser = new TSLisp.Reader(TSLisp.Lines.fromString(test_obj[i].body));
                var ret;
                for(var j = 0; (ret = parser.read()) != TSLisp.LL.S_EOF; ++j){
                    if(Assert.equal(ret, test_obj[i].expected[j]))
                        console.printFormatted("Test pass: {name},{number}", {name : test_name, number : j + 1}, "testPassed");
                }
            }
        }
        
        export function run()
        {
            console.initialize(false, "TSLisp test suite.\n");
            
            doParserTest(Test.parser_test.suite_name, Test.parser_test.body);
            var interp = new TSLisp.Interpreter(null);
            interp.loadNatives();
            interp.evaluateStrings(TSLisp.Snippets.PRELUDE);
            doTest(Test.basic_operators.suite_name, Test.basic_operators.body, interp);
        }
    }
}

TSLisp.Test.run();