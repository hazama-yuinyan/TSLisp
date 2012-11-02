///<reference path='LispTypes.ts' />
///<reference path='Reader.ts' />
///<reference path='WebHelpers.ts' />
///<reference path='Common.ts' />
///<reference path='Utils.ts' />
///<reference path='LispFunctions.ts' />



module TSLisp
{
    /**
     * The lisp interpreter implemented in TypeScript
     */
    export class Interpreter
    {
        public environ : Cell = null;
        private symbols : Common.HashTable;
        private lazy : Common.HashTable;
        private reader : Reader;

        public get SymbolTable() {return this.symbols;}

        public get LazyTable() {return this.lazy;}

        public get Environment() {return this.environ;}
        
        constructor()
        {
            Common.HtmlConsole.initialize();
            Common.HtmlConsole.println("Welcome to the TS Lisp console!\nThis is a version of Lisp interpreter implemented in TypeScript." +
                "\n\nCall the help function for more info on TSLisp.");
            Common.HtmlConsole.instance().printPS();
            this.symbols = new Common.HashTable(1000, 
                (key) => Utils.getHashCodeFor(key),
                (lhs, rhs) => lhs == rhs
            );
            this.lazy = new Common.HashTable(100,
                (key) => Utils.getHashCodeFor(key),
                (lhs, rhs) => lhs == rhs
            );
        	this.reader = new Reader(Common.HtmlConsole.instance());

            this.symbols.add(LL.S_ERROR, LL.S_ERROR);
            this.symbols.add(LL.S_T, LL.S_T);
            this.symbols.add(Symbol.symbolOf("*version*"), LL.list(LL.Version, "TypeScript"));
            this.symbols.add(Symbol.symbolOf("*eof*"), LL.S_EOF);

            this.symbols.add(Symbol.symbolOf("*pi*"), Math.PI);
            this.symbols.add(Symbol.symbolOf("*napier*"), Math.E);

            var read_func_obj = new LispFunction(this.reader.read, "(read) : reads an S expression from the standard input", false, false);
            this.symbols.add(Symbol.symbolOf("read"), read_func_obj);
            var list_func = LL.listFrom;
            var list_func_obj = new LispFunction(list_func, "(list a b c ...) => (a b c ...)", false, true);
            this.symbols.add(LL.S_LIST, list_func_obj);
            this.lazy.add(list_func, true);
        }

        public run(lines? : Common.IEnumerable)
        {
            if(!lines) lines = Common.HtmlConsole.instance();

            var interactive = lines instanceof Common.HtmlConsole;
            var rr = new Reader(lines);
            var result = null;
            while(true){
                try{
                	var lisp_obj = rr.read();
                	if(lisp_obj == LL.S_EOF){
                        if(interactive)
                            (<Common.HtmlConsole> lines).printPS();

                        return result;
                    }

                    result = this.evaluate(lisp_obj, false);
                    if(interactive)
                        Common.HtmlConsole.println(LL.str(result));
                }
                catch(ex){
                    if(interactive)
                        Common.HtmlConsole.println(ex.message);
                    else
                        throw ex;
                }
            }
        }

        /**
         * Takes an array of Lisp function defintion objects and loads them.
         */
        public loadNatives(target? : any[]) : void
        {
            if(!target) target = built_in_funcs;

            target.forEach((obj) => {
                var is_lazy = false;
                var func_obj = new LispFunction(null, null, false, false);
                var name = "";
                for(var key in obj){
                    if(obj.hasOwnProperty(key)){
                        switch(key){
                        case "is_lazy":
                            is_lazy = obj[key];
                            break;

                        case "help_msg":
                            func_obj.help_msg = obj[key];
                            break;

                        case "has_optional":
                            func_obj.has_optional = obj[key];
                            break;

                        case "accepts_variable_args":
                            func_obj.accepts_variable_args = obj[key];
                            break;

                        default:
                            name = key;
                            func_obj.body = obj[key];
                            break;
                        }
                    }
                }

                this.symbols.add(Symbol.symbolOf(name), func_obj);
                if(is_lazy)
                    this.lazy.add(func_obj.body, is_lazy);
            });
        }

