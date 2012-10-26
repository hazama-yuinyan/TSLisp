///<reference path='LispTypes.ts' />
///<reference path='Reader.ts' />
///<reference path='WebHelpers.ts' />



module TSLisp
{
    /**
     * The lisp interpreter implemented in TypeScript
     */
    export class Interpreter
    {
        private environ : Cell;
        private symbols : Object;
        private reader : Reader;
        
        constructor()
        {
            Common.HtmlConsole.initialize();
            Common.HtmlConsole.println("Welcome to the TS Lisp console!\nThis is a version of Lisp interpreter implemented in TypeScript." +
                "\n\nCall the help function for more info on ts_lisp.");
            this.symbols = {};
        	this.reader = new /*Reader.*/Reader(Common.HtmlConsole.instance());

            this.symbols[LL.S_ERROR] = LL.S_ERROR;
            this.symbols[LL.S_T] = LL.S_T;
            this.symbols[Symbol.symbolOf("*version*")] = LL.list(LL.Version, "TypeScript");
            this.symbols[Symbol.symbolOf("*eof*")] = LL.S_EOF
        }

        public run()
        {
            var result = null;
            //while(true){
                try{
                	var lisp_obj = this.reader.read();
                	if(lisp_obj == LL.S_EOF) return result;

                    //result = this.evaluate(lisp_obj);
                    Common.HtmlConsole.println(LL.str(lisp_obj/*result*/));
                }
                catch(ex){
                    Common.HtmlConsole.println(ex.message);
                }
            //}
        }

        public evaluate(x)
        {}
    }
}