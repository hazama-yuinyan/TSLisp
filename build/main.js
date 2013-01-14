(function () {
    Common.HtmlConsole.initialize(false);
    var html_console = Common.HtmlConsole.getInstance();
    var interp = TSLisp.interp = new TSLisp.Interpreter(function () {
        html_console.input(function (input) {
            new TSLisp.Reader(input).read();
        });
        return null;
    });
    interp.loadNatives();
    interp.evaluateStrings(TSLisp.PRELUDE);
    var handler = function (input) {
        if(input) {
            try  {
                var result = interp.evaluateString(input);
                Common.HtmlConsole.println(TSLisp.LL.str(result));
            } catch (e) {
                Common.HtmlConsole.println(e.message, "errorMessage");
            }
        }
        html_console.prompt(handler, function (input) {
            var opening_parens = input.match(/(\()/g);
            var closing_parens = input.match(/(\))/g);
            if(!opening_parens && !closing_parens || opening_parens.length === closing_parens.length) {
                return false;
            } else {
                return 1;
            }
        });
    };
    handler();
})();
