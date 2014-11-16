///<reference path='LispTypes.ts' />
///<reference path='Utils.ts' />
///<reference path='Common.ts' />
///<reference path='ErrorFactory.ts' />



module TSLisp{
    export class Lines
    {
        public static fromString(str : string) : Common.StringReader
        {
            return new Common.StringReader(str);
        }
    }

    /**
     * S Expression Reader for Lisp.
     */
    export class Reader
    {
        private lexer : Lexer;
        private last_error : bool;
        private tk : Common.Enumerator;
        private has_current : bool = true;
        private static EOF = LL.S_EOF;

        private get Current() {
            if(this.has_current){
                var tc = this.tk.Current;
                if(tc instanceof SyntaxError)
                    throw tc;

                return tc;
            }else
                throw ErrorFactory.makeSyntaxError("Unexpected EOF");
        }

        constructor(input : Common.IEnumerable)
        {
            this.lexer = new Lexer(input);
            this.tk = this.lexer.getEnumerator();
        }

        /**
         * Reads an S Expression from the given lexer.
         */
        public read() : any
        {
            this.lexer.reset();
            if(this.last_error){    //If we saw an error at last time, then skip to the next line
                var n = this.lexer.LineNumber;
                while(this.has_current && this.lexer.LineNumber == n)
                    this.moveNext();
                
                this.last_error = false;
            }else{
                if(this.has_current)
                    this.moveNext();
            }

            if(this.has_current){
                try{
                    return this.parseExpression();
                }
                catch(ex){
                    this.last_error = true;
                    throw ErrorFactory.makeEvalException("SyntaxError : {msg} -- {line_num} : {line}", {
                        msg : ex.message,
                        line_num : this.lexer.LineNumber,
                        line : this.lexer.Line
                    });
                }
            }else{
                return Reader.EOF;
            }
        }

        private moveNext() : void
        {
            this.has_current = this.tk.moveNext();
        }

        private parseExpression()
        {
            var tc = this.Current;
            switch(tc){
            case '.':
            case ')':
                throw ErrorFactory.makeSyntaxError("Unexpected {token}", {token : tc});

            case '(':
                this.moveNext();
                return this.parseListBody();

            case '\'':
                this.moveNext();
                return LL.list(LL.S_QUOTE, this.parseExpression());

            case '~':
                this.moveNext();
                return LL.list(LL.S_DELAY, this.parseExpression());

            case '`':
                this.moveNext();
                return QQ.expand(this.parseExpression());

            case ',':
                this.moveNext();
                return new QQ.Unquote(this.parseExpression());

            case ",@":
                this.moveNext();
                return new QQ.UnquoteSplicing(this.parseExpression());
                
            default:
                return tc;
            }
        }

        private parseListBody()
        {
            if(this.Current == ')'){
                return null;
            }else{
                var e1 = this.parseExpression();
                this.moveNext();
                if(this.Current == '.'){
                    this.moveNext();
                    var e2 = this.parseExpression();
                    this.moveNext();
                    if(this.Current != ')')
                        throw ErrorFactory.makeSyntaxError("Expected ')' but found {actual}", {actual : this.Current});

                    return new Cell(e1, e2);
                }else{
                    var tail = this.parseListBody();
                    return new Cell(e1, tail);
                }
            }
        }
    }

    /**
     * The Lisp lexer. It recognizes tokens in Lisp and returns them one by one.
     */
    export class Lexer implements Common.IEnumerable
    {
        private cur_line : number = 0;
        private line : string = "";
        private is_eof : bool = false;
        
        // In general context of Object-Oriented Programming, raw_input and char_iter should be specified as Common.IEnumerator
        // because these declarations must state that we can use any classes that implement Common.IEnumerator to get a line of input.
        // But unfortunately TypeScript doesn't allow interfaces to have properties, at least as of writing this code, so we're forced
        // to use a concrete class instead. Maybe I should change the Common.Enumerator.Current to Common.Enumerator.getCurrent or something.
        private raw_input : Common.Enumerator;
        private char_iter : Common.Enumerator;
        private state = "eager";

        public get LineNumber() {return this.cur_line;}

        public get Line() {return this.line;}
        
        constructor(input : Common.IEnumerable)
        {
            this.raw_input = input.getEnumerator();
        }
        