        public evaluate(x : any, canLoseEnviron : bool)
        {
            try{
                while(true){
                    if(x instanceof Symbol){
                        return this.evalSymbol(x);
                    }else if(x instanceof Arg){
                        return <Arg>(x).getValue(this.environ);
                    }else if(x instanceof Cell){
                        var xc : Cell = <Cell>x;
                        var fn = xc.car;

                        if(fn == LL.S_QUOTE){
                            var kdr = <Cell>xc.cdr;
                            if(kdr == null || kdr.cdr != null)
                                throw new EvalException("Found a bad quotation!");

                            return kdr.car;
                        }else if(fn == LL.S_PROGN){
                            x = this.evalProgN(xc);
                        }else if(fn == LL.S_COND){
                            var tmp = [x];
                            if(this.evalCond(tmp))
                                return tmp[1];
                            else
                                x = tmp[1];
                        }else if(fn == LL.S_SETQ){
                            return this.evalSetQ(xc);
                        }else if(fn == LL.S_LAMBDA){
                            var compiled = this.compile(x);
                            return new Closure(compiled.arity, compiled.x, this.environ);
                        }else if(fn == LL.S_MACRO){
                            if(this.environ != null)
                                throw new EvalException("Nested macro!", x);

                            var substituted = Interpreter.substituteDummyVariables(x);
                            var compiled = this.compile(substituted);
                            return new Macro(compiled.arity, compiled.x);
                        }else if(fn == LL.S_CATCH){
                            //return this.evalCatch(xc);
                        }else if(fn == LL.S_UNWIND_PROTECT){
                            //return this.evalUnwindProtect(xc);
                        }else if(fn == LL.S_DELAY){
                            var kdr = <Cell>xc.cdr;
                            if(kdr == null || kdr.cdr != null)
                                throw new EvalException("Bad delay!");

                            return new Promise(kdr.car, this.environ, this);
                        }else{
                            var arg_list : Cell = <Cell>xc.cdr;
                            if(!(arg_list instanceof Cell) && xc.cdr != null)
                                throw new ProperListExpected(x);

                            fn = this.evaluate(fn, false);
                            if(fn instanceof Promise)
                                fn = <Promise>(fn).resolve();
                            
                            if(fn instanceof Closure){
                                var args = this.getArgs(arg_list, false);
                                var tmp : any[] = [];
                                if(this.applyDefined(<Closure>fn, args, canLoseEnviron, tmp))
                                    return tmp[0];
                                else
                                    x = tmp[0];
                            }else if(fn instanceof Macro){
                                var args = LL.listFromTS(arg_list);
                                var tmp : any[] = [];
                                this.applyDefined(<Macro>fn, args, false, tmp);
                                x = tmp[0];
                            }else{
                                return this.callNative(fn, arg_list, !this.lazy.contains(fn.body));
                            }
                        }
                    }else if(x instanceof Lambda){
                        var xl = <Lambda>x;
                        return new Closure(xl.arity, xl.body, this.environ);
                    }else{
                        return x;
                    }
                }
            }
            catch(ex){
                if(ex instanceof EvalException && ex.Trace.length < LL.MAX_EXC_TRACES)
                    ex.Trace.push(LL.str(x));

                throw ex;
            }
        }

        public apply(fn : any, args : Common.IList)
        {
            if(fn instanceof Closure || fn instanceof Macro){
                var df : DefinedFunction = <DefinedFunction>fn;
                var result = [];
                this.applyDefined(df, args, false, result);
                return result[0];
            }else{
                var func = fn.body;
                var count : number = args.getCount();
                if(!this.lazy.contains(func)){
                    for(var i = 0; i < count; ++i){
                        var e = args.get(i);
                        if(e instanceof Promise)
                            args.update(i, (<Promise> e).resolve());
                    }
                }

                var arg_names = Utils.getArgumentNamesFor(fn);
                var has_optional = fn.has_optional;
                var arity = (fn.accepts_variable_args) ? 3 : arg_names.length;
                switch(arity){
                case 0:
                    if(count !== 0) this.throwArgException(0, args);
                    return func();

                case 1:
                    if(!has_optional && count !== 1) this.throwArgException(1, args);
                    return func(args.get(0));

                case 2:
                    if(!has_optional && count !== 2) this.throwArgException(2, args);
                    return func(args.get(0), args.get(1));

                default:
                    return func(args);
                }
            }
        }

