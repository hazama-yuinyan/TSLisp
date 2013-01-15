var Common;
(function (Common) {
    (function (MyHtmlConsole) {
        var buffer = "";
        var history = [];
        var cur_history_num = 0;
        var primary = true;
        var prompt_callback = null;
        var console_elem;
        var console_text = "|";
        var cursor_pos = 0;
        var ps = "> ";
        function initialize() {
            $(document).bind("keypress", onKeyPress);
            $(document).bind("keydown", onKeyDown);
            console_elem = $("#console");
        }
        MyHtmlConsole.initialize = initialize;
        function printPS() {
            if(primary) {
                print(ps);
            }
        }
        MyHtmlConsole.printPS = printPS;
        function reset() {
        }
        MyHtmlConsole.reset = reset;
        function update() {
            print(buffer);
        }
        function print(str) {
            console_text = console_text.substring(0, cursor_pos) + str;
            cursor_pos += str.length;
            console_text += "|";
            $(console_elem).text(console_text);
        }
        MyHtmlConsole.print = print;
        function println(text) {
            console_text = console_text.substr(0, cursor_pos) + text + "\n";
            cursor_pos = console_text.length;
            console_text += "|";
            $(console_elem).text(console_text);
        }
        MyHtmlConsole.println = println;
        function clearCurrentLine() {
            var tmp_cursor_pos = cursor_pos;
            while(true) {
                if(console_text.substring(tmp_cursor_pos - ps.length, tmp_cursor_pos) === ps) {
                    break;
                }
                --tmp_cursor_pos;
            }
            console_text = console_text.substring(0, tmp_cursor_pos) + "|";
            cursor_pos = tmp_cursor_pos;
            $(console_elem).text(console_text);
        }
        MyHtmlConsole.clearCurrentLine = clearCurrentLine;
        function setPromptCallback(callback) {
            prompt_callback = callback;
        }
        MyHtmlConsole.setPromptCallback = setPromptCallback;
        function onKeyPress(e) {
            switch(e.keyCode) {
                case 13: {
                    primary = false;
                    buffer += "\n";
                    print("\n");
                    prompt_callback(buffer);
                    if(!e.shiftKey) {
                        history.push(buffer.substring(0, buffer.length - 1));
                        cur_history_num = history.length;
                    }
                    break;

                }
                default: {
                    var chara = String.fromCharCode(e.keyCode);
                    buffer = buffer.concat(chara);
                    print(buffer.substr(-1));

                }
            }
        }
        function onKeyDown(e) {
            switch(e.keyCode) {
                case 8: {
                    buffer = buffer.substr(0, buffer.length - 1);
                    clearCurrentLine();
                    print(buffer);
                    break;

                }
                case 38: {
                    e.preventDefault();
                    --cur_history_num;
                    if(cur_history_num < 0) {
                        cur_history_num = history.length - 1;
                    }
                    buffer = history[cur_history_num];
                    clearCurrentLine();
                    update();
                    break;

                }
                case 40: {
                    e.preventDefault();
                    ++cur_history_num;
                    if(cur_history_num >= history.length) {
                        cur_history_num = 0;
                    }
                    buffer = history[cur_history_num];
                    clearCurrentLine();
                    update();
                    break;

                }
            }
        }
    })(Common.MyHtmlConsole || (Common.MyHtmlConsole = {}));
    var MyHtmlConsole = Common.MyHtmlConsole;
    (function (HtmlConsole) {
        var console = null;
        var WELCOME_MSG = "Welcome to the TS Lisp console!\nThis is a version of Lisp interpreter implemented in TypeScript\n\nCall the help function for more info on TSLisp.\n";
        var use_my_console = false;
        function initialize(_use_my_console) {
            use_my_console = _use_my_console;
            if(!use_my_console) {
                console = $("#console").jqconsole(WELCOME_MSG, ">>> ", "... ");
                console.RegisterMatching('{', '}', "brace");
                console.RegisterMatching('[', ']', "brackets");
                console.RegisterMatching('(', ')', "paren");
            } else {
                console = MyHtmlConsole;
                console.println(WELCOME_MSG);
                console.printPS();
            }
        }
        HtmlConsole.initialize = initialize;
        function print(text, cls) {
            if(!use_my_console) {
                console.Write(text, cls);
            } else {
                console.print(text);
            }
        }
        HtmlConsole.print = print;
        function println(text, cls) {
            if(!use_my_console) {
                console.Write(text + "\n", cls);
            } else {
                console.println(text);
            }
        }
        HtmlConsole.println = println;
        function prompt(callback, continue_callback) {
            if(use_my_console) {
                console.printPS();
                console.setPromptCallback(callback);
            } else {
                console.Prompt(true, callback, continue_callback);
            }
        }
        HtmlConsole.prompt = prompt;
        function abortPrompt() {
            if(use_my_console) {
                throw ErrorFactory.makeError("Not implemented!");
            } else {
                console.AbortPrompt();
            }
        }
        HtmlConsole.abortPrompt = abortPrompt;
        function input(input_callback) {
            if(use_my_console) {
                throw ErrorFactory.makeError("Not implemented!");
            } else {
                console.Input(input_callback);
            }
        }
        HtmlConsole.input = input;
    })(Common.HtmlConsole || (Common.HtmlConsole = {}));
    var HtmlConsole = Common.HtmlConsole;
})(Common || (Common = {}));
