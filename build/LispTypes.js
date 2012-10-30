var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
}
var TSLisp;
(function (TSLisp) {
    var Symbol = (function () {
        function Symbol(name) {
            this.name = name;
        }
        Symbol.symbols = {
        };
        Object.defineProperty(Symbol.prototype, "Name", {
            get: function () {
                return this.name;
            },
            enumerable: true,
            configurable: true
        });
        Symbol.symbolOf = function symbolOf(name) {
            var s = Symbol.symbols[name];
            if(!s) {
                s = new Symbol(name);
                Symbol.symbols[name] = s;
            }
            return s;
        }
        Symbol.prototype.toString = function () {
            return this.name;
        };
        return Symbol;
    })();
    TSLisp.Symbol = Symbol;    
    var LL = (function () {
        function LL() { }
        LL.Version = 1;
        LL.MAX_EXPANSIONS = 5;
        LL.MAX_MACRO_EXPS = 20;
        LL.MAX_EXC_TRACES = 10;
        LL.S_APPEND = Symbol.symbolOf("append");
        LL.S_CATCH = Symbol.symbolOf("catch");
        LL.S_COND = Symbol.symbolOf("cond");
        LL.S_CONS = Symbol.symbolOf("cons");
        LL.S_DELAY = Symbol.symbolOf("delay");
        LL.S_EOF = Symbol.symbolOf("#<eof>");
        LL.S_ERROR = Symbol.symbolOf("*error*");
        LL.S_LAMBDA = Symbol.symbolOf("lambda");
        LL.S_LIST = Symbol.symbolOf("list");
        LL.S_MACRO = Symbol.symbolOf("macro");
        LL.S_PROGN = Symbol.symbolOf("progn");
        LL.S_QUOTE = Symbol.symbolOf("quote");
        LL.S_REST = Symbol.symbolOf("&rest");
        LL.S_SETQ = Symbol.symbolOf("setq");
        LL.S_T = Symbol.symbolOf("t");
        LL.S_UNWIND_PROTECT = Symbol.symbolOf("unwind-protect");
        LL.str = function str(x, printQuote, recLevel, printed) {
            if(printQuote === undefined) {
                printQuote = true;
            }
            if(recLevel === undefined) {
                recLevel = LL.MAX_EXPANSIONS;
            }
            if(printed === undefined) {
                printed = new Common.HashTable(100, function (key) {
                    return Utils.getHashCodeFor(key);
                }, function (lhs, rhs) {
                    return lhs === rhs;
                });
            }
            var result;
            if(x === null) {
                return "nil";
            } else {
                if(x instanceof Cell) {
                    var xc = x;
                    if(xc.car == LL.S_QUOTE && xc.cdr instanceof Cell) {
                        var xcdr = xc.cdr;
                        if(xcdr.cdr === null) {
                            return "'" + LL.str(xcdr.car, printQuote, recLevel, printed);
                        }
                    }
                    return "(" + xc.repr(printQuote, recLevel, printed) + ")";
                } else {
                    if(typeof x === "string") {
                        var xs = x;
                        if(!printQuote) {
                            return xs;
                        }
                        result = '"';
                        xs = xs.replace(/([\t\n\r\\"])/g, function (match) {
                            return "\\" + match;
                        });
                        result += xs + '"';
                        return result;
                    } else {
                        if(x instanceof Array) {
                            var xl = x;
                            if(printed.contains(xl)) {
                                --recLevel;
                                if(recLevel == 0) {
                                    return "[...]";
                                }
                            } else {
                                printed.add(xl, true);
                            }
                            result = "[";
                            xl.forEach(function (elem, i) {
                                if(i != 0) {
                                    result += ", ";
                                }
                                result += LL.str(elem);
                            });
                            result += "]";
                            return result;
                        } else {
                            return x.toString();
                        }
                    }
                }
            }
        }
        LL.list = function list() {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            var i = 0;
            return LL.listFrom(new Common.EnumeratorStore(new Common.Enumerator(function () {
                if(i < args.length) {
                    return args[i++];
                }
            })));
        }
        LL.listFrom = function listFrom(args) {
            if(!args) {
                return null;
            }
            var er = args.getEnumerator();
            var z = null;
            var y = null;
            while(er.moveNext()) {
                var x = new Cell(er.Current, null);
                if(!z) {
                    z = x;
                } else {
                    y.cdr = x;
                }
                y = x;
            }
            return z;
        }
        LL.listFromTS = function listFromTS(args) {
            if(args == null) {
                return new Common.List();
            } else {
                return new Common.List(args.getEnumerator());
            }
        }
        LL.mapCar = function mapCar(fn, args) {
            if(!fn) {
                throw new TypeError("Null function");
            }
            if(args == null) {
                return null;
            }
            var z = null;
            var y = null;
            var er = args.getEnumerator();
            while(er.moveNext()) {
                var x = new Cell(fn(er.Current), null);
                if(z === null) {
                    z = x;
                } else {
                    y.cdr = x;
                }
                y = x;
            }
            return z;
        }
        return LL;
    })();
    TSLisp.LL = LL;    
    var EvalException = (function () {
        function EvalException(msg, exp) {
            this.trace = [];
            if(exp) {
                this.message = msg + ": " + LL.str(exp);
            } else {
                this.message = msg;
            }
            this.name = "EvalException";
        }
        Object.defineProperty(EvalException.prototype, "Trace", {
            get: function () {
                return this.trace;
            },
            enumerable: true,
            configurable: true
        });
        EvalException.prototype.toString = function () {
            var result = "*** " + this.message;
            this.trace.forEach(function (path, index) {
                result = result + "\n" + index + ": " + path;
            });
            return result;
        };
        return EvalException;
    })();
    TSLisp.EvalException = EvalException;    
    var LispThrowException = (function (_super) {
        __extends(LispThrowException, _super);
        function LispThrowException(tag, value) {
                _super.call(this, "No catcher found for (" + LL.str(tag) + " " + LL.str(value) + ")");
            this.tag = tag;
            this.value = value;
        }
        Object.defineProperty(LispThrowException.prototype, "Tag", {
            get: function () {
                return this.tag;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LispThrowException.prototype, "Value", {
            get: function () {
                return this.value;
            },
            enumerable: true,
            configurable: true
        });
        return LispThrowException;
    })(EvalException);
    TSLisp.LispThrowException = LispThrowException;    
    var VariableExpected = (function (_super) {
        __extends(VariableExpected, _super);
        function VariableExpected(exp) {
                _super.call(this, "Variable expected", exp);
        }
        return VariableExpected;
    })(EvalException);
    TSLisp.VariableExpected = VariableExpected;    
    var ProperListExpected = (function (_super) {
        __extends(ProperListExpected, _super);
        function ProperListExpected(exp) {
                _super.call(this, "Found an ill-formed list", exp);
        }
        return ProperListExpected;
    })(EvalException);
    TSLisp.ProperListExpected = ProperListExpected;    
    var Cell = (function () {
        function Cell(car, cdr) {
            this.car = car;
            this.cdr = cdr;
            this.car = car;
            this.cdr = cdr;
        }
        Object.defineProperty(Cell.prototype, "Car", {
            get: function () {
                return this.car;
            },
            set: function (val) {
                this.cdr = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Cell.prototype, "Cdr", {
            get: function () {
                return this.cdr;
            },
            set: function (val) {
                this.cdr = val;
            },
            enumerable: true,
            configurable: true
        });
        Cell.prototype.getEnumerator = function () {
            var j = this;
            return new Common.Enumerator(function () {
                var jc = j;
                if(!(jc instanceof Cell)) {
                    return undefined;
                }
                j = jc.cdr;
                if(j instanceof Promise) {
                    (j).resolve();
                }
                return jc.car;
            });
        };
        Cell.prototype.toArray = function () {
            var j = this;
            var result = [];

            while(true) {
                if(!(j instanceof (Cell))) {
                    break;
                }
                result.push(j);
                j = j.cdr;
            }
            if(j) {
                throw new ProperListExpected(this);
            }
            return result;
        };
        Object.defineProperty(Cell.prototype, "Length", {
            get: function () {
                return this.toArray().length;
            },
            enumerable: true,
            configurable: true
        });
        Cell.prototype.toString = function () {
            return "Cell(" + this.car + ", " + this.cdr + ")";
        };
        Cell.prototype.repr = function (printQuote, recLevel, printed) {
            if(printed.contains(this)) {
                --recLevel;
                if(recLevel == 0) {
                    return "...";
                }
            } else {
                printed.add(this, true);
            }
            var kdr = this.cdr;
            if(!kdr) {
                return LL.str(this.car, printQuote, recLevel, printed);
            } else {
                if(kdr instanceof Cell) {
                    var s = LL.str(this.car, printQuote, recLevel, printed);
                    var t = kdr.repr(printQuote, recLevel, printed);
                    return s + " " + t;
                } else {
                    var s = LL.str(this.car, printQuote, recLevel, printed);
                    var t = LL.str(this.cdr, printQuote, recLevel, printed);
                    return s + " . " + t;
                }
            }
        };
        return Cell;
    })();
    TSLisp.Cell = Cell;    
    var LispFunction = (function () {
        function LispFunction(body, help_msg, has_optional, accepts_variable_args) {
            this.body = body;
            this.help_msg = help_msg;
            this.has_optional = has_optional;
            this.accepts_variable_args = accepts_variable_args;
        }
        LispFunction.prototype.toString = function () {
            return this.body.toString();
        };
        return LispFunction;
    })();
    TSLisp.LispFunction = LispFunction;    
    var DefinedFunction = (function () {
        function DefinedFunction(arity, body, env) {
            this.arity = arity;
            this.body = body;
            this.env = env;
        }
        return DefinedFunction;
    })();
    TSLisp.DefinedFunction = DefinedFunction;    
    var Macro = (function (_super) {
        __extends(Macro, _super);
        function Macro(arity, body) {
                _super.call(this, arity, body, null);
        }
        Macro.prototype.toString = function () {
            return LL.str(new Cell(Symbol.symbolOf("#<macro>"), new Cell(this.arity, this.body)));
        };
        return Macro;
    })(DefinedFunction);
    TSLisp.Macro = Macro;    
    var Lambda = (function (_super) {
        __extends(Lambda, _super);
        function Lambda(arity, body) {
                _super.call(this, arity, body, null);
        }
        Lambda.prototype.toString = function () {
            return LL.str(new Cell(Symbol.symbolOf("#<lambda>"), new Cell(this.arity, this.body)));
        };
        return Lambda;
    })(DefinedFunction);
    TSLisp.Lambda = Lambda;    
    var Closure = (function (_super) {
        __extends(Closure, _super);
        function Closure(arity, body, env) {
                _super.call(this, arity, body, env);
        }
        Closure.prototype.toString = function () {
            return LL.str(new Cell(Symbol.symbolOf("#<closure>"), new Cell(new Cell(this.arity, this.env), this.body)));
        };
        return Closure;
    })(DefinedFunction);
    TSLisp.Closure = Closure;    
    var Arg = (function () {
        function Arg(level, offset, symbol) {
            this.level = level;
            this.offset = offset;
            this.symbol = symbol;
        }
        Arg.prototype.toString = function () {
            return "#" + this.level + ":" + this.offset + ":" + this.symbol;
        };
        Arg.prototype.setValue = function (x, env) {
            for(var i = 0; i < this.level; ++i) {
                env = x.cdr;
            }
            env.car.update(this.offset, x);
        };
        Arg.prototype.getValue = function (env) {
            for(var i = 0; i < this.level; ++i) {
                env = env.cdr;
            }
            return env.car.get(this.offset);
        };
        return Arg;
    })();
    TSLisp.Arg = Arg;    
    var Dummy = (function () {
        function Dummy(symbol) {
            this.symbol = symbol;
        }
        Dummy.prototype.toString = function () {
            return ":" + this.symbol + ":Dummy";
        };
        return Dummy;
    })();
    TSLisp.Dummy = Dummy;    
    var Promise = (function () {
        function Promise(exp, environ, interp) {
            this.exp = exp;
            this.environ = environ;
            this.interp = interp;
        }
        Promise.NONE = new Cell(null, null);
        Promise.prototype.toString = function () {
            if(this.environ == Promise.NONE) {
                return LL.str(this.exp);
            } else {
                return "#<promise>";
            }
        };
        Object.defineProperty(Promise.prototype, "Value", {
            get: function () {
                if(this.environ == Promise.NONE) {
                    return this.exp;
                } else {
                    return this;
                }
            },
            enumerable: true,
            configurable: true
        });
        Promise.prototype.resolve = function () {
            if(this.environ != Promise.NONE) {
                var old_env = this.interp.environ;
                this.interp.environ = this.environ;
                var x;
                try  {
                    x = this.interp.evaluate(this.exp, true);
                    if(x instanceof Promise) {
                        x = (x).resolve();
                    }
                }finally {
                    this.interp.environ = old_env;
                }
                if(this.environ != Promise.NONE) {
                    this.exp = x;
                    this.environ = Promise.NONE;
                }
            }
            return this.exp;
        };
        return Promise;
    })();
    TSLisp.Promise = Promise;    
})(TSLisp || (TSLisp = {}));

