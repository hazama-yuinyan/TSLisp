var Common;
(function (Common) {
    var HtmlConsole = (function () {
        function HtmlConsole() {
            this.buffer = "";
            this.histrory = [];
            this.cur_history_num = 0;
            this.primary = true;
        }
        HtmlConsole.console_elem = null;
        HtmlConsole.cursor = null;
        HtmlConsole.inst = null;
        HtmlConsole.instance = function instance() {
            return HtmlConsole.inst;
        }
        HtmlConsole.initialize = function initialize() {
            if(!HtmlConsole.inst) {
                HtmlConsole.inst = new HtmlConsole();
            }
            document.addEventListener("keypress", HtmlConsole.onKeyPress);
            document.addEventListener("keyup", HtmlConsole.onKeyUp);
            HtmlConsole.console_elem = document.getElementById("console");
            HtmlConsole.cursor = document.getElementsByClassName("cursor")[0];
        }
        HtmlConsole.prototype.getEnumerator = function () {
            var _this = this;
            return new Common.Enumerator(function () {
                if(_this.buffer.search(/\n$/) != -1) {
                    var tmp = _this.buffer;
                    _this.buffer = "";
                    return tmp;
                } else {
                    return undefined;
                }
            });
        };
        HtmlConsole.prototype.reset = function () {
            this.primary = true;
        };
        HtmlConsole.prototype.update = function () {
            HtmlConsole.print(HtmlConsole.inst.buffer);
        };
        HtmlConsole.print = function print(str) {
            HtmlConsole.console_elem.insertBefore(document.createTextNode(str), HtmlConsole.cursor);
        }
        HtmlConsole.println = function println(str) {
            var lines = str.split(/\n/);
            lines.forEach(function (line) {
                HtmlConsole.console_elem.insertBefore(document.createTextNode(line), HtmlConsole.cursor);
                HtmlConsole.console_elem.insertBefore(document.createElement("br"), HtmlConsole.cursor);
            });
            if(HtmlConsole.inst.primary) {
                HtmlConsole.console_elem.insertBefore(document.createTextNode("> "), HtmlConsole.cursor);
            }
        }
        HtmlConsole.clearLastDisplayedHistory = function clearLastDisplayedHistory() {
            var last_line = HtmlConsole.cursor.previousSibling;
            HtmlConsole.console_elem.removeChild(last_line);
        }
        HtmlConsole.onKeyPress = function onKeyPress(e) {
            switch(e.keyCode) {
                case 13: {
                    HtmlConsole.inst.buffer = HtmlConsole.inst.buffer.concat("\n");
                    HtmlConsole.inst.histrory.push(HtmlConsole.inst.buffer);
                    HtmlConsole.console_elem.insertBefore(document.createElement("br"), HtmlConsole.cursor);
                    HtmlConsole.inst.cur_history_num = HtmlConsole.inst.histrory.length;
                    HtmlConsole.inst.primary = false;
                    break;

                }
                default: {
                    var chara = String.fromCharCode(e.keyCode);
                    HtmlConsole.inst.buffer = HtmlConsole.inst.buffer.concat(chara);
                    HtmlConsole.print(HtmlConsole.inst.buffer.substr(-1));

                }
            }
        }
        HtmlConsole.onKeyUp = function onKeyUp(e) {
            switch(e.keyCode) {
                case 8: {
                    if(HtmlConsole.cursor.previousSibling.nodeType == 3) {
                        HtmlConsole.inst.buffer = HtmlConsole.inst.buffer.substr(0, HtmlConsole.inst.buffer.length - 1);
                        HtmlConsole.console_elem.removeChild(HtmlConsole.cursor.previousSibling);
                    }
                    break;

                }
                case 38: {
                    --HtmlConsole.inst.cur_history_num;
                    if(HtmlConsole.inst.cur_history_num < 0) {
                        HtmlConsole.inst.cur_history_num = HtmlConsole.inst.histrory.length - 1;
                    }
                    HtmlConsole.inst.buffer = HtmlConsole.inst.histrory[HtmlConsole.inst.cur_history_num];
                    HtmlConsole.clearLastDisplayedHistory();
                    HtmlConsole.inst.update();
                    break;

                }
                case 40: {
                    ++HtmlConsole.inst.cur_history_num;
                    if(HtmlConsole.inst.cur_history_num >= HtmlConsole.inst.histrory.length) {
                        HtmlConsole.inst.cur_history_num = 0;
                    }
                    HtmlConsole.inst.buffer = HtmlConsole.inst.histrory[HtmlConsole.inst.cur_history_num];
                    HtmlConsole.clearLastDisplayedHistory();
                    HtmlConsole.inst.update();
                    break;

                }
            }
        }
        return HtmlConsole;
    })();
    Common.HtmlConsole = HtmlConsole;    
})(Common || (Common = {}));

