///<reference path='LispTypes.ts' />
///<reference path='Utils.ts' />
///<reference path='Interfaces.ts' />



module TSLisp
{
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
         * Reads an S Expression.
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
            if(typeof tc == "string"){
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

                //case ''
                }
            }else{
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

                    case '"':
                        return this.getString(this.char_iter);
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
            //if(iter.Current != '"') throw new SyntaxError("")
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

    export class QQ
    {
        public static expand(obj : any){}
    }
}