(function () {
    Common.HtmlConsole.initialize(false);
    var html_console = Common.HtmlConsole;
    var interp = TSLisp.interp = new TSLisp.Interpreter(function () {
        var ret = new TSLisp.ReadPlaceholder(null);
        html_console.input(function (input) {
            ret.expr = new TSLisp.Reader(TSLisp.Lines.fromString(input)).read();
        });
        return ret;
    });
    interp.loadNatives();
    interp.evaluateStrings(TSLisp.Snippets.PRELUDE);
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
