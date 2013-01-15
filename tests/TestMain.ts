///<reference path='SpecialForms.ts' />
///<reference path='ParserTest.ts' />
///<reference path='../jqconsole.d.ts' />


interface JQuery
{
    jqconsole(header : string, ps1 : string, ps2 : string) : JQConsole;
}

module Common{
    export module HtmlConsole{
        var console : any = null;
        
        export function initialize()
        {
            console = $("#console").jqconsole("TSLisp test suite.", ">>> ", "... ");
            console.RegisterMatching('(', ')', "paren");
        }
        
        export function print(text : string, cls? : string) : void
        {
            console.Write(text, cls);
        }
        
        export function println(text : string, cls? : string) : void
        {
            console.Write(text + "\n", cls);
        }
        
        export function prompt(callback : (input) => void, continue_callback? : (input) => any) : void
        {
            console.Prompt(true, callback, continue_callback);
        }
        
        export function abortPrompt() : void
        {
            console.AbortPrompt();
        }
        
        export function input(input_callback : (input) => void) : void
        {
            console.Input(input_callback);
        }
    }
}

module TSLisp{
    module Test{
        function doTest(test_obj)
        {
        }
        
        export function run()
        {
            var console = Common.HtmlConsole;
            console.initialize();
            
        }
    }
}

TSLisp.Test.run();