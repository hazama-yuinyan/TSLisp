///<reference path='./Interfaces.ts' />
///<reference path='./Utils.ts' />



module TSLisp
{
    /**
     * Represents a symbol in Lisp.
     */
    export class Symbol
    {
        private name : string;
        private static symbols = {};

        public get Name() {return this.name;}

        constructor(name : string)
        {
            this.name = name;
        }

        public static symbolOf(name : string) : Symbol
        {
            var s = Symbol.symbols[name];
            if(!s){
                s = new Symbol(name);
                symbols[name] = s;
            }
            return s;
        }

        public toString()
        {
            return this.name;
        }
    }

    /**
     * Holds global variables used in Lisp and some helper functions
     */
    export class LL
    {
        public static Version : number = 1.0;
        public static MAX_EXPANSIONS = 5;
        public static MAX_MACRO_EXPS = 20;
        public static MAX_EXC_TRACES = 10;
        public static S_APPEND = Symbol.symbolOf("append");
        public static S_CATCH = Symbol.symbolOf("catch");
        public static S_COND = Symbol.symbolOf("cond");
        public static S_CONS = Symbol.symbolOf("cons");
        public static S_DELAY = Symbol.symbolOf("delay");
        public static S_EOF = Symbol.symbolOf("#<eof>");
        public static S_ERROR = Symbol.symbolOf("*error*");
        public static S_LAMBDA = Symbol.symbolOf("lambda");
        public static S_LIST = Symbol.symbolOf("list");
        public static S_MACRO = Symbol.symbolOf("macro");
        public static S_PROGN = Symbol.symbolOf("progn");
        public static S_QUOTE = Symbol.symbolOf("quote");
        public static S_REST = Symbol.symbolOf("&rest");
        public static S_SETQ = Symbol.symbolOf("setq");
        public static S_T = Symbol.symbolOf("t");
        public static S_UNWIND_PROTECT = Symbol.symbolOf("unwind-protect");

        public static str(x : any, printQuote? : bool, recLevel? : number, printed? : Common.HashTable) : string
        {
            if(printQuote === undefined) printQuote = true;
            if(recLevel === undefined) recLevel = LL.MAX_EXPANSIONS;
            if(printed === undefined){
                printed = new Common.HashTable(100,
                    (key) => {
                        return Utils.getHashCodeFor(key);
                    },
                    (lhs, rhs) => {
                        return lhs === rhs;
                    });
            }

            var result;
            if(x === null){
                return "nil";
            }else if(x instanceof Cell){
                var xc = <Cell>x;
                if(xc.car == LL.S_QUOTE && xc.cdr instanceof Cell){
                    var xcdr = <Cell>xc.cdr;
                    if(xcdr.cdr === null)
                        return "'" + LL.str(xcdr.car, printQuote, recLevel, printed);
                }

                return "(" + xc.repr(printQuote, recLevel, printed) + ")";
            }else if(typeof x === "string"){
                var xs = <string>x;
                if(!printQuote) return xs;

                result = '"';
                xs = xs.replace(/([\t\n\r\\"])/g, function(match){
                    return "\\" + match;
                });
                result += xs + '"';
                return result;
            }else if(x instanceof Array){
                var xl = x;
                if(printed.contains(xl)){
                    --recLevel;
                    if(recLevel == 0) return "[...]";
                }else{
                    printed.add(xl, true);
                }

                result = "[";
                xl.forEach(function(elem, i){
                    if(i != 0) result += ", ";
                    result += LL.str(elem);
                });
                result += "]";
                return result;
            }else{
                return x.toString();
            }
        }

        /**
         * Takes variable number of arguments and returns them as a Lisp list.
         */
        public static list(... args : Object[]) : Cell
        {
            var i = 0;
            return LL.listFrom(new Common.Enumerator(() => {
                if(i < args.length){
                    return args[i++];
                }
            }));
        }

        /**
         * Takes an enumerator and returns them as a Lisp list.
         */
        public static listFrom(args : Common.Enumerator) : Cell
        {
            if(!args) return null;

            var z : Cell = null; var y : Cell = null;
            while(args.moveNext()){
                var x : Cell = new Cell(args.Current, null);
                if(!z)
                    z = x;
                else
                    y.cdr = x;

                y = x;
            }

            return z;
        }

        /**
         * Takes a Lisp list and transforms it to a list object.
         */
        public static listFromTS(args : Common.IEnumerable) : Common.IList
        {
            if(args == null)
                return new Common.List();
            else
                return new Common.List(args.getEnumerator());
        }

        /**
         * A native implementation of mapcar function in Lisp.
         */
        public static mapCar(fn : (x) => any, args : Common.IEnumerable)
        {
            if(!fn)
                throw new TypeError("Null function");
            
            if(args == null)
                return null;

            var z : Cell = null; var y : Cell = null; var er = args.getEnumerator();
            while(er.moveNext()){
                var x : Cell = new Cell(fn(er.Current), null);
                if(z === null)
                    z = x;
                else
                    y.cdr = x;

                y = x;
            }

            return z;
        }
    }