        /**
         * Resets the Lexer's state.
         */
    	public reset()
    	{
            if(this.state != "don't_move"){
    		    this.state = "eager";
                this.is_eof = false;
            }
    	}

        public getEnumerator() : Common.Enumerator
        {
            var ch;
            return new Common.Enumerator(() => {
                if(this.state == "eager"){
                    this.state = "full";
                    if(this.raw_input.moveNext()){
                        this.line = this.raw_input.Current;
                        ++this.cur_line;
                        var cur_pos = 0;
                        ch = new Common.Enumerator(() => {
                            if(!this.is_eof && this.line.length > cur_pos){
                                return this.line[cur_pos++];
                            }else{
                                if(this.raw_input.moveNext()){
                                    this.line = this.raw_input.Current;
                                    ++this.cur_line;
                                    cur_pos = 0;
                                    return '\n';
                                }else{
                                    this.is_eof = true;
                                    return undefined;
                                }
                            }
                        });
                        ch.moveNext();
                    }else{
                        this.is_eof = true;
                    }
                }else{
                    if(this.state != "don't_move")
                        ch.moveNext();
                    else
                        this.state = "full";
                }

                while(true){
                    while(!this.is_eof && Utils.isWhitespace(ch.Current)) ch.moveNext();  //skip whitespace characters
                    if(this.is_eof)
                        return undefined;

                    var cc = ch.Current;
                    if(!cc)
                        return undefined;

                    switch(cc){
                    case ';':
                        while(ch.moveNext() && ch.Current != '\n') ;
                        if(this.is_eof) return undefined;
                        break;

                    case '(':
                    case ')':
                    case '.':
                    case '\'':
                    case '`':
                    case '~':
                        return cc;
                        break;

                    case ',':
                        ch.moveNext();
                        if(ch.Current == '@'){
                            return ",@";
                        }else{
                            this.state = "don't_move";
                            return ',';
                        }
                        break;

                    case '"':
                        return this.getString(ch);
                        break;

                    default:
                        this.state = "don't_move";
                        var token = "";
                        while(true){
                            token += cc;
                            if(!ch.moveNext())
                                break;

                            cc = ch.Current;
                            if(cc == '(' || cc == ')' || cc == '\'' || cc == '~' || Utils.isWhitespace(cc))
                                break;
                        }

                        if(token == "nil"){
                            return null;
                        }else{
                            var nv = Lexer.tryToParseNumber(token);
                            if(isNaN(nv)){
                                if(Lexer.checkSymbol(token))
                                    return Symbol.symbolOf(token);
                                else
                                    return ErrorFactory.makeSyntaxError("Bad token: {token}", {token : LL.str(token)});
                            }else{
                                return nv;
                            }
                        }
                    }
                    ch.moveNext();
                }
            });
        }

    	private getString(ch : Common.Enumerator) : any
    	{
            var result = "";
            ch.moveNext();

            while(!this.is_eof){
                switch(ch.Current){
                case '"':
                    return result;

                case '\n':
                    return ErrorFactory.makeSyntaxError("Expected '\"', but found {str}", {str : LL.str(result)});

                case '\\':
                    ch.moveNext();
                    switch(ch.Current){
                    case '0': case '1': case '2': case '3':
                    case '4': case '5': case '6': case '7':
                        result += Lexer.getCharInOct(ch);
                        continue;

                    case '"':
                        result += '\"'; break;

                    case '\\':
                        result += '\\'; break;

                    case 'a':
                        result += '\a'; break;

                    case 'b':
                        result += '\b'; break;

                    case 'f':
                        result += '\f'; break;

                    case 'n':
                        result += '\n'; break;

                    case 'r':
                        result += '\r'; break;

                    case 't':
                        result += '\t'; break;

                    case 'v':
                        result += '\v'; break;

                    case 'x':
                        result += Lexer.getCharInHex(ch);
                        continue;

                    default:
                        return ErrorFactory.makeSyntaxError("Bad escape: {str}", {str : ch.Current});
                    }
                    break;

                default:
                    result += ch.Current;
                    break;
                }

                ch.moveNext();
            }
    	}

        private static getCharInOct(ch : Common.Enumerator) : string
        {
            var oct_represen = ch.Current;
            for(var i = 0; ch.moveNext() && i < 2; ++i){
                var cc = ch.Current;
                if(cc.search(/[0-9]/) != -1)
                    oct_represen += cc;
                else
                    break;
            }

            var in_number = parseInt(oct_represen, 8);
            return String.fromCharCode(in_number);
        }

