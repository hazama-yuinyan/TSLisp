var Common;
(function (Common) {
    var HtmlConsole = (function () {
        function HtmlConsole() {
            this.buffer = "";
            this.history = [];
            this.cur_history_num = 0;
            this.primary = true;
        }
        HtmlConsole.console_elem = null;
        HtmlConsole.console_text = "|";
        HtmlConsole.cursor_pos = 0;
        HtmlConsole.inst = null;
        HtmlConsole.ps = "> ";
        HtmlConsole.instance = function instance() {
            return HtmlConsole.inst;
        }
        HtmlConsole.initialize = function initialize() {
            if(!HtmlConsole.inst) {
                HtmlConsole.inst = new HtmlConsole();
            }
            $(document).bind("keypress", HtmlConsole.onKeyPress);
            $(document).bind("keydown", HtmlConsole.onKeyDown);
            HtmlConsole.console_elem = $("#console");
        }
        HtmlConsole.prototype.getEnumerator = function () {
            var _this = this;
            var lines = [];
            var cur_pos = -1;

            return new Common.Enumerator(function () {
                if(cur_pos >= lines.length) {
                    cur_pos = -1;
                }
                if(cur_pos < 0 && _this.buffer.search(/\n$/) != -1) {
                    cur_pos = 0;
                    lines = _this.buffer.split(/\n/);
                    lines.pop();
                    _this.buffer = "";
                    return lines[cur_pos++];
                } else {
                    if(cur_pos != -1 && cur_pos < lines.length) {
                        return lines[cur_pos++];
                    } else {
                        _this.primary = true;
                        return undefined;
                    }
                }
            });
        };
        HtmlConsole.prototype.printPS = function () {
            if(this.primary) {
                HtmlConsole.print(HtmlConsole.ps);
            }
        };
        HtmlConsole.prototype.reset = function () {
        };
        HtmlConsole.prototype.update = function () {
            HtmlConsole.print(HtmlConsole.inst.buffer);
        };
        HtmlConsole.print = function print(str) {
            HtmlConsole.console_text = HtmlConsole.console_text.substring(0, HtmlConsole.cursor_pos) + str;
            HtmlConsole.cursor_pos += str.length;
            HtmlConsole.console_text += "|";
            $(HtmlConsole.console_elem).text(HtmlConsole.console_text);
        }
        HtmlConsole.println = function println(text) {
            var console_elem = HtmlConsole.console_elem;
            HtmlConsole.console_text = HtmlConsole.console_text.substr(0, HtmlConsole.cursor_pos) + text + "\n";
            HtmlConsole.cursor_pos = HtmlConsole.console_text.length;
            HtmlConsole.console_text += "|";
            $(HtmlConsole.console_elem).text(HtmlConsole.console_text);
        }
        HtmlConsole.clearCurrentLine = function clearCurrentLine() {
            var tmp_cursor_pos = HtmlConsole.cursor_pos;
            var ps = HtmlConsole.ps;
            while(true) {
                if(HtmlConsole.console_text.substring(tmp_cursor_pos - ps.length, tmp_cursor_pos) === ps) {
                    break;
                }
                --tmp_cursor_pos;
            }
            HtmlConsole.console_text = HtmlConsole.console_text.substring(0, tmp_cursor_pos) + "|";
            HtmlConsole.cursor_pos = tmp_cursor_pos;
            $(HtmlConsole.console_elem).text(HtmlConsole.console_text);
        }
        HtmlConsole.onKeyPress = function onKeyPress(e) {
            switch(e.keyCode) {
                case 13: {
                    HtmlConsole.inst.primary = false;
                    HtmlConsole.inst.buffer += "\n";
                    HtmlConsole.print("\n");
                    if(!e.shiftKey) {
                        HtmlConsole.inst.history.push(HtmlConsole.inst.buffer.substring(0, HtmlConsole.inst.buffer.length - 1));
                        HtmlConsole.inst.cur_history_num = HtmlConsole.inst.history.length;
                    }
                    break;

                }
                default: {
                    var chara = String.fromCharCode(e.keyCode);
                    HtmlConsole.inst.buffer = HtmlConsole.inst.buffer.concat(chara);
                    HtmlConsole.print(HtmlConsole.inst.buffer.substr(-1));

                }
            }
        }
        HtmlConsole.onKeyDown = function onKeyDown(e) {
            switch(e.keyCode) {
                case 8: {
                    HtmlConsole.inst.buffer = HtmlConsole.inst.buffer.substr(0, HtmlConsole.inst.buffer.length - 1);
                    HtmlConsole.clearCurrentLine();
                    HtmlConsole.print(HtmlConsole.inst.buffer);
                    break;

                }
                case 38: {
                    e.preventDefault();
                    --HtmlConsole.inst.cur_history_num;
                    if(HtmlConsole.inst.cur_history_num < 0) {
                        HtmlConsole.inst.cur_history_num = HtmlConsole.inst.history.length - 1;
                    }
                    HtmlConsole.inst.buffer = HtmlConsole.inst.history[HtmlConsole.inst.cur_history_num];
                    HtmlConsole.clearCurrentLine();
                    HtmlConsole.inst.update();
                    break;

                }
                case 40: {
                    e.preventDefault();
                    ++HtmlConsole.inst.cur_history_num;
                    if(HtmlConsole.inst.cur_history_num >= HtmlConsole.inst.history.length) {
                        HtmlConsole.inst.cur_history_num = 0;
                    }
                    HtmlConsole.inst.buffer = HtmlConsole.inst.history[HtmlConsole.inst.cur_history_num];
                    HtmlConsole.clearCurrentLine();
                    HtmlConsole.inst.update();
                    break;

                }
            }
        }
        return HtmlConsole;
    })();
    Common.HtmlConsole = HtmlConsole;    
})(Common || (Common = {}));