    /**
     * The exeption thrown by the evaluator.
     */
    export class EvalException implements Error
    {
        private name : string;
        private message : string;
        private trace = [];

        public get Trace() {return this.trace;}

        constructor(msg : string, exp? : any)
        {
            if(exp)
                this.message = msg + ": " + LL.str(exp);
            else
                this.message = msg;

            this.name = "EvalException";
        }

        public toString() : string
        {
            var result = "*** " + this.message;
            this.trace.forEach(function(path, index){
                result = result + "\n" + index + ": " + path;
            });
            return result;
        }
    }

    /**
     * Represents the exeption thrown by the throw function in Lisp
     */
    export class LispThrowException extends EvalException
    {
        private tag;
        private value;

        public get Tag(){return this.tag;}
        public get Value(){return this.value;}

        constructor(tag, value)
        {
            super("No catcher found for (" + LL.str(tag) + " " + LL.str(value) + ")")
            this.tag = tag;
            this.value = value;
        }
    }

    export class VariableExpected extends EvalException
    {
        constructor(exp : any)
        {
            super("Variable expected", exp);
        }
    }

    export class ProperListExpected extends EvalException
    {
        constructor(exp : any)
        {
            super("Found an ill-formed list", exp);
        }
    }

    /**
     * Represents a cons cell in Lisp.
     */
    export class Cell implements Common.IEnumerable
    {
        constructor(public car : any, public cdr : any)
        {
            this.car = car;
            this.cdr = cdr;
        }

        public get Car() {return this.car;}
        public set Car(val : any) {this.cdr = val;}

        public get Cdr() {return this.cdr;}
        public set Cdr(val : any) {this.cdr = val;}

        public getEnumerator() : Common.Enumerator
        {
            var j : Object = this;
            return new Common.Enumerator(() => {
                var jc = <Cell>j;
                if(!(jc instanceof Cell)) return undefined;
                j = jc.cdr;
                if(j instanceof Promise)
                    (<Promise> j).resolve();

                return jc.car;
            });
        }

        /**
         * Sees this cell as a Lisp list and makes an array of those elements
         */
        public toArray()
        {
            var j = this, result = [];
            while(true){
                if(!(j instanceof(Cell))) break;
                result.push(j);
                j = j.cdr;
            }

            if(j) throw new ProperListExpected(this);
            return result;
        }

        public get Length() {
            return this.toArray().length;
        }

        public toString() : string
        {
            return "Cell(" + this.car + ", " + this.cdr + ")";
        }

