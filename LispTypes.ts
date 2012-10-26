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

        constructor(name : string)
        {
            this.name = name;
        }

        public static symbolOf(name : string)
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
                if(xc.Car == LL.S_QUOTE && xc.Cdr instanceof Cell){
                    var xcdr = <Cell>xc.Cdr;
                    if(xcdr.Cdr === null)
                        return "'" + LL.str(xcdr.Car, printQuote, recLevel, printed);
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

        public static list(... args : Object[]) : Cell
        {
            return LL.listFrom(args);
        }

        public static listFrom(args : Object[]) : Cell
        {
            if(!args) return null;

            var z : Cell = null; var y : Cell = null;
            args.forEach(function(arg){
                var x : Cell = new Cell(arg, null);
                if(!z)
                    z = x;
                else
                    y.Cdr = x;

                y = x;
            });

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

        constructor(msg : string, exp? : any)
        {
            if(exp)
                this.message = msg + ": " + LL.str(exp);
            else
                this.message = msg;
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
    export class Cell
    {
        private car : any;
        private cdr : any;

        constructor(car, cdr)
        {
            this.car = car;
            this.cdr = cdr;
        }

        public get Car() {return this.car;}
        public set Car(val : any) {this.cdr = val;}

        public get Cdr() {return this.cdr;}
        public set Cdr(val : any) {this.cdr = val;}

        /**
         * Sees this cell as a Lisp list and makes an array of those elements
         */
        public toArray()
        {
            var j = this, result = [];
            while(true){
                if(!j || !(j instanceof(Cell))) return null;
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

    class DefinedFunction
    {
        constructor(public arity : number, public body : any, public env : Cell){}
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
        private level : number;
        private offset : number;
        private symbol : Symbol;

        constructor(level : number, offset : number, symbol : Symbol)
        {
            this.level = level;
            this.offset = offset;
            this.symbol = symbol;
        }

        public toString() : string
        {
            return "#" + this.level + ":" + this.offset + ":" + this.symbol;
        }

        public setValue(x : any, env : Cell)
        {
            for(var i = 0; i < this.level; ++i) env = x.Cdr;
            env.Car[this.offset] = x;
        }

        public getValue(env : Cell)
        {
            for(var i = 0; i < this.level; ++i) env = env.Cdr;
            return env.Car[this.offset];
        }
    }

    /**
     * Represents a dummy symbol stuck in a compiled macro
     */
    export class Dummy
    {
        private symbol : Symbol;

        constructor(symbol : Symbol)
        {
            this.symbol = symbol;
        }

        public toString() : string
        {
            return ":" + this.symbol + ":Dummy";
        }
    }
}