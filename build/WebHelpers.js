var Common;
(function (Common) {
    var MyHtmlConsole = (function () {
        function MyHtmlConsole() {
            this.buffer = "";
            this.history = [];
            this.cur_history_num = 0;
            this.primary = true;
            this.prompt_callback = null;
            this.console_text = "|";
            this.cursor_pos = 0;
            $(document).bind("keypress", this.onKeyPress);
            $(document).bind("keydown", this.onKeyDown);
            this.console_elem = $("#console");
        }
        MyHtmlConsole.inst = null;
        MyHtmlConsole.ps = "> ";
        MyHtmlConsole.getInstance = function getInstance() {
            if(!MyHtmlConsole.inst) {
                MyHtmlConsole.inst = new MyHtmlConsole();
            }
            return MyHtmlConsole.inst;
        }
        MyHtmlConsole.prototype.printPS = function () {
            if(this.primary) {
                MyHtmlConsole.print(MyHtmlConsole.ps);
            }
        };
        MyHtmlConsole.prototype.reset = function () {
        };
        MyHtmlConsole.prototype.update = function () {
            MyHtmlConsole.print(HtmlConsole.inst.buffer);
        };
        MyHtmlConsole.print = function print(str) {
            var inst = MyHtmlConsole.getInstance();
            inst.console_text = inst.console_text.substring(0, inst.cursor_pos) + str;
            inst.cursor_pos += str.length;
            inst.console_text += "|";
            $(inst.console_elem).text(inst.console_text);
        }
        MyHtmlConsole.println = function println(text) {
            var inst = MyHtmlConsole.getInstance();
            inst.console_text = inst.console_text.substr(0, inst.cursor_pos) + text + "\n";
            inst.cursor_pos = inst.console_text.length;
            inst.console_text += "|";
            $(inst.console_elem).text(inst.console_text);
        }
        MyHtmlConsole.prototype.clearCurrentLine = function () {
            var tmp_cursor_pos = this.cursor_pos;
            var ps = MyHtmlConsole.ps;
            while(true) {
                if(this.console_text.substring(tmp_cursor_pos - ps.length, tmp_cursor_pos) === ps) {
                    break;
                }
                --tmp_cursor_pos;
            }
            this.console_text = this.console_text.substring(0, tmp_cursor_pos) + "|";
            this.cursor_pos = tmp_cursor_pos;
            $(this.console_elem).text(this.console_text);
        };
        MyHtmlConsole.prototype.setPromptCallback = function (callback) {
            this.prompt_callback = callback;
        };
        MyHtmlConsole.prototype.onKeyPress = function (e) {
            switch(e.keyCode) {
                case 13: {
                    this.primary = false;
                    this.buffer += "\n";
                    MyHtmlConsole.print("\n");
                    this.prompt_callback(this.buffer);
                    if(!e.shiftKey) {
                        this.history.push(this.buffer.substring(0, this.buffer.length - 1));
                        this.cur_history_num = this.history.length;
                    }
                    break;

                }
                default: {
                    var chara = String.fromCharCode(e.keyCode);
                    this.buffer = this.buffer.concat(chara);
                    MyHtmlConsole.print(this.buffer.substr(-1));

                }
            }
        };
        MyHtmlConsole.prototype.onKeyDown = function (e) {
            switch(e.keyCode) {
                case 8: {
                    this.buffer = this.buffer.substr(0, this.buffer.length - 1);
                    this.clearCurrentLine();
                    MyHtmlConsole.print(this.buffer);
                    break;

                }
                case 38: {
                    e.preventDefault();
                    --this.cur_history_num;
                    if(this.cur_history_num < 0) {
                        this.cur_history_num = this.history.length - 1;
                    }
                    this.buffer = this.history[this.cur_history_num];
                    this.clearCurrentLine();
                    this.update();
                    break;

                }
                case 40: {
                    e.preventDefault();
                    ++this.cur_history_num;
                    if(this.cur_history_num >= this.history.length) {
                        this.cur_history_num = 0;
                    }
                    this.buffer = this.history[this.cur_history_num];
                    this.clearCurrentLine();
                    this.update();
                    break;

                }
            }
        };
        return MyHtmlConsole;
    })();
    Common.MyHtmlConsole = MyHtmlConsole;    
    var HtmlConsole = (function () {
        function HtmlConsole() { }
        HtmlConsole.console = null;
        HtmlConsole.inst = null;
        HtmlConsole.WELCOME_MSG = "Welcome to the TS Lisp console!\nThis is a version of Lisp interpreter implemented in TypeScript\n\nCall the help function for more info on TSLisp.\n";
        HtmlConsole.use_my_console = false;
        HtmlConsole.initialize = function initialize(use_my_console) {
            if(!HtmlConsole.inst) {
                HtmlConsole.inst = new HtmlConsole();
            }
            HtmlConsole.use_my_console = use_my_console;
            if(!use_my_console) {
                this.console = $("#console").jqconsole(HtmlConsole.WELCOME_MSG, ">>> ", "... ");
                this.console.RegisterMatching('{', '}', "brace");
                this.console.RegisterMatching('[', ']', "brackets");
                this.console.RegisterMatching('(', ')', "paren");
            } else {
                this.console = MyHtmlConsole.getInstance();
                MyHtmlConsole.println(HtmlConsole.WELCOME_MSG);
                this.console.printPS();
            }
        }
        HtmlConsole.getInstance = function getInstance() {
            return HtmlConsole.inst;
        }
        HtmlConsole.print = function print(text, cls) {
            if(!HtmlConsole.use_my_console) {
                this.console.Write(text, cls);
            } else {
                MyHtmlConsole.print(text);
            }
        }
        HtmlConsole.println = function println(text, cls) {
            if(!HtmlConsole.use_my_console) {
                this.console.Write(text + "\n", cls);
            } else {
                MyHtmlConsole.println(text);
            }
        }
        HtmlConsole.prototype.prompt = function (callback, continue_callback) {
            if(HtmlConsole.use_my_console) {
                HtmlConsole.console.printPS();
                HtmlConsole.console.setPromptCallback(callback);
            } else {
                HtmlConsole.console.Prompt(true, callback, continue_callback);
            }
        };
        HtmlConsole.prototype.abortPrompt = function () {
            if(HtmlConsole.use_my_console) {
                throw ErrorFactory.makeError("Not implemented!");
            } else {
                HtmlConsole.console.AbortPrompt();
            }
        };
        HtmlConsole.prototype.input = function (input_callback) {
            if(HtmlConsole.use_my_console) {
                throw ErrorFactory.makeError("Not implemented!");
            } else {
                HtmlConsole.console.Input(input_callback);
            }
        };
        return HtmlConsole;
    })();
    Common.HtmlConsole = HtmlConsole;    
})(Common || (Common = {}));