        public repr(printQuote : bool, recLevel : number, printed : Common.HashTable) : string
        {
            if(printed.contains(this)){
                --recLevel;
                if(recLevel == 0) return "...";
            }else{
                printed.add(this, true);
            }

            var kdr = this.cdr;
            if(!kdr){
                return LL.str(this.car, printQuote, recLevel, printed);
            }else if(kdr instanceof Cell){
                var s = LL.str(this.car, printQuote, recLevel, printed);
                var t = kdr.repr(printQuote, recLevel, printed);
                return s + " " + t;
            }else{
                var s = LL.str(this.car, printQuote, recLevel, printed);
                var t = LL.str(this.cdr, printQuote, recLevel, printed);
                return s + " . " + t;
            }
        }
    }

    /**
     * Represents a Lisp function instance.
     * help_msg can be null if no help message is needed.
     * has_optional indicates whether the function has optional parameters or not.
     * accepts_variable_args indicates whether the function can take more than three arguments or not.
     */
    export class LispFunction
    {
        constructor(public body : Function, public help_msg : string, public has_optional : bool, public accepts_variable_args : bool) {}

        public toString() : string
        {
            return this.body.toString();
        }
    }

    export class DefinedFunction
    {
        constructor(public arity : number, public body : any, public env : Cell) {}
    }

    /**
     * Represents a macro in Lisp.
     */
    export class Macro extends DefinedFunction
    {
        constructor(arity, body)
        {
            super(arity, body, null);
        }

        public toString() : string
        {
            return LL.str(new Cell(Symbol.symbolOf("#<macro>"), new Cell(this.arity, this.body)));
        }
    }

    /**
     * Represents a lambda function in Lisp.
     */
    export class Lambda extends DefinedFunction
    {
        constructor(arity, body)
        {
            super(arity, body, null);
        }

        public toString() : string
        {
            return LL.str(new Cell(Symbol.symbolOf("#<lambda>"), new Cell(this.arity, this.body)));
        }
    }

    /**
     * Represents a closure in Lisp.
     */
    export class Closure extends DefinedFunction
    {
        constructor(arity : number, body : any, env : Cell)
        {
            super(arity, body, env);
        }

        public toString() : string
        {
            return LL.str(new Cell(Symbol.symbolOf("#<closure>"), new Cell(new Cell(this.arity, this.env), this.body)));
        }
    }

    /**
     * Represents a compiled variable
     */
    export class Arg
    {
        constructor(public level : number, public offset : number, public symbol : Symbol){}

        public toString() : string
        {
            return "#" + this.level + ":" + this.offset + ":" + this.symbol;
        }

        public setValue(x : any, env : Cell)
        {
            for(var i = 0; i < this.level; ++i) env = x.cdr;
            env.car.update(this.offset, x);
        }

        public getValue(env : Cell)
        {
            for(var i = 0; i < this.level; ++i) env = env.cdr;
            return env.car.get(this.offset);
        }
    }

    /**
     * Represents a dummy symbol stuck in a compiled macro
     */
    export class Dummy
    {
        constructor(public symbol : Symbol){}

        public toString() : string
        {
            return ":" + this.symbol + ":Dummy";
        }
    }

    /**
     * Represents a promise object.
     * In other words, it is the result of an evaluated Lisp expression "(delay exp)"
     */
    export class Promise
    {
        private exp;
        private environ : Cell;
        private interp : Interpreter;

        private static NONE = new Cell(null, null);

        constructor(exp, environ, interp)
        {
            this.exp = exp;
            this.environ = environ;
            this.interp = interp;
        }

        public toString() : string
        {
            if(this.environ == Promise.NONE)
                return LL.str(this.exp);
            else
                return "#<promise>";
        }

        public get Value() {
            if(this.environ == Promise.NONE)
                return this.exp;
            else
                return this;
        }

        public resolve()
        {
            if(this.environ != Promise.NONE){
                var old_env = this.interp.environ;
                this.interp.environ = this.environ;
                var x;
                try{
                    x = this.interp.evaluate(this.exp, true);
                    if(x instanceof Promise)
                        x = <Promise>(x).resolve();
                }
                finally{
                    this.interp.environ = old_env;
                }

                if(this.environ != Promise.NONE){
                    this.exp = x;
                    this.environ = Promise.NONE;
                }
            }

            return this.exp;
        }
    }
}