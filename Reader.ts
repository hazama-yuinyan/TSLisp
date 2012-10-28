///<reference path='LispTypes.ts' />
///<reference path='Utils.ts' />
///<reference path='Common.ts' />



module TSLisp
{
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
                if(tc instanceof SyntaxError) throw tc;

                return tc;
            }else{
                throw new SyntaxError("Unexpected EOF");
            }
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
            /*if(this.last_error){ //If we saw an error at last time, then skip to the next line
                /*var line = this.lexer.CurLine;
                while(this.lexer.CurLine == line) this.lexer.next();
                this.last_error = false;
            }else{
            }*/
            if(this.has_current)
                this.moveNext();

            if(this.has_current){
                try{
                    return this.parseExpression();
                }
                catch(ex){
                    this.last_error = true;
                    throw new EvalException("SyntaxError : " + ex.message + /*" -- " + this.lexer.CurLine +*/ " : " + this.lexer.Line);
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
                throw new SyntaxError("Unexpected " + tc);

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
                        throw new SyntaxError("Expected ')' but found " + this.Current);

                    return new Cell(e1, e2);
                }else{
                    var tail = this.parseListBody();
                    return new Cell(e1, tail);
                }
            }
        }
    }

    /**
     * The Lisp lexer. It recognizies tokens in Lisp and returns them one by one.
     */
    export class Lexer implements Common.IEnumerable
    {
        private cur_line : number = 0;
        private line : string = "";
        private is_eof : bool = false;
        private console_obj;
        private raw_input : Common.Enumerator;
        private char_iter : Common.Enumerator;
        private state = "eager";
        private static EOF = LL.S_EOF;

        //public get CurLine(){return this.cur_line;}

        public get Line() {return this.line;}
        
        constructor(input : Common.IEnumerable)
        {
            this.console_obj = input;
            this.raw_input = input.getEnumerator();
        }
        
        /**
         * Resets the Lexer's state.
         */
    	public reset()
    	{
    		this.state = "eager";
            if(this.console_obj.reset) this.console_obj.reset();
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
                            if(this.line.length > cur_pos){
                                return this.line[cur_pos++];
                            }
                        });
                        ch.moveNext();
                    }else{
                        this.is_eof = true;
                    }
                }else{
                    if(this.state != "parsing_list")
                        ch.moveNext();
                    else
                        this.state = "full";
                }

                while(true){
                    while(!this.is_eof && Utils.isWhitespace(ch.Current)) ch.moveNext();  //skip whitespace characters
                    if(this.is_eof) break;

                    var cc = ch.Current;
                    if(!cc) return Lexer.EOF;

                    switch(cc){
                    case ';':
                        while(ch.moveNext() && ch.Current != '\n') ;
                        if(this.is_eof) return;
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
                            this.state = "parsing_list";
                            return ',';
                        }
                        break;

                    case '"':
                        return this.getString(ch);
                        break;

                    default:
                        this.state = "parsing_list";
                        var token = "";
                        while(true){
                            token += cc;
                            if(!ch.moveNext()) break;

                            cc = ch.Current;
                            if(cc == '(' || cc == ')' || cc == '\'' || cc == '~' || Utils.isWhitespace(cc)) break;
                        }

                        if(token == "nil"){
                            return null;
                        }else{
                            var nv = Lexer.tryToParseNumber(token);
                            if(isNaN(nv)){
                                if(Lexer.checkSymbol(token))
                                    return Symbol.symbolOf(token);
                                else
                                    return new SyntaxError("Bad token: " + LL.str(token));
                            }else{
                                return nv;
                            }
                        }
                        continue;
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
                    return new SyntaxError("Matching '\"' not found in " + LL.str(result));

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
                        return new SyntaxError("Bad escape: " + ch.Current);
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
            var radix_sign = token.match(/^[box]/i), radix = 10;
            if(radix_sign){
                switch(radix_sign[0]){
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

                return parseInt(token, radix);
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
    export module QQ
    {
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
                if(t.Cdr == null){
                    var k = <Cell>t.Car;
                    if(k instanceof Cell && k.Car == LL.S_LIST || k.Car == LL.S_CONS)
                        return k;
                }

                return new Cell(LL.S_APPEND, t);
            }else if(x instanceof QQ.Unquote)
                return <Unquote>(x).x;
            else
                return QQ.quote(x);
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
                var h = QQ.expand2(xc.Car);
                var t = QQ.expand1(xc.Cdr);

                if(t instanceof Cell){
                    var tc : Cell = <Cell>t;

                    if(tc.Car == null && tc.Cdr == null)
                        return LL.list(h);
                    else if(h instanceof Cell){
                        var hc : Cell = <Cell>h;

                        if(hc.Car == LL.S_LIST){
                            if(tc.Car instanceof Cell){
                                var t_car : Cell = <Cell>tc.Car;

                                if(t_car.Car == LL.S_LIST){
                                    var hh = QQ.concat(hc, t_car.Cdr);
                                    return new Cell(hh, tc.Cdr);
                                }
                            }

                            if(hc.Cdr instanceof Cell){
                                var hh2 = QQ.consCons(<Cell>hc.Cdr, tc.Car);
                                return new Cell(hh2, tc.Cdr);
                            }
                        }
                    }
                }

                return new Cell(h, t);
            }else if(x instanceof Unquote)
                return LL.list(<Unquote>(x).x);
            else
                return LL.list(QQ.quote(x));
        }

        export function concat(x : Cell, y : any)
        {
            if(x == null)
                return y;
            else
                return new Cell(x.Car, QQ.concat(<Cell>x.Cdr, y));
        }

        export function consCons(x : Cell, y : any)
        {
            if(x == null)
                return y;
            else
                return LL.list(LL.S_CONS, x.Car, QQ.consCons(<Cell>x.Cdr, y));
        }

        export function expand2(x) : any
        {
            if(x instanceof Unquote)
                return LL.list(LL.S_LIST, <Unquote>(x).x);
            else if(x instanceof UnquoteSplicing)
                return <UnquoteSplicing>(x).x;
            else
                return LL.list(LL.S_LIST, QQ.expand(x));
        }
    }
}