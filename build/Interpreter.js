var TSLisp;
(function (TSLisp) {
    var Interpreter = (function () {
        function Interpreter() {
            Common.HtmlConsole.initialize();
            Common.HtmlConsole.println("Welcome to the TS Lisp console!\nThis is a version of Lisp interpreter implemented in TypeScript." + "\n\nCall the help function for more info on ts_lisp.");
            this.symbols = {
            };
            this.reader = new TSLisp.Reader(Common.HtmlConsole.instance());
            this.symbols[TSLisp.LL.S_ERROR] = TSLisp.LL.S_ERROR;
            this.symbols[TSLisp.LL.S_T] = TSLisp.LL.S_T;
            this.symbols[TSLisp.Symbol.symbolOf("*version*")] = TSLisp.LL.list(TSLisp.LL.Version, "TypeScript");
            this.symbols[TSLisp.Symbol.symbolOf("*eof*")] = TSLisp.LL.S_EOF;
        }
        Interpreter.prototype.run = function () {
            var result = null;
            try  {
                var lisp_obj = this.reader.read();
                if(lisp_obj == TSLisp.LL.S_EOF) {
                    return result;
                }
                Common.HtmlConsole.println(TSLisp.LL.str(lisp_obj));
            } catch (ex) {
                Common.HtmlConsole.println(ex.message);
            }
        };
        Interpreter.prototype.evaluate = function (x) {
        };
        return Interpreter;
    })();
    TSLisp.Interpreter = Interpreter;    
})(TSLisp || (TSLisp = {}));

