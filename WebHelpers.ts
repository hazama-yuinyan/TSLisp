///<reference path='jquery.d.ts' />
///<reference path='jqconsole.d.ts' />
///<reference path='Utils.ts' />
///<reference path='ErrorFactory.ts' />


interface JQuery
{
    jqconsole(header : string, ps : string, ps2 : string) : JQConsole;
}


module Common{
	/**
	 * Module for emulating the console on the Web
	 */
	export module MyHtmlConsole{
		var buffer : string = "";
		var history : string[] = [];
		var cur_history_num : number = 0;
		var primary : bool = true;
        var prompt_callback : (input : string) => void  = null;
		var console_elem : JQuery;
		var console_text : string = "|";
		var cursor_pos : number = 0;
		var ps : string = "> ";
        
        export function initialize()
        {
            $(document).bind("keypress", onKeyPress);
    		$(document).bind("keydown", onKeyDown);
            console_elem = $("#console");
        }

		/*public getEnumerator() : Enumerator
		{
			var lines = [], cur_pos = -1;
			return new Enumerator(() => {
				if(cur_pos >= lines.length) cur_pos = -1;

				if(cur_pos < 0 && this.buffer.search(/\n$/) != -1){
					cur_pos = 0;
					lines = this.buffer.split(/\n/);
					lines.pop();
					this.buffer = "";
					return lines[cur_pos++];
				}else if(cur_pos != -1 && cur_pos < lines.length){
					return lines[cur_pos++];
				}else{
					this.primary = true;
					return undefined;
				}
			});
		}*/

		export function printPS()
		{
			if(primary)
				print(ps);
		}

		export function reset()
		{
			//primary = true;
		}

		function update()
		{
			print(buffer);
		}

		export function print(str : string)
		{
			console_text = console_text.substring(0, cursor_pos) + str;
			cursor_pos += str.length;
			console_text += "|";
			$(console_elem).text(console_text);
		}

		export function println(text : string)
		{
			console_text = console_text.substr(0, cursor_pos) + text + "\n";

			cursor_pos = console_text.length;
			console_text += "|";
			$(console_elem).text(console_text);
		}

		export function clearCurrentLine()
		{
			var tmp_cursor_pos = cursor_pos;
			while(true){
				if(console_text.substring(tmp_cursor_pos - ps.length, tmp_cursor_pos) === ps) break;
				
				--tmp_cursor_pos;
			}
			console_text = console_text.substring(0, tmp_cursor_pos) + "|";
			cursor_pos = tmp_cursor_pos;
			$(console_elem).text(console_text);
		}
        
        export function setPromptCallback(callback)
        {
            prompt_callback = callback;
        }

		function onKeyPress(e : KeyboardEvent)
		{
			switch(e.keyCode){
			case 13:	//The return key
				primary = false;
				buffer += "\n";
				print("\n");
                prompt_callback(buffer);

				if(!e.shiftKey){
					history.push(buffer.substring(0, buffer.length - 1));
					cur_history_num = history.length;
				}
				break;

			default:
				var chara = String.fromCharCode(e.keyCode);
				buffer = buffer.concat(chara);
				print(buffer.substr(-1));
			}
		}

		function onKeyDown(e : KeyboardEvent)
		{
			switch(e.keyCode){
			case 8:		//The Backspace key
				buffer = buffer.substr(0, buffer.length - 1);
				clearCurrentLine();
				print(buffer);
				break;
				
			case 38:	//The up arrow key
				e.preventDefault();
				--cur_history_num;
				if(cur_history_num < 0) cur_history_num = history.length - 1;
				buffer = history[cur_history_num];
				clearCurrentLine();
				update();
				break;

			case 40:	//The down arrow key
				e.preventDefault();
				++cur_history_num;
				if(cur_history_num >= history.length) cur_history_num = 0;
				buffer = history[cur_history_num];
				clearCurrentLine();
				update();
				break;
			}
		}
	}
    
    export module HtmlConsole{
        var console : any = null;
        var use_my_console = false;
        
        export function initialize(_use_my_console : bool, header_msg : string)
        {
            use_my_console = _use_my_console;
            if(!use_my_console){
                console = $("#console").jqconsole(header_msg, ">>> ", "... ");
                console.RegisterMatching('(', ')', "paren");
            }else{
                console = MyHtmlConsole;
                console.println(header_msg);
                console.printPS();
            }
        }
        
        export function print(text : string, cls? : string) : void
        {
            if(!use_my_console)
                console.Write(text, cls);
            else
                console.print(text);
        }
        
        export function println(text : string, cls? : string) : void
        {
            if(!use_my_console)
                console.Write(text + "\n", cls);
            else
                console.println(text);
        }
        
        export function printFormatted(format : string, values? : Object, cls? : string) : void
        {
            var formatted = Utils.substituteTemplate(format, values);
            println(formatted, cls);
        }
        
        export function prompt(callback : (input) => void, continue_callback? : (input) => any) : void
        {
            if(use_my_console){
                console.printPS();
                console.setPromptCallback(callback);
            }else{
                console.Prompt(true, callback, continue_callback);
            }
        }
        
        export function abortPrompt() : void
        {
            if(use_my_console)
                throw ErrorFactory.makeError("Not implemented!");
            else
                console.AbortPrompt();
        }
        
        export function input(input_callback : (input) => void) : void
        {
            if(use_my_console)
                throw ErrorFactory.makeError("Not implemented!");
            else
                console.Input(input_callback);
        }
    }
}