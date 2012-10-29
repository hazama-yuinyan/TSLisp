var TSLisp;
(function (TSLisp) {
    function arithmeticAdd(lhs, rhs) {
        if(typeof lhs === "string" || typeof rhs === "string") {
            throw new TSLisp.EvalException("Can not add number to string or vice-versa!\nUse add function!");
        }
        return lhs + rhs;
    }
    TSLisp.built_in_funcs = [
        {
            car: function (list) {
                return (list == null) ? null : (list).car;
            },
            is_lazy: false,
            help_msg: "(car (cons x y)) => x"
        }, 
        {
            cdr: function (list) {
                return (list == null) ? null : (list).cdr;
            },
            is_lazy: false,
            help_msg: "(cdr (cons x y)) => y"
        }, 
        {
            cons: function (car, cdr) {
                return new TSLisp.Cell(car, cdr);
            },
            is_lazy: true,
            help_msg: "(cons x y) => (x . y)"
        }, 
        {
            atom: function (x) {
                return (x instanceof TSLisp.Cell) ? null : TSLisp.LL.S_T;
            },
            is_lazy: false,
            help_msg: "(atom x) => t; if x is not a Cell, otherwise nil"
        }, 
        {
            eq: function (x, y) {
                return (x == y) ? TSLisp.LL.S_T : null;
            },
            is_lazy: false,
            help_msg: "(eq x y) => t; if x and y refer to the same object, otherwise nil"
        }, 
        {
            stringp: function (x) {
                return (typeof x === "string") ? TSLisp.LL.S_T : null;
            },
            is_lazy: false,
            help_msg: "(stringp x) => t; if x is a string, otherwise nil"
        }, 
        {
            print1: function (x) {
                Common.HtmlConsole.print(TSLisp.LL.str(x, true));
                return x;
            },
            is_lazy: false,
            help_msg: "(print1 x) : print x(if x is a string then double-quote it)"
        }, 
        {
            printc: function (x) {
                Common.HtmlConsole.print(TSLisp.LL.str(x, false));
                return x;
            },
            is_lazy: false,
            help_msg: "(printc x) : just print x as it is(so strings won't be double-quoted)"
        }, 
        {
            terpri: function () {
                Common.HtmlConsole.println("");
                return true;
            },
            is_lazy: false,
            help_msg: "(terpri) : print a '\n'"
        }, 
        {
            force: function (x) {
                return x;
            },
            is_lazy: false,
            help_msg: "(force x) => x(if x is a Promise then resolve it)"
        }, 
        {
            replaca: function (cons, newCar) {
                (cons).car = newCar;
                return newCar;
            },
            is_lazy: false,
            help_msg: "(replace (cons x y) a) => a : replace x with a"
        }, 
        {
            replacd: function (cons, newCdr) {
                (cons).cdr = newCdr;
                return newCdr;
            },
            is_lazy: false,
            help_msg: "(replacd (cons x y) a) => a : replace y with a"
        }, 
        {
            "throw": function (tag, value) {
                throw new TSLisp.LispThrowException(tag, value);
            },
            is_lazy: false,
            help_msg: "(throw tag value) : throw value with tag"
        }, 
        {
            length: function (arg) {
                if(arg == null) {
                    return 0;
                } else {
                    if(arg instanceof TSLisp.Cell) {
                        return (arg).Length;
                    } else {
                        if(typeof arg === "string") {
                            return (arg).length;
                        } else {
                            return (arg).getCount();
                        }
                    }
                }
            },
            is_lazy: false,
            help_msg: "(length a list, string or ICollection) => the number of elements"
        }, 
        {
            _add: function (lhs, rhs) {
                return lhs + rhs;
            },
            is_lazy: false,
            help_msg: "(_add str1 str2) => str1 + str2"
        }, 
        {
            _concat: function (args) {
                if(typeof args === "string") {
                    return args;
                } else {
                    var result = "";
                    if(args != null) {
                        var er = (args).getEnumerator();
                        while(er.moveNext()) {
                            result += er.Current.toString();
                        }
                    }
                    return result;
                }
            },
            is_lazy: false,
            help_msg: "(_concat '(1 2 3)) => \"\x01\x02\x03\""
        }, 
        {
            numberp: function (x) {
                return (typeof x === "number") ? TSLisp.LL.S_T : null;
            },
            is_lazy: false,
            help_msg: "(numberp x) => t; if x is a number, otherwise nil"
        }, 
        {
            "+": function (args) {
                var x = 0;
                args.each(function (arg) {
                    x = arithmeticAdd(x, arg);
                });
                return x;
            },
            is_lazy: false,
            accepts_variable_args: true,
            help_msg: "(+ a b c ...) => a + b + c + ..."
        }, 
        {
            "-": function (args) {
                var n = args.getCount();
                var x = args.get(0);
                if(n == 1) {
                    return -x;
                }
                for(var i = 1; i < n; ++i) {
                    x = x - args.get(i);
                }
                return x;
            },
            is_lazy: false,
            accepts_variable_args: true,
            help_msg: "(- a) => -a or (- a b c ...) => a - b - c - ..."
        }, 
        {
            "*": function (args) {
                var x = 1;
                args.each(function (arg) {
                    x = x * arg;
                });
                return x;
            },
            is_lazy: false,
            accepts_variable_args: true,
            help_msg: "(* a b c ...) => a * b * c * ..."
        }, 
        {
            "/": function (args) {
                var n = args.getCount();
                if(n < 2) {
                    throw new TSLisp.EvalException("2 or more arguments expected", args);
                }
                var x = args.get(0);
                for(var i = 1; i < n; ++i) {
                    x = x / args.get(i);
                }
                return x;
            },
            is_lazy: false,
            accepts_variable_args: true,
            help_msg: "(/ a b c ...) => ((a / b) / c) / ..."
        }, 
        {
            "%": function (lhs, rhs) {
                return lhs % rhs;
            },
            is_lazy: false,
            help_msg: "(% a b) => a % b"
        }, 
        {
            "<": function (lhs, rhs) {
                return (lhs < rhs) ? TSLisp.LL.S_T : null;
            },
            is_lazy: false,
            help_msg: "(< a b) => t; if a is less than b, otherwise nil"
        }, 
        {
            eql: function (lhs, rhs) {
                return (lhs === rhs) ? TSLisp.LL.S_T : null;
            },
            is_lazy: false,
            help_msg: "(eql a b) => t; if a and b are the same number, string or reference"
        }, 
        {
            "eval": function (exp) {
                var old_env = TSLisp.interp.Environment;
                TSLisp.interp.Environment = null;
                try  {
                    return TSLisp.interp.evaluate(exp, true);
                }finally {
                    TSLisp.interp.Environment = old_env;
                }
            },
            is_lazy: false,
            help_msg: "(eval x) => evaluate x as a Lisp expression in the global scope"
        }, 
        {
            apply: function (fn, args) {
                return TSLisp.interp.apply(fn, TSLisp.LL.listFromTS((args)));
            },
            is_lazy: false,
            help_msg: "(apply fn (a b c ...)) => (fn a b c ...)"
        }, 
        {
            mapcar: function (fn, seq) {
                return TSLisp.LL.mapCar(function (x) {
                    return TSLisp.interp.apply(fn, new Common.List([
                        x
                    ]));
                }, (seq));
            },
            is_lazy: false,
            help_msg: "(mapcar fn (a b c ...)) => ((fn a) (fn b) (fn c) ...)"
        }, 
        {
            mapc: function (fn, seq) {
                var er = (seq).getEnumerator();
                while(er.moveNext()) {
                    var x = er.Current;
                    TSLisp.interp.apply(fn, new Common.List([
                        x
                    ]));
                }
                return seq;
            },
            is_lazy: false,
            help_msg: "(mapc fn (a b c ...)) : apply fn on a, b, c... in sequence"
        }, 
        {
            "ts-get-property": function (args) {
            },
            is_lazy: false,
            accepts_variable_args: true,
            help_msg: "(ts-get-property)"
        }, 
        {
            "ts-self": function () {
                return TSLisp.interp;
            },
            is_lazy: false,
            help_msg: "(ts-self) => the interpreter instance"
        }, 
        {
            dump: function () {
                var keys = TSLisp.LL.listFrom(new Common.List(TSLisp.interp.SymbolTable.Keys).getEnumerator());
                return TSLisp.LL.list(keys, TSLisp.interp.Environment);
            },
            is_lazy: false,
            help_msg: "(dump) => ((symbols in the global scope...) the environment)"
        }, 
        {
            help: function (arg) {
                if(arg == null) {
                    Common.HtmlConsole.println(help_str);
                } else {
                    if(!(arg instanceof TSLisp.Symbol)) {
                        throw new TSLisp.EvalException("The help function can not take arguments other than a symbol");
                    }
                    var func_obj = TSLisp.interp.SymbolTable.lookup(arg);
                    if(func_obj.help_msg) {
                        Common.HtmlConsole.println(func_obj.help_msg);
                    } else {
                        if(func_obj.body) {
                            Common.HtmlConsole.println("The symbol \"" + arg.toString() + "\" doesn't refer to a function!");
                        } else {
                            Common.HtmlConsole.println("The target function \"" + arg.toString() + "\" doesn't seem to have help message.");
                        }
                    }
                }
                return null;
            },
            is_lazy: false,
            has_optional: true,
            help_msg: "(help [arg]) : print the help message when no args supplied and print the target function's help message."
        }
    ];
    var help_str = "TypeScript Lisp 1.0                                    Oct. 28 2012\n\n" + "A small Lisp implementation in TypeScript\n\n" + "TS Lisp uses the following objects as Lisp values:\n\n" + "  numbers and strings => JavaScript's primitive values(and objects)\n" + "  nil                 => null\n" + "  symbols             => Symbol class objects\n" + "  Cons cells          => Cell class objects\n\n" + "Since the Cell class implements IEnumerable interface, which is similar to the one in C#\n" + "(see Common.ts for more info), you can enumerate it fairly easily.\n\n" + "Characteristics:\n" + "* It's basically a subset of Emacs Lisp but it uses static scope instead of dynamic.\n" + "* It'll always do tail call optimization.\n" + "* The symbol '*version*' refers to a list whose car is the version number and cdr is the platform name\n" + "  on which it is running.\n" + "* The subtract function '-' takes more than one arguments.\n" + "* The divide function '/' takes more than two arguments.\n" + "* (delay x) constructs a Promise object as in Scheme, and it can be shortened to '~x'.\n" + "  The built-in functions and conditional expressions implicitly resolve them.\n" + "* The (read) function returns a EOF symbol when it encounters EOF.\n" + "* Evaluating (lambda ...) yields a function whose parameters are \"compiled\".\n" + "* The form (macro ...) can only be evaluated in the global scope and it yields a Macro object.\n" + "* In the form (macro ...), symbols beginning with '$' are cosidered to be dummy symbols.\n" + "  Dummy symbols are self-evaluating and the \"eq\" function returns t only when it is called in the macro.\n" + "* C-like escape sequences(such as \"\\n\") can be used in the string literal.\n" + "* The back-quotes, commas and comma-ats are resolved when reading.\n" + "  e.g. \"'`((,a b) ,c ,@d)\" => \"(cons (list a 'b) (cons c d))\"\n" + "* Native functions can have optional parameters like the built-in function \"help\" only if they take, at most, two parameters.\n\n";
    "Special forms:\n" + "quote, progn, cond, setq, lambda, macro, delay\n" + "Built-in functions:\n" + "car, cdr, cons, atom, numberp, stringp, eq, eql, list\n" + "print1, printc, terpri, read, +, -, *, /, %, <\n" + "eval, apply, force, replaca, replacd, throw, mapcar, mapc, length\n" + "ts-self\n" + "dump, help\n" + "Predefined variables:\n" + "*error*, *version*, *eof*, t";
})(TSLisp || (TSLisp = {}));