        private evalSymbol(name : Symbol)
        {
            var val = this.symbols.lookup(name);
            if(val === undefined)
                throw new EvalException("Unbound variable", name);

            return val;
        }

        private evalProgN(xc : Cell)
        {
            var body = xc.cdr;
            if(body == null)
                return null;

            var c : Cell = <Cell>body;
            if(!(c instanceof Cell))
                throw new ProperListExpected(xc);

            while(true){
                var d = c.cdr;
                if(d instanceof Cell){
                    this.evaluate(c.car, false);
                    c = <Cell>d;
                }else{
                    if(d != null)
                        throw new ProperListExpected(xc);

                    return c.car;       //It's a tail call so evaluate it after exiting the method
                }
            }
        }

        private evalCond(x : any[]) : bool
        {
            var xc : Cell = <Cell>x[0];
            var body = xc.cdr;
            while(body instanceof Cell){
                var bc : Cell = <Cell>body;
                var clause = bc.car;
                if(clause instanceof Cell){
                    var cc : Cell = <Cell>clause;
                    var result = this.evaluate(cc.car, false);

                    if(result instanceof Promise)
                        (<Promise> result).resolve();

                    if(result != null){     //if the result is evaluated to true...
                        clause = cc.cdr;
                        cc = <Cell>clause;
                        if(!(cc instanceof Cell)){
                            x[1] = result; //then the result becomes the return value
                            return true;
                        }

                        while(true){
                            var d = cc.cdr;
                            if(d instanceof Cell){
                                this.evaluate(cc.car, false);
                                cc = <Cell>d;
                            }else{
                                if(d != null)
                                    throw new ProperListExpected(clause);

                                x[1] = cc.car;     //evaluate the tail call after returning
                                return false;
                            }
                        }
                    }
                }else if(clause != null){
                    throw new EvalException("Not any test clause found in cond", clause);
                }

                body = bc.cdr;
            }

            if(body != null)
                throw new ProperListExpected(xc);

            x[1] = null;       //if all tests failed then return 'nil'
            return true;
        }

        private evalSetQ(xc : Cell)
        {
            var c = xc;
            var result = null;
            while(true){
                var body = c.cdr;
                c = <Cell>body;
                if(!(c instanceof Cell)){
                    if(body != null)
                        throw new ProperListExpected(xc);

                    return result;
                }

                var lval = c.car;
                c = <Cell>c.cdr;
                if(!(c instanceof Cell))
                    throw new EvalException("Missing the right-hand-side of a SetQ form");

                result = this.evaluate(c.car, false);
                if(lval instanceof Symbol)
                    this.symbols.add(lval, result);
                else if(lval instanceof Arg)
                    (<Arg> lval).setValue(result, this.environ);
                else
                    throw new VariableExpected(lval);
            }
        }

        private throwArgException(expectedNumArgs : number, argList : Common.IEnumerable)
        {
            switch(expectedNumArgs){
            case 0:
                throw new EvalException("No args expected", argList);

            case 1:
                throw new EvalException("One arg expected", argList);

            case 2:
                throw new EvalException("Two args expected", argList);
            }
        }

        private callNative(fn : any, argList : Cell, willForce : bool)
        {
            if(!(fn instanceof LispFunction))
                throw new EvalException("Not applicable: ", fn);

            var func = fn.body, has_optional = fn.has_optional;
            try{
                var arg_names = Utils.getArgumentNamesFor(func);
                var arity = (fn.accepts_variable_args) ? 3 : arg_names.length;
                switch(arity){
                case 0:
                    if(argList != null) this.throwArgException(0, argList);

                    return func();

                case 1:
                    if(has_optional && argList == null)
                        return func();

                    if(argList == null) this.throwArgException(1, argList);

                    var x = this.evalAndForce(argList.car, willForce);
                    if(argList.cdr != null) this.throwArgException(1, argList);

                    return func(x);

                case 2:
                    if(has_optional && argList == null)
                        return func();

                    if(argList == null) this.throwArgException(2, argList);

                    var x = this.evalAndForce(argList.car, willForce);
                    var j = <Cell>argList.cdr;
                    if(has_optional && !(j instanceof Cell))
                        return func(x);

                    if(!(j instanceof Cell)) this.throwArgException(2, argList);

                    var y = this.evalAndForce(j.car, willForce);
                    if(j.cdr != null) this.throwArgException(2, argList);

                    return func(x, y);

                default:
                    var args = this.getArgs(argList, willForce);
                    return func(args);
                }
            }
            catch(ex){
                fn = this.symbols.findKey(fn);
                throw new EvalException(ex.name + ": " + ex.message + " -- " + fn + " " +
                    LL.str(argList), ex);
            }
        }

        private evalAndForce(arg, willForce : bool)
        {
            var x = this.evaluate(arg, false);
            if(willForce && x instanceof Promise)
                x = (<Promise> x).resolve();

            return x;
        }

        private getArgs(argList : Cell, willForce : bool) : Common.IList
        {
            var args = new Common.List();
            var jc = argList;
            if(jc != null){
                while(true){
                    var x = this.evalAndForce(jc.car, willForce);
                    args.add(x);
                    var j = jc.cdr;
                    jc = <Cell>j;
                    if(jc == null){
                        if(j != null)
                            throw new ProperListExpected(argList);

                        break;
                    }
                }
            }

            return args;
        }

        private applyDefined(fn : DefinedFunction, args : Common.IList, canLoseEnviron : bool, x : any[]) : bool
        {
            var body : Cell = <Cell>fn.body;
            if(!(body instanceof Cell))
                throw new EvalException("Missing function body!");

            var arity : number = fn.arity;
            if(arity < 0){  //if the function has a &rest parameter...
                arity = -arity - 1;
                if(arity <= args.getCount()){
                    var er = args.getEnumerator();
                    args = new Common.List(Common.take(arity, er));
                    var rest = LL.listFrom(Common.takeAll(er));
                    args.add(rest);
                    ++arity;
                }
            }

            if(arity != args.getCount())
                throw new EvalException("The number of arguments doesn't match that of parameters");

            var old_env : Cell = this.environ;
            this.environ = new Cell(args, fn.env);
            try{
                while(true){
                    var d : Cell = <Cell>body.cdr;
                    if(!(d instanceof Cell))
                        break;

                    this.evaluate(body.car, false);
                    body = d;
                }

                if(canLoseEnviron){
                    old_env = this.environ;     //throw away the old environment
                    x[0] = body.car;            //and evaluate it after returining
                    return false;
                }else{
                    x[0] = this.evaluate(body.car, true);   //evaluate it as a tail call
                    return true;
                }
            }
            finally{
                this.environ = old_env;
            }
        }

        /**
         * The return value is of the form {arity -> number, x -> Cell}.
         * arity: The arity of the compiled lambda function.
         * x: The body of the compiled lambda function.
         */
        private compile(x) : {arity : number; x : Cell;}
        {
            console.log(x instanceof Cell);
            console.log((<Cell> x).car == LL.S_LAMBDA || (<Cell> x).car == LL.S_MACRO);

            var j : Cell = <Cell>x.cdr;
            if(!(j instanceof Cell))
                throw new EvalException("Missing the argument list and the body!");

            var result = Interpreter.makeArgTable(j.car);
            var arity : number = result.table.getCount();
            if(result.has_rest)
                arity = -arity;

            j = <Cell>j.cdr;
            if(!(j instanceof Cell))
                throw new EvalException("Missing the body!");

            j = <Cell>Interpreter.scanArgs(j, result.table);
            j = <Cell>this.expandMacros(j, LL.MAX_MACRO_EXPS);
            j = <Cell>this.compileInners(j);
            return {arity : arity, x : j};
        }

        private expandMacros(j, count : number)
        {
            if(count > 0 && j instanceof Cell){
                var jc = <Cell>j;
                var k = jc.car;
                if(k == LL.S_QUOTE || k == LL.S_LAMBDA || k == LL.S_MACRO)
                    return j;

                if(k instanceof Symbol){
                    var v = this.symbols.lookup(k);
                    if(v !== undefined) k = v;
                }

                if(k instanceof Macro){
                    var args = LL.listFromTS(<Cell>jc.cdr);
                    var z = [];
                    this.applyDefined(<Macro>k, args, false, z);
                    return this.expandMacros(z[0], count - 1);
                }else{
                    return LL.mapCar((x) => {
                        return this.expandMacros(x, count);
                    }, jc);
                }
            }else{
                return j;
            }
        }

        private compileInners(j)
        {
            if(j instanceof Cell){
                var jc : Cell = <Cell>j;
                var k = jc.car;
                if(k == LL.S_QUOTE){
                    return j;
                }else if(k == LL.S_LAMBDA){
                    var compiled = this.compile(j);
                    return new Lambda(compiled.arity, compiled.x);
                }else if(k == LL.S_MACRO){
                    throw new EvalException("Nested macro", j);
                }else{
                    return LL.mapCar((x) => this.compileInners(x), jc);
                }
            }else{
                return j;
            }
        }

        private static makeArgTable(args) : {table : Common.Dictionary; has_rest : bool;}
        {
            var offset = 0;
            var result = {table : new Common.Dictionary(), has_rest : false};
            var i = args;
            while(i instanceof Cell){
                var j : Object = (<Cell> i).car;
                if(result.has_rest)
                    throw new EvalException("Can not declare rest parameters multiple times!", j);

                if(j == LL.S_REST){
                    i = <Cell>(i).cdr;
                    if(!(i instanceof Cell))
                        throw new VariableExpected(i);

                    j = <Cell>(i).car;
                    if(j == LL.S_REST)
                        throw new VariableExpected(j);

                    result.has_rest = true;
                }

                var sym : Symbol;
                if(j instanceof Symbol){
                    sym = <Symbol>j;
                }else if(j instanceof Arg){
                    sym = (<Arg> j).symbol;
                    j = sym;
                }else if(j instanceof Dummy){
                    sym = (<Dummy> j).symbol;
                }else{
                    throw new VariableExpected(j);
                }

                result.table.add(j, new Arg(0, offset, sym));
                ++offset;
                i = <Cell>(i).cdr;
            }
            if(i != null)
                throw new ProperListExpected(i);

            return result;
        }

        /**
         * Scans parameters.
         */
        private static scanArgs(j, table : Common.Dictionary)
        {
            if(j instanceof Symbol || j instanceof Dummy){
                var k = table.lookup(j);
                return (k === undefined) ? j : k;
            }else if(j instanceof Arg){
                var ja : Arg = <Arg>j;
                var k = table.lookup(ja.symbol);
                if(k !== undefined)
                    return k;
                else
                    return new Arg(ja.level + 1, ja.offset, ja.symbol);
            }else if(j instanceof Cell){
                var jc : Cell = <Cell>j;
                if(jc.car == LL.S_QUOTE)
                    return jc;
                else{
                    return LL.mapCar((x) => {
                        return Interpreter.scanArgs(x, table);
                    }, jc);
                }
            }else{
                return j;
            }
        }

        /**
         * Replaces variables whose names begin with a '$' sign with Dummy symbols.
         */
        private static substituteDummyVariables(x)
        {
            return Interpreter.scanDummies(x, new Common.Dictionary());
        }

        private static scanDummies(j, names : Common.Dictionary)
        {
            if(j instanceof Symbol){
                var js = <Symbol>j;
                if(js.Name[0] != '$')
                    return j;

                var k : Dummy = names.lookup(js);
                if(k === undefined)
                    names.add(js, (k = new Dummy(js)));

                return k;
            }else if(j instanceof Cell){
                var jc = <Cell>j;
                return LL.mapCar((x) => {
                    return Interpreter.scanDummies(x, names);
                }, jc);
            }else{
                return j;
            }
        }

        private evalCatch(xc : Cell){}

        private evalUnwindProtect(xc : Cell){}
    }

    export var interp = new Interpreter();
}