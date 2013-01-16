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
            class AssertError implements Error
            {
                public message : string;
                public name : string;
                
                constructor(msg? : string, values? : Object)
                {
                    if(msg)
                        this.message = Utils.substituteTemplate(msg, values);
                    
                    this.name = "Assertion Error";
                }
            }
            
            export function equal(val, expect) : bool
            {
                if(val !== expect){
                    Common.HtmlConsole.printFormatted("Assertion failed; {val} != {expect}", {val : val, expect : expect},
                        "errorMessage");
                    return false;
                }
                return true;
            }
            
            export function structualEqual(val, expect) : bool
            {
                if(typeof val === "object"){
                    if(typeof expect !== "object"){
                        throw new AssertError("Assertion failed; {val} is an object but {expect} is not!",
                            {val : val, expect : expect});
                    }
                    
                    if($.isArray(val)){
                        if(!$.isArray(expect)){
                            throw new AssertError("Assertion failed; {val} is an array but {expect} is not!",
                                {val : val, expect : expect});
                        }
                        if(val.length != expect.length){
                            throw new AssertError("Assertion failed; The number of elements in {val} doesn't match that of {expect}",
                                {val : val, expect : expect});
                        }
                        
                        for(var i = 0; i < val.length; ++i)
                            return structualEqual(val[i], expect[i]);
                    }else{
                        for(var key in val){
                            for(var expect_key in expect){
                                if(key === expect_key && val.hasOwnProperty(key) && expect.hasOwnProperty(expect_key))
                                    return structualEqual(val[key], expect[expect_key]);
                                else{
                                    throw new AssertError("Assertion failed; {key} != {expect_key}", {key : key,
                                        expect_key : expect_key});
                                }
                            }
                        }
                    }
                }else
                    return equal(val, expect);
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
                        console.printFormatted("Test pass: {suite_name},{name}:{number}",
                            {suite_name : test_name, name : test_obj[i].name, number : j + 1}, "testPassed");
                }
            }
        }
        
        function doParserTest(test_name : string, test_obj : Test.TestFramework[])
        {
            for(var i = 0; i < test_obj.length; ++i){
                var parser = new TSLisp.Reader(TSLisp.Lines.fromString(test_obj[i].body));
                var ret;
                for(var j = 0; (ret = parser.read()) != TSLisp.LL.S_EOF; ++j){
                    try{
                        if(Assert.structualEqual(ret, test_obj[i].expected[j]))
                            console.printFormatted("Test pass: {suite_name},{name}:{number}",
                                {suite_name : test_name, name : test_obj[i].name, number : j + 1}, "testPassed");
                    }
                    catch(e){
                        console.println(e.message, "errorMessage");
                    }
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