        private static getCharInHex(ch : Common.Enumerator) : string
        {
            var hex_represen = "";
            for(var i = 0; ch.moveNext() && i < 2; ++i){
                var cc = ch.Current;
                if(cc.search(/[0-9a-fA-F]/) != -1)
                    hex_represen += cc;
                else
                    break;
            }

            var in_number = parseInt(hex_represen, 16);
            return String.fromCharCode(in_number);
        }

        private static tryToParseNumber(token : string) : number
        {
            var radix_sign = token.match(/^#([box])([\da-fA-F]+)/i), radix = 10;
            if(radix_sign){
                switch(radix_sign[1]){
                case 'b': case 'B':
                    radix = 2;
                    break;

                case 'o': case 'O':
                    radix = 8;
                    break;

                case 'x': case 'X':
                    radix = 16;
                    break;
                }
                var digits = radix_sign[2];

                return parseInt(digits, radix);
            }

            return parseFloat(token);        
        }

        private static checkSymbol(token : string) : bool
        {
            return token.search(/[^a-zA-Z0-9_&\$\*\/%+\-<>=!\?]/) == -1;
        }
    }

    /**
     * Represents Quasi-Quotation
     */
    export module QQ{
        export class Unquote
        {
            constructor(public x) {}

            public toString() : string
            {
                return "," + LL.str(this.x);
            }
        }

        export class UnquoteSplicing
        {
            constructor(public x) {}

            public toString() : string
            {
                return ",@" + LL.str(this.x);
            }
        }

        /**
         * Expands x in a Quasi-Quotation `x to an equivalent S expression
         */
        export function expand(x : any)
        {
            if(x instanceof Cell){
                var t : Cell = QQ.expand1(x);
                if(t.cdr === null){
                    var k = <Cell>t.car;
                    if(k instanceof Cell && (k.car == LL.S_LIST || k.car == LL.S_CONS))
                        return k;
                }

                return new Cell(LL.S_APPEND, t);
            }else if(x instanceof QQ.Unquote){
                return (<Unquote> x).x;
            }else{
                return QQ.quote(x);
            }
        }

        export function quote(x)
        {
            if(x instanceof Symbol || x instanceof Arg || x instanceof Cell)
                return LL.list(LL.S_QUOTE, x);
            else
                return x;
        }

        export function expand1(x)
        {
            if(x instanceof Cell){
                var xc : Cell = <Cell>x;
                var h = QQ.expand2(xc.car);
                var t = QQ.expand1(xc.cdr);

                if(t instanceof Cell){
                    var tc : Cell = <Cell>t;

                    if(tc.car === null && tc.cdr === null){
                        return LL.list(h);
                    }else if(h instanceof Cell){
                        var hc : Cell = <Cell>h;

                        if(hc.car == LL.S_LIST){
                            if(tc.car instanceof Cell){
                                var t_car : Cell = <Cell>tc.car;

                                if(t_car.car == LL.S_LIST){
                                    var hh = QQ.concat(hc, t_car.cdr);
                                    return new Cell(hh, tc.cdr);
                                }
                            }

                            if(hc.cdr instanceof Cell){
                                var hh2 = QQ.consCons((<Cell> hc).cdr, tc.car);
                                return new Cell(hh2, tc.cdr);
                            }
                        }
                    }
                }

                return new Cell(h, t);
            }else if(x instanceof Unquote){
                return LL.list(<Unquote>(x).x);
            }else{
                return LL.list(QQ.quote(x));
            }
        }

        export function concat(x : Cell, y : any)
        {
            if(x === null)
                return y;
            else
                return new Cell(x.car, QQ.concat((<Cell> x).cdr, y));
        }

        export function consCons(x : Cell, y : any)
        {
            if(x === null)
                return y;
            else
                return LL.list(LL.S_CONS, x.car, QQ.consCons((<Cell> x).cdr, y));
        }

        export function expand2(x) : any
        {
            if(x instanceof Unquote)
                return LL.list(LL.S_LIST, (<Unquote> x).x);
            else if(x instanceof UnquoteSplicing)
                return (<UnquoteSplicing> x).x;
            else
                return LL.list(LL.S_LIST, QQ.expand(x));
        }
    }
}