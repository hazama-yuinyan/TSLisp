var TSLisp;
(function (TSLisp) {
    var Reader = (function () {
        function Reader(input) {
            this.has_current = true;
            this.lexer = new Lexer(input);
            this.tk = this.lexer.getEnumerator();
        }
        Reader.EOF = TSLisp.LL.S_EOF;
        Object.defineProperty(Reader.prototype, "Current", {
            get: function () {
                if(this.has_current) {
                    var tc = this.tk.Current;
                    if(tc instanceof SyntaxError) {
                        throw tc;
                    }
                    return tc;
                } else {
                    throw new SyntaxError("Unexpected EOF");
                }
            },
            enumerable: true,
            configurable: true
        });
        Reader.prototype.read = function () {
            this.lexer.reset();
            if(this.has_current) {
                this.moveNext();
            }
            if(this.has_current) {
                try  {
                    return this.parseExpression();
                } catch (ex) {
                    this.last_error = true;
                    throw new TSLisp.EvalException("SyntaxError : " + ex.message + " : " + this.lexer.Line);
                }
            } else {
                return Reader.EOF;
            }
        };
        Reader.prototype.moveNext = function () {
            this.has_current = this.tk.moveNext();
        };
        Reader.prototype.parseExpression = function () {
            var tc = this.Current;
            switch(tc) {
                case '.':
                case ')': {
                    throw new SyntaxError("Unexpected " + tc);

                }
                case '(': {
                    this.moveNext();
                    return this.parseListBody();

                }
                case '\'': {
                    this.moveNext();
                    return TSLisp.LL.list(TSLisp.LL.S_QUOTE, this.parseExpression());

                }
                case '~': {
                    this.moveNext();
                    return TSLisp.LL.list(TSLisp.LL.S_DELAY, this.parseExpression());

                }
                case '`': {
                    this.moveNext();
                    return QQ.expand(this.parseExpression());

                }
                case ',': {
                    this.moveNext();
                    return new QQ.Unquote(this.parseExpression());

                }
                case ",@": {
                    this.moveNext();
                    return new QQ.UnquoteSplicing(this.parseExpression());

                }
                default: {
                    return tc;

                }
            }
        };
        Reader.prototype.parseListBody = function () {
            if(this.Current == ')') {
                return null;
            } else {
                var e1 = this.parseExpression();
                this.moveNext();
                if(this.Current == '.') {
                    this.moveNext();
                    var e2 = this.parseExpression();
                    this.moveNext();
                    if(this.Current != ')') {
                        throw new SyntaxError("Expected ')' but found " + this.Current);
                    }
                    return new TSLisp.Cell(e1, e2);
                } else {
                    var tail = this.parseListBody();
                    return new TSLisp.Cell(e1, tail);
                }
            }
        };
        return Reader;
    })();
    TSLisp.Reader = Reader;    
    var Lexer = (function () {
        function Lexer(input) {
            this.cur_line = 0;
            this.line = "";
            this.is_eof = false;
            this.state = "eager";
            this.console_obj = input;
            this.raw_input = input.getEnumerator();
        }
        Lexer.EOF = TSLisp.LL.S_EOF;
        Object.defineProperty(Lexer.prototype, "Line", {
            get: function () {
                return this.line;
            },
            enumerable: true,
            configurable: true
        });
        Lexer.prototype.reset = function () {
            this.state = "eager";
            if(this.console_obj.reset) {
                this.console_obj.reset();
            }
        };
        Lexer.prototype.getEnumerator = function () {
            var _this = this;
            var ch;
            return new Common.Enumerator(function () {
                if(_this.state == "eager") {
                    _this.state = "full";
                    if(_this.raw_input.moveNext()) {
                        _this.line = _this.raw_input.Current;
                        ++_this.cur_line;
                        var cur_pos = 0;
                        ch = new Common.Enumerator(function () {
                            if(_this.line.length > cur_pos) {
                                return _this.line[cur_pos++];
                            }
                        });
                        ch.moveNext();
                    } else {
                        _this.is_eof = true;
                    }
                } else {
                    if(_this.state != "parsing_list") {
                        ch.moveNext();
                    } else {
                        _this.state = "full";
                    }
                }
                while(true) {
                    while(!_this.is_eof && Utils.isWhitespace(ch.Current)) {
                        ch.moveNext();
                    }
                    if(_this.is_eof) {
                        break;
                    }
                    var cc = ch.Current;
                    if(!cc) {
                        return Lexer.EOF;
                    }
                    switch(cc) {
                        case ';': {
                            while(ch.moveNext() && ch.Current != '\n') {
                                ; ;
                            }
                            if(_this.is_eof) {
                                return;
                            }
                            break;

                        }
                        case '(':
                        case ')':
                        case '.':
                        case '\'':
                        case '`':
                        case '~': {
                            return cc;
                            break;

                        }
                        case ',': {
                            ch.moveNext();
                            if(ch.Current == '@') {
                                return ",@";
                            } else {
                                _this.state = "parsing_list";
                                return ',';
                            }
                            break;

                        }
                        case '"': {
                            return _this.getString(ch);
                            break;

                        }
                        default: {
                            _this.state = "parsing_list";
                            var token = "";
                            while(true) {
                                token += cc;
                                if(!ch.moveNext()) {
                                    break;
                                }
                                cc = ch.Current;
                                if(cc == '(' || cc == ')' || cc == '\'' || cc == '~' || Utils.isWhitespace(cc)) {
                                    break;
                                }
                            }
                            if(token == "nil") {
                                return null;
                            } else {
                                var nv = Lexer.tryToParseNumber(token);
                                if(isNaN(nv)) {
                                    if(Lexer.checkSymbol(token)) {
                                        return TSLisp.Symbol.symbolOf(token);
                                    } else {
                                        return new SyntaxError("Bad token: " + TSLisp.LL.str(token));
                                    }
                                } else {
                                    return nv;
                                }
                            }
                            continue;

                        }
                    }
                    ch.moveNext();
                }
            });
        };
        Lexer.prototype.getString = function (ch) {
            var result = "";
            ch.moveNext();
            while(!this.is_eof) {
                switch(ch.Current) {
                    case '"': {
                        return result;

                    }
                    case '\n': {
                        return new SyntaxError("Matching '\"' not found in " + TSLisp.LL.str(result));

                    }
                    case '\\': {
                        ch.moveNext();
                        switch(ch.Current) {
                            case '0':
                            case '1':
                            case '2':
                            case '3':
                            case '4':
                            case '5':
                            case '6':
                            case '7': {
                                result += Lexer.getCharInOct(ch);
                                continue;

                            }
                            case '"': {
                                result += '\"';
                                break;

                            }
                            case '\\': {
                                result += '\\';
                                break;

                            }
                            case 'a': {
                                result += '\a';
                                break;

                            }
                            case 'b': {
                                result += '\b';
                                break;

                            }
                            case 'f': {
                                result += '\f';
                                break;

                            }
                            case 'n': {
                                result += '\n';
                                break;

                            }
                            case 'r': {
                                result += '\r';
                                break;

                            }
                            case 't': {
                                result += '\t';
                                break;

                            }
                            case 'v': {
                                result += '\v';
                                break;

                            }
                            case 'x': {
                                result += Lexer.getCharInHex(ch);
                                continue;

                            }
                            default: {
                                return new SyntaxError("Bad escape: " + ch.Current);

                            }
                        }
                        break;

                    }
                    default: {
                        result += ch.Current;
                        break;

                    }
                }
                ch.moveNext();
            }
        };
        Lexer.getCharInOct = function getCharInOct(ch) {
            var oct_represen = ch.Current;
            for(var i = 0; ch.moveNext() && i < 2; ++i) {
                var cc = ch.Current;
                if(cc.search(/[0-9]/) != -1) {
                    oct_represen += cc;
                } else {
                    break;
                }
            }
            var in_number = parseInt(oct_represen, 8);
            return String.fromCharCode(in_number);
        }
        Lexer.getCharInHex = function getCharInHex(ch) {
            var hex_represen = "";
            for(var i = 0; ch.moveNext() && i < 2; ++i) {
                var cc = ch.Current;
                if(cc.search(/[0-9a-fA-F]/) != -1) {
                    hex_represen += cc;
                } else {
                    break;
                }
            }
            var in_number = parseInt(hex_represen, 16);
            return String.fromCharCode(in_number);
        }
        Lexer.tryToParseNumber = function tryToParseNumber(token) {
            var radix_sign = token.match(/^[box]/i);
            var radix = 10;

            if(radix_sign) {
                switch(radix_sign[0]) {
                    case 'b':
                    case 'B': {
                        radix = 2;
                        break;

                    }
                    case 'o':
                    case 'O': {
                        radix = 8;
                        break;

                    }
                    case 'x':
                    case 'X': {
                        radix = 16;
                        break;

                    }
                }
                return parseInt(token, radix);
            }
            return parseFloat(token);
        }
        Lexer.checkSymbol = function checkSymbol(token) {
            return token.search(/[^a-zA-Z0-9_&\$\*\/%+\-<>=!\?]/) == -1;
        }
        return Lexer;
    })();
    TSLisp.Lexer = Lexer;    
    (function (QQ) {
        var Unquote = (function () {
            function Unquote(x) {
                this.x = x;
            }
            Unquote.prototype.toString = function () {
                return "," + TSLisp.LL.str(this.x);
            };
            return Unquote;
        })();
        QQ.Unquote = Unquote;        
        var UnquoteSplicing = (function () {
            function UnquoteSplicing(x) {
                this.x = x;
            }
            UnquoteSplicing.prototype.toString = function () {
                return ",@" + TSLisp.LL.str(this.x);
            };
            return UnquoteSplicing;
        })();
        QQ.UnquoteSplicing = UnquoteSplicing;        
        function expand(x) {
            if(x instanceof TSLisp.Cell) {
                var t = QQ.expand1(x);
                if(t.Cdr == null) {
                    var k = t.Car;
                    if(k instanceof TSLisp.Cell && k.Car == TSLisp.LL.S_LIST || k.Car == TSLisp.LL.S_CONS) {
                        return k;
                    }
                }
                return new TSLisp.Cell(TSLisp.LL.S_APPEND, t);
            } else {
                if(x instanceof QQ.Unquote) {
                    return (x).x;
                } else {
                    return QQ.quote(x);
                }
            }
        }
        QQ.expand = expand;
        function quote(x) {
            if(x instanceof TSLisp.Symbol || x instanceof TSLisp.Arg || x instanceof TSLisp.Cell) {
                return TSLisp.LL.list(TSLisp.LL.S_QUOTE, x);
            } else {
                return x;
            }
        }
        QQ.quote = quote;
        function expand1(x) {
            if(x instanceof TSLisp.Cell) {
                var xc = x;
                var h = QQ.expand2(xc.Car);
                var t = QQ.expand1(xc.Cdr);
                if(t instanceof TSLisp.Cell) {
                    var tc = t;
                    if(tc.Car == null && tc.Cdr == null) {
                        return TSLisp.LL.list(h);
                    } else {
                        if(h instanceof TSLisp.Cell) {
                            var hc = h;
                            if(hc.Car == TSLisp.LL.S_LIST) {
                                if(tc.Car instanceof TSLisp.Cell) {
                                    var t_car = tc.Car;
                                    if(t_car.Car == TSLisp.LL.S_LIST) {
                                        var hh = QQ.concat(hc, t_car.Cdr);
                                        return new TSLisp.Cell(hh, tc.Cdr);
                                    }
                                }
                                if(hc.Cdr instanceof TSLisp.Cell) {
                                    var hh2 = QQ.consCons(hc.Cdr, tc.Car);
                                    return new TSLisp.Cell(hh2, tc.Cdr);
                                }
                            }
                        }
                    }
                }
                return new TSLisp.Cell(h, t);
            } else {
                if(x instanceof Unquote) {
                    return TSLisp.LL.list((x).x);
                } else {
                    return TSLisp.LL.list(QQ.quote(x));
                }
            }
        }
        QQ.expand1 = expand1;
        function concat(x, y) {
            if(x == null) {
                return y;
            } else {
                return new TSLisp.Cell(x.Car, QQ.concat(x.Cdr, y));
            }
        }
        QQ.concat = concat;
        function consCons(x, y) {
            if(x == null) {
                return y;
            } else {
                return TSLisp.LL.list(TSLisp.LL.S_CONS, x.Car, QQ.consCons(x.Cdr, y));
            }
        }
        QQ.consCons = consCons;
        function expand2(x) {
            if(x instanceof Unquote) {
                return TSLisp.LL.list(TSLisp.LL.S_LIST, (x).x);
            } else {
                if(x instanceof UnquoteSplicing) {
                    return (x).x;
                } else {
                    return TSLisp.LL.list(TSLisp.LL.S_LIST, QQ.expand(x));
                }
            }
        }
        QQ.expand2 = expand2;
    })(TSLisp.QQ || (TSLisp.QQ = {}));
    var QQ = TSLisp.QQ;

})(TSLisp || (TSLisp = {}));

