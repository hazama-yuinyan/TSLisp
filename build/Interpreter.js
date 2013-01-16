var TSLisp;
(function (TSLisp) {
    var Interpreter = (function () {
        function Interpreter(native_read_func) {
            this.environ = null;
            this.console = Common.HtmlConsole;
            this.symbols = new Common.HashTable(1000, function (key) {
                return Utils.getHashCodeFor(key);
            }, function (lhs, rhs) {
                return lhs == rhs;
            });
            this.lazy = new Common.HashTable(100, function (key) {
                return Utils.getHashCodeFor(key);
            }, function (lhs, rhs) {
                return lhs == rhs;
            });
            this.symbols.add(TSLisp.LL.S_ERROR, TSLisp.LL.S_ERROR);
            this.symbols.add(TSLisp.LL.S_T, TSLisp.LL.S_T);
            this.symbols.add(TSLisp.Symbol.symbolOf("*version*"), TSLisp.LL.list(TSLisp.LL.Version, "TypeScript"));
            this.symbols.add(TSLisp.Symbol.symbolOf("*eof*"), TSLisp.LL.S_EOF);
            this.symbols.add(TSLisp.Symbol.symbolOf("*pi*"), Math.PI);
            this.symbols.add(TSLisp.Symbol.symbolOf("*napier*"), Math.E);
            var read_help_msg = "(read) => an object that will get set the input from the user after the user finishes inputing\n" + "; reads an S expression from the standard input\n" + "NOTE: This function just returns a placeholder object for the supplied expression due to the limitation of JavaScript and\n" + "the Web environment. So the expression '(eval (read))' doesn't work as you expect but it just results in nothing\n" + ", or on some platforms, it might even raises an exception because the read function just returns an object '{expr : \"\"}'\n" + "and the eval function doesn't accept such a to-be-filled-with-S-expr object.\n" + "And as such, please make sure to extract the 'expr' property using the 'ts-get-property' function before further computation\n";
            "or you'll end up seeing a native exception being thrown.";
            var read_func_obj = new TSLisp.LispFunction(native_read_func, read_help_msg, false, false);
            this.symbols.add(TSLisp.Symbol.symbolOf("read"), read_func_obj);
            var list_func = TSLisp.LL.listFrom;
            var list_func_obj = new TSLisp.LispFunction(list_func, "(list a b c ...) => (a b c ...)", false, true);
            this.symbols.add(TSLisp.LL.S_LIST, list_func_obj);
            this.lazy.add(list_func, true);
        }
        Object.defineProperty(Interpreter.prototype, "SymbolTable", {
            get: function () {
                return this.symbols;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Interpreter.prototype, "LazyTable", {
            get: function () {
                return this.lazy;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Interpreter.prototype, "Environment", {
            get: function () {
                return this.environ;
            },
            enumerable: true,
            configurable: true
        });
        Interpreter.prototype.evaluateString = function (text) {
            var lisp_expr = new TSLisp.Reader(TSLisp.Lines.fromString(text)).read();
            return this.evaluate(lisp_expr, false);
        };
        Interpreter.prototype.evaluateStrings = function (lines) {
            var parser = new TSLisp.Reader(TSLisp.Lines.fromString(lines));
            var result = null;
            while(true) {
                var lisp_expr = parser.read();
                if(lisp_expr == TSLisp.LL.S_EOF) {
                    return result;
                }
                result = this.evaluate(lisp_expr, false);
            }
        };
        Interpreter.prototype.loadNatives = function (target) {
            var _this = this;
            if(!target) {
                target = TSLisp.built_in_funcs;
            }
            target.forEach(function (obj) {
                var is_lazy = false;
                var func_obj = new TSLisp.LispFunction(null, null, false, false);
                var name = "";
                for(var key in obj) {
                    if(obj.hasOwnProperty(key)) {
                        switch(key) {
                            case "is_lazy": {
                                is_lazy = obj[key];
                                break;

                            }
                            case "help_msg": {
                                func_obj.help_msg = obj[key];
                                break;

                            }
                            case "has_optional": {
                                func_obj.has_optional = obj[key];
                                break;

                            }
                            case "accepts_variable_args": {
                                func_obj.accepts_variable_args = obj[key];
                                break;

                            }
                            default: {
                                name = key;
                                func_obj.body = obj[key];
                                break;

                            }
                        }
                    }
                }
                _this.symbols.add(TSLisp.Symbol.symbolOf(name), func_obj);
                if(is_lazy) {
                    _this.lazy.add(func_obj.body, is_lazy);
                }
            });
        };
        Interpreter.prototype.evaluate = function (x, canLoseEnviron) {
            try  {
                while(true) {
                    if(x instanceof TSLisp.Symbol) {
                        return this.evalSymbol(x);
                    } else {
                        if(x instanceof TSLisp.Arg) {
                            return (x).getValue(this.environ);
                        } else {
                            if(x instanceof TSLisp.Cell) {
                                var xc = x;
                                var fn = xc.car;
                                if(fn == TSLisp.LL.S_QUOTE) {
                                    var kdr = xc.cdr;
                                    if(kdr == null || kdr.cdr != null) {
                                        throw ErrorFactory.makeEvalException("Found a bad quotation!");
                                    }
                                    return kdr.car;
                                } else {
                                    if(fn == TSLisp.LL.S_PROGN) {
                                        x = this.evalProgN(xc);
                                    } else {
                                        if(fn == TSLisp.LL.S_COND) {
                                            var tmp = [
                                                x
                                            ];
                                            if(this.evalCond(tmp)) {
                                                return tmp[1];
                                            } else {
                                                x = tmp[1];
                                            }
                                        } else {
                                            if(fn == TSLisp.LL.S_SETQ) {
                                                return this.evalSetQ(xc);
                                            } else {
                                                if(fn == TSLisp.LL.S_LAMBDA) {
                                                    var compiled = this.compile(x);
                                                    return new TSLisp.Closure(compiled.arity, compiled.x, this.environ);
                                                } else {
                                                    if(fn == TSLisp.LL.S_MACRO) {
                                                        if(this.environ != null) {
                                                            throw ErrorFactory.makeEvalException("Nested macro!", x);
                                                        }
                                                        var substituted = Interpreter.substituteDummyVariables(x);
                                                        var compiled = this.compile(substituted);
                                                        return new TSLisp.Macro(compiled.arity, compiled.x);
                                                    } else {
                                                        if(fn == TSLisp.LL.S_CATCH) {
                                                        } else {
                                                            if(fn == TSLisp.LL.S_UNWIND_PROTECT) {
                                                            } else {
                                                                if(fn == TSLisp.LL.S_DELAY) {
                                                                    var kdr = xc.cdr;
                                                                    if(kdr == null || kdr.cdr != null) {
                                                                        throw ErrorFactory.makeEvalException("Bad delay!");
                                                                    }
                                                                    return new TSLisp.Promise(kdr.car, this.environ, this);
                                                                } else {
                                                                    var arg_list = xc.cdr;
                                                                    if(!(arg_list instanceof TSLisp.Cell) && xc.cdr != null) {
                                                                        throw new TSLisp.ProperListExpected(x);
                                                                    }
                                                                    fn = this.evaluate(fn, false);
                                                                    if(fn instanceof TSLisp.Promise) {
                                                                        fn = (fn).resolve();
                                                                    }
                                                                    if(fn instanceof TSLisp.Closure) {
                                                                        var args = this.getArgs(arg_list, false);
                                                                        var tmp = [];
                                                                        if(this.applyDefined(fn, args, canLoseEnviron, tmp)) {
                                                                            return tmp[0];
                                                                        } else {
                                                                            x = tmp[0];
                                                                        }
                                                                    } else {
                                                                        if(fn instanceof TSLisp.Macro) {
                                                                            var args = TSLisp.LL.listFromTS(arg_list);
                                                                            var tmp = [];
                                                                            this.applyDefined(fn, args, false, tmp);
                                                                            x = tmp[0];
                                                                        } else {
                                                                            return this.callNative(fn, arg_list, !this.lazy.contains(fn.body));
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                if(x instanceof TSLisp.Lambda) {
                                    var xl = x;
                                    return new TSLisp.Closure(xl.arity, xl.body, this.environ);
                                } else {
                                    return x;
                                }
                            }
                        }
                    }
                }
            } catch (ex) {
                if(ex instanceof TSLisp.EvalException && ex.Trace.length < TSLisp.LL.MAX_EXC_TRACES) {
                    ex.Trace.push(TSLisp.LL.str(x));
                }
                throw ex;
            }
        };
        Interpreter.prototype.apply = function (fn, args) {
            if(fn instanceof TSLisp.Closure || fn instanceof TSLisp.Macro) {
                var df = fn;
                var result = [];
                this.applyDefined(df, args, false, result);
                return result[0];
            } else {
                var func = fn.body;
                var count = args.getCount();
                if(!this.lazy.contains(func)) {
                    for(var i = 0; i < count; ++i) {
                        var e = args.get(i);
                        if(e instanceof TSLisp.Promise) {
                            args.update(i, (e).resolve());
                        }
                    }
                }
                var arg_names = Utils.getArgumentNamesFor(fn);
                var has_optional = fn.has_optional;
                var arity = (fn.accepts_variable_args) ? 3 : arg_names.length;
                switch(arity) {
                    case 0: {
                        if(count !== 0) {
                            this.throwArgException(0, args);
                        }
                        return func();

                    }
                    case 1: {
                        if(!has_optional && count !== 1) {
                            this.throwArgException(1, args);
                        }
                        return func(args.get(0));

                    }
                    case 2: {
                        if(!has_optional && count !== 2) {
                            this.throwArgException(2, args);
                        }
                        return func(args.get(0), args.get(1));

                    }
                    default: {
                        return func(args);

                    }
                }
            }
        };
        Interpreter.prototype.evalSymbol = function (name) {
            var val = this.symbols.lookup(name);
            if(val === undefined) {
                throw ErrorFactory.createEvalException("Unbound variable", name);
            }
            return val;
        };
        Interpreter.prototype.evalProgN = function (xc) {
            var body = xc.cdr;
            if(body == null) {
                return null;
            }
            var c = body;
            if(!(c instanceof TSLisp.Cell)) {
                throw new TSLisp.ProperListExpected(xc);
            }
            while(true) {
                var d = c.cdr;
                if(d instanceof TSLisp.Cell) {
                    this.evaluate(c.car, false);
                    c = d;
                } else {
                    if(d != null) {
                        throw new TSLisp.ProperListExpected(xc);
                    }
                    return c.car;
                }
            }
        };
        Interpreter.prototype.evalCond = function (x) {
            var xc = x[0];
            var body = xc.cdr;
            while(body instanceof TSLisp.Cell) {
                var bc = body;
                var clause = bc.car;
                if(clause instanceof TSLisp.Cell) {
                    var cc = clause;
                    var result = this.evaluate(cc.car, false);
                    if(result instanceof TSLisp.Promise) {
                        (result).resolve();
                    }
                    if(result != null) {
                        clause = cc.cdr;
                        cc = clause;
                        if(!(cc instanceof TSLisp.Cell)) {
                            x[1] = result;
                            return true;
                        }
                        while(true) {
                            var d = cc.cdr;
                            if(d instanceof TSLisp.Cell) {
                                this.evaluate(cc.car, false);
                                cc = d;
                            } else {
                                if(d != null) {
                                    throw new TSLisp.ProperListExpected(clause);
                                }
                                x[1] = cc.car;
                                return false;
                            }
                        }
                    }
                } else {
                    if(clause != null) {
                        throw ErrorFactory.createEvalException("Not any test clause found in cond", clause);
                    }
                }
                body = bc.cdr;
            }
            if(body != null) {
                throw new TSLisp.ProperListExpected(xc);
            }
            x[1] = null;
            return true;
        };
        Interpreter.prototype.evalSetQ = function (xc) {
            var c = xc;
            var result = null;
            while(true) {
                var body = c.cdr;
                c = body;
                if(!(c instanceof TSLisp.Cell)) {
                    if(body != null) {
                        throw new TSLisp.ProperListExpected(xc);
                    }
                    return result;
                }
                var lval = c.car;
                c = c.cdr;
                if(!(c instanceof TSLisp.Cell)) {
                    throw ErrorFactory.createEvalException("Missing the right-hand-side of a SetQ form");
                }
                result = this.evaluate(c.car, false);
                if(lval instanceof TSLisp.Symbol) {
                    this.symbols.addOrUpdate(lval, result);
                } else {
                    if(lval instanceof TSLisp.Arg) {
                        (lval).setValue(result, this.environ);
                    } else {
                        throw new TSLisp.VariableExpected(lval);
                    }
                }
            }
        };
        Interpreter.prototype.throwArgException = function (expectedNumArgs, argList) {
            switch(expectedNumArgs) {
                case 0: {
                    throw ErrorFactory.createEvalException("No args expected", argList);

                }
                case 1: {
                    throw ErrorFactory.createEvalException("One arg expected", argList);

                }
                case 2: {
                    throw ErrorFactory.createEvalException("Two args expected", argList);

                }
            }
        };
        Interpreter.prototype.callNative = function (fn, argList, willForce) {
            if(!(fn instanceof TSLisp.LispFunction)) {
                throw ErrorFactory.makeEvalException("Not applicable: {not_callable}", {
                    not_callable: TSLisp.LL.str(fn)
                });
            }
            var func = fn.body, has_optional = fn.has_optional;
            try  {
                var arg_names = Utils.getArgumentNamesFor(func);
                var arity = (fn.accepts_variable_args) ? 3 : arg_names.length;
                switch(arity) {
                    case 0: {
                        if(argList != null) {
                            this.throwArgException(0, argList);
                        }
                        return func();

                    }
                    case 1: {
                        if(has_optional && argList == null) {
                            return func();
                        }
                        if(argList == null) {
                            this.throwArgException(1, argList);
                        }
                        var x = this.evalAndForce(argList.car, willForce);
                        if(argList.cdr != null) {
                            this.throwArgException(1, argList);
                        }
                        return func(x);

                    }
                    case 2: {
                        if(has_optional && argList == null) {
                            return func();
                        }
                        if(argList == null) {
                            this.throwArgException(2, argList);
                        }
                        var x = this.evalAndForce(argList.car, willForce);
                        var j = argList.cdr;
                        if(has_optional && !(j instanceof TSLisp.Cell)) {
                            return func(x);
                        }
                        if(!(j instanceof TSLisp.Cell)) {
                            this.throwArgException(2, argList);
                        }
                        var y = this.evalAndForce(j.car, willForce);
                        if(j.cdr != null) {
                            this.throwArgException(2, argList);
                        }
                        return func(x, y);

                    }
                    default: {
                        var args = this.getArgs(argList, willForce);
                        return func(args);

                    }
                }
            } catch (ex) {
                fn = this.symbols.findKey(fn);
                throw ErrorFactory.makeEvalException("{name}: {message} -- {func_name} {args}", {
                    name: ex.name,
                    message: ex.message,
                    func_name: fn,
                    args: TSLisp.LL.str(argList)
                });
            }
        };
        Interpreter.prototype.evalAndForce = function (arg, willForce) {
            var x = this.evaluate(arg, false);
            if(willForce && x instanceof TSLisp.Promise) {
                x = (x).resolve();
            }
            return x;
        };
        Interpreter.prototype.getArgs = function (argList, willForce) {
            var args = new Common.List();
            var jc = argList;
            if(jc != null) {
                while(true) {
                    var x = this.evalAndForce(jc.car, willForce);
                    args.add(x);
                    var j = jc.cdr;
                    jc = j;
                    if(jc == null) {
                        if(j != null) {
                            throw new TSLisp.ProperListExpected(argList);
                        }
                        break;
                    }
                }
            }
            return args;
        };
        Interpreter.prototype.applyDefined = function (fn, args, canLoseEnviron, x) {
            var body = fn.body;
            if(!(body instanceof TSLisp.Cell)) {
                throw ErrorFactory.createEvalException("Missing function body!");
            }
            var arity = fn.arity;
            if(arity < 0) {
                arity = -arity - 1;
                if(arity <= args.getCount()) {
                    var er = args.getEnumerator();
                    args = new Common.List(Common.take(arity, er));
                    var rest = TSLisp.LL.listFrom(Common.takeAll(er));
                    args.add(rest);
                    ++arity;
                }
            }
            if(arity != args.getCount()) {
                throw ErrorFactory.createEvalException("The number of arguments doesn't match that of parameters");
            }
            var old_env = this.environ;
            this.environ = new TSLisp.Cell(args, fn.env);
            try  {
                while(true) {
                    var d = body.cdr;
                    if(!(d instanceof TSLisp.Cell)) {
                        break;
                    }
                    this.evaluate(body.car, false);
                    body = d;
                }
                if(canLoseEnviron) {
                    old_env = this.environ;
                    x[0] = body.car;
                    return false;
                } else {
                    x[0] = this.evaluate(body.car, true);
                    return true;
                }
            }finally {
                this.environ = old_env;
            }
        };
        Interpreter.prototype.compile = function (x) {
            console.log(x instanceof TSLisp.Cell);
            console.log((x).car == TSLisp.LL.S_LAMBDA || (x).car == TSLisp.LL.S_MACRO);
            var j = x.cdr;
            if(!(j instanceof TSLisp.Cell)) {
                throw ErrorFactory.createEvalException("Missing the argument list and the body!");
            }
            var result = Interpreter.makeArgTable(j.car);
            var arity = result.table.getCount();
            if(result.has_rest) {
                arity = -arity;
            }
            j = j.cdr;
            if(!(j instanceof TSLisp.Cell)) {
                throw ErrorFactory.createEvalException("Missing the body!");
            }
            j = Interpreter.scanArgs(j, result.table);
            j = this.expandMacros(j, TSLisp.LL.MAX_MACRO_EXPS);
            j = this.compileInners(j);
            return {
                arity: arity,
                x: j
            };
        };
        Interpreter.prototype.expandMacros = function (j, count) {
            var _this = this;
            if(count > 0 && j instanceof TSLisp.Cell) {
                var jc = j;
                var k = jc.car;
                if(k == TSLisp.LL.S_QUOTE || k == TSLisp.LL.S_LAMBDA || k == TSLisp.LL.S_MACRO) {
                    return j;
                }
                if(k instanceof TSLisp.Symbol) {
                    var v = this.symbols.lookup(k);
                    if(v !== undefined) {
                        k = v;
                    }
                }
                if(k instanceof TSLisp.Macro) {
                    var args = TSLisp.LL.listFromTS(jc.cdr);
                    var z = [];
                    this.applyDefined(k, args, false, z);
                    return this.expandMacros(z[0], count - 1);
                } else {
                    return TSLisp.LL.mapCar(function (x) {
                        return _this.expandMacros(x, count);
                    }, jc);
                }
            } else {
                return j;
            }
        };
        Interpreter.prototype.compileInners = function (j) {
            var _this = this;
            if(j instanceof TSLisp.Cell) {
                var jc = j;
                var k = jc.car;
                if(k == TSLisp.LL.S_QUOTE) {
                    return j;
                } else {
                    if(k == TSLisp.LL.S_LAMBDA) {
                        var compiled = this.compile(j);
                        return new TSLisp.Lambda(compiled.arity, compiled.x);
                    } else {
                        if(k == TSLisp.LL.S_MACRO) {
                            throw new TSLisp.EvalException("Nested macro", j);
                        } else {
                            return TSLisp.LL.mapCar(function (x) {
                                return _this.compileInners(x);
                            }, jc);
                        }
                    }
                }
            } else {
                return j;
            }
        };
        Interpreter.makeArgTable = function makeArgTable(args) {
            var offset = 0;
            var result = {
                table: new Common.Dictionary(),
                has_rest: false
            };
            var i = args;
            while(i instanceof TSLisp.Cell) {
                var j = (i).car;
                if(result.has_rest) {
                    throw ErrorFactory.createEvalException("Can not declare rest parameters multiple times!", j);
                }
                if(j == TSLisp.LL.S_REST) {
                    i = (i).cdr;
                    if(!(i instanceof TSLisp.Cell)) {
                        throw new TSLisp.VariableExpected(i);
                    }
                    j = (i).car;
                    if(j == TSLisp.LL.S_REST) {
                        throw new TSLisp.VariableExpected(j);
                    }
                    result.has_rest = true;
                }
                var sym;
                if(j instanceof TSLisp.Symbol) {
                    sym = j;
                } else {
                    if(j instanceof TSLisp.Arg) {
                        sym = (j).symbol;
                        j = sym;
                    } else {
                        if(j instanceof TSLisp.Dummy) {
                            sym = (j).symbol;
                        } else {
                            throw new TSLisp.VariableExpected(j);
                        }
                    }
                }
                result.table.add(j, new TSLisp.Arg(0, offset, sym));
                ++offset;
                i = (i).cdr;
            }
            if(i != null) {
                throw new TSLisp.ProperListExpected(i);
            }
            return result;
        }
        Interpreter.scanArgs = function scanArgs(j, table) {
            if(j instanceof TSLisp.Symbol || j instanceof TSLisp.Dummy) {
                var k = table.lookup(j);
                return (k === undefined) ? j : k;
            } else {
                if(j instanceof TSLisp.Arg) {
                    var ja = j;
                    var k = table.lookup(ja.symbol);
                    if(k !== undefined) {
                        return k;
                    } else {
                        return new TSLisp.Arg(ja.level + 1, ja.offset, ja.symbol);
                    }
                } else {
                    if(j instanceof TSLisp.Cell) {
                        var jc = j;
                        if(jc.car == TSLisp.LL.S_QUOTE) {
                            return jc;
                        } else {
                            return TSLisp.LL.mapCar(function (x) {
                                return Interpreter.scanArgs(x, table);
                            }, jc);
                        }
                    } else {
                        return j;
                    }
                }
            }
        }
        Interpreter.substituteDummyVariables = function substituteDummyVariables(x) {
            return Interpreter.scanDummies(x, new Common.Dictionary());
        }
        Interpreter.scanDummies = function scanDummies(j, names) {
            if(j instanceof TSLisp.Symbol) {
                var js = j;
                if(js.Name[0] != '$') {
                    return j;
                }
                var k = names.lookup(js);
                if(k === undefined) {
                    names.add(js, (k = new TSLisp.Dummy(js)));
                }
                return k;
            } else {
                if(j instanceof TSLisp.Cell) {
                    var jc = j;
                    return TSLisp.LL.mapCar(function (x) {
                        return Interpreter.scanDummies(x, names);
                    }, jc);
                } else {
                    return j;
                }
            }
        }
        Interpreter.prototype.evalCatch = function (xc) {
        };
        Interpreter.prototype.evalUnwindProtect = function (xc) {
        };
        return Interpreter;
    })();
    TSLisp.Interpreter = Interpreter;    
    TSLisp.interp = null;
})(TSLisp || (TSLisp = {}));
