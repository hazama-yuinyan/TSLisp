var TSLisp;
(function (TSLisp) {
    var Lines = (function () {
        function Lines() { }
        Lines.fromString = function fromString(str) {
            return new Common.StringReader(str);
        }
        return Lines;
    })();
    TSLisp.Lines = Lines;    
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
                    throw ErrorFactory.makeSyntaxError("Unexpected EOF");
                }
            },
            enumerable: true,
            configurable: true
        });
        Reader.prototype.read = function () {
            this.lexer.reset();
            if(this.last_error) {
                var n = this.lexer.LineNumber;
                while(this.has_current && this.lexer.LineNumber == n) {
                    this.moveNext();
                }
                this.last_error = false;
            } else {
                if(this.has_current) {
                    this.moveNext();
                }
            }
            if(this.has_current) {
                try  {
                    return this.parseExpression();
                } catch (ex) {
                    this.last_error = true;
                    throw ErrorFactory.makeEvalException("SyntaxError : {msg} -- {line_num} : {line}", {
                        msg: ex.message,
                        line_num: this.lexer.LineNumber,
                        line: this.lexer.Line
                    });
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
                    throw ErrorFactory.makeSyntaxError("Unexpected {token}", {
                        token: tc
                    });

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
                        throw ErrorFactory.makeSyntaxError("Expected ')' but found {actual}", {
                            actual: this.Current
                        });
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
            this.raw_input = input.getEnumerator();
        }
        Object.defineProperty(Lexer.prototype, "LineNumber", {
            get: function () {
                return this.cur_line;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Lexer.prototype, "Line", {
            get: function () {
                return this.line;
            },
            enumerable: true,
            configurable: true
        });
        Lexer.prototype.reset = function () {
            this.state = "eager";
            this.is_eof = false;
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
                            if(!_this.is_eof && _this.line.length > cur_pos) {
                                return _this.line[cur_pos++];
                            } else {
                                if(_this.raw_input.moveNext()) {
                                    _this.line = _this.raw_input.Current;
                                    ++_this.cur_line;
                                    cur_pos = 0;
                                    return '\n';
                                } else {
                                    _this.is_eof = true;
                                    return undefined;
                                }
                            }
                        });
                        ch.moveNext();
                    } else {
                        _this.is_eof = true;
                    }
                } else {
                    if(_this.state != "don't_move") {
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
                        return undefined;
                    }
                    var cc = ch.Current;
                    if(!cc) {
                        return undefined;
                    }
                    switch(cc) {
                        case ';': {
                            while(ch.moveNext() && ch.Current != '\n') {
                                ; ;
                            }
                            if(_this.is_eof) {
                                return undefined;
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
                                _this.state = "don't_move";
                                return ',';
                            }
                            break;

                        }
                        case '"': {
                            return _this.getString(ch);
                            break;

                        }
                        default: {
                            _this.state = "don't_move";
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
                                        return ErrorFactory.makeSyntaxError("Bad token: {token}", {
                                            token: TSLisp.LL.str(token)
                                        });
                                    }
                                } else {
                                    return nv;
                                }
                            }

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
                        return ErrorFactory.makeSyntaxError("Expected '\"', but found {str}", {
                            str: TSLisp.LL.str(result)
                        });

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
                                return ErrorFactory.makeSyntaxError("Bad escape: {str}", {
                                    str: ch.Current
                                });

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
            var radix_sign = token.match(/^[box]/i), radix = 10;
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
                if(t.cdr === null) {
                    var k = t.car;
                    if(k instanceof TSLisp.Cell && (k.car == TSLisp.LL.S_LIST || k.car == TSLisp.LL.S_CONS)) {
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
                var h = QQ.expand2(xc.car);
                var t = QQ.expand1(xc.cdr);
                if(t instanceof TSLisp.Cell) {
                    var tc = t;
                    if(tc.car === null && tc.cdr === null) {
                        return TSLisp.LL.list(h);
                    } else {
                        if(h instanceof TSLisp.Cell) {
                            var hc = h;
                            if(hc.car == TSLisp.LL.S_LIST) {
                                if(tc.car instanceof TSLisp.Cell) {
                                    var t_car = tc.car;
                                    if(t_car.car == TSLisp.LL.S_LIST) {
                                        var hh = QQ.concat(hc, t_car.cdr);
                                        return new TSLisp.Cell(hh, tc.cdr);
                                    }
                                }
                                if(hc.cdr instanceof TSLisp.Cell) {
                                    var hh2 = QQ.consCons((hc).cdr, tc.car);
                                    return new TSLisp.Cell(hh2, tc.cdr);
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
            if(x === null) {
                return y;
            } else {
                return new TSLisp.Cell(x.car, QQ.concat((x).cdr, y));
            }
        }
        QQ.concat = concat;
        function consCons(x, y) {
            if(x === null) {
                return y;
            } else {
                return TSLisp.LL.list(TSLisp.LL.S_CONS, x.car, QQ.consCons((x).cdr, y));
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
