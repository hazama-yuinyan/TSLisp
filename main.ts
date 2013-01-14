///<reference path='Interpreter.ts' />
///<reference path='Reader.ts' />
///<reference path='WebHelpers.ts' />
///<reference path='Snippets.ts' />
///<reference path='LispTypes.ts' />


(function(){
    Common.HtmlConsole.initialize(false);
    var html_console = Common.HtmlConsole.getInstance();
    var interp = TSLisp.interp = new TSLisp.Interpreter(() => {
        html_console.input((input) => {
            new TSLisp.Reader(input).read();
            /*try{
                var result = interp.evaluateString(input);
                Common.HtmlConsole.println(TSLisp.LL.str(result));
            }
            catch(e){
                Common.HtmlConsole.println(e.message, "errorMessage");
            }*/
        }/*, function(input) : any {
            var opening_parens = input.match(/(\()/g);  //see if opening parenthesis and closing parenthesis are balanced
            var closing_parens = input.match(/(\))/g);  //if so it can be considered that the expression is complete
            if(!opening_parens && !closing_parens || opening_parens.length === closing_parens.length) 
                return false;
            else
                return 1;
        }*/);
        return null;
    });
    interp.loadNatives();
    interp.evaluateStrings(TSLisp.PRELUDE);
    
    var handler = function(input){
        if(input){
            try{
                var result = interp.evaluateString(input);
                Common.HtmlConsole.println(TSLisp.LL.str(result));
            }
            catch(e){
                Common.HtmlConsole.println(e.message, "errorMessage");
            }
        }
        
        html_console.prompt(handler, function(input) : any {
            var opening_parens = input.match(/(\()/g);  //see if opening parenthesis and closing parenthesis are balanced
            var closing_parens = input.match(/(\))/g);  //if so it can be considered that the expression is complete
            if(!opening_parens && !closing_parens || opening_parens.length === closing_parens.length) 
                return false;
            else
                return 1;
        });
    };
    
    // Initiate the first prompt
    handler();
})();
