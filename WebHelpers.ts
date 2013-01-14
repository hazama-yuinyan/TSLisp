///<reference path='jquery.d.ts' />
///<reference path='jqconsole.d.ts' />
///<reference path='ErrorFactory.ts' />


interface JQuery
{
    jqconsole(header : string, ps : string, ps2 : string) : JQConsole;
}


module Common{
	/**
	 * Class for emulating the console on the Web
	 */
	export class MyHtmlConsole
	{
		private buffer : string = "";
		private history : string[] = [];
		private cur_history_num : number = 0;
		private primary : bool = true;
        private prompt_callback : (input : string) => void  = null;
		private console_elem : JQuery;
		private console_text : string = "|";
		private cursor_pos : number = 0;
		private static inst : MyHtmlConsole = null;
		private static ps : string = "> ";
        
        constructor()
        {
            $(document).bind("keypress", this.onKeyPress);
    		$(document).bind("keydown", this.onKeyDown);
            this.console_elem = $("#console");
        }

		public static getInstance()
		{
            if(!MyHtmlConsole.inst) MyHtmlConsole.inst = new MyHtmlConsole();
			return MyHtmlConsole.inst;
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

		public printPS()
		{
			if(this.primary)
				MyHtmlConsole.print(MyHtmlConsole.ps);
		}

		public reset()
		{
			//this.primary = true;
		}

		public update()
		{
			MyHtmlConsole.print(HtmlConsole.inst.buffer);
		}

		public static print(str : string)
		{
            var inst = MyHtmlConsole.getInstance();
			inst.console_text = inst.console_text.substring(0, inst.cursor_pos) + str;
			inst.cursor_pos += str.length;
			inst.console_text += "|";
			$(inst.console_elem).text(inst.console_text);
		}

		public static println(text : string)
		{
            var inst = MyHtmlConsole.getInstance();
			inst.console_text = inst.console_text.substr(0, inst.cursor_pos) + text + "\n";

			inst.cursor_pos = inst.console_text.length;
			inst.console_text += "|";
			$(inst.console_elem).text(inst.console_text);
		}

		public clearCurrentLine()
		{
			var tmp_cursor_pos = this.cursor_pos;
			var ps = MyHtmlConsole.ps;
			while(true){
				if(this.console_text.substring(tmp_cursor_pos - ps.length, tmp_cursor_pos) === ps) break;
				
				--tmp_cursor_pos;
			}
			this.console_text = this.console_text.substring(0, tmp_cursor_pos) + "|";
			this.cursor_pos = tmp_cursor_pos;
			$(this.console_elem).text(this.console_text);
		}
        
        public setPromptCallback(callback)
        {
            this.prompt_callback = callback;
        }

		private onKeyPress(e : KeyboardEvent)
		{
			switch(e.keyCode){
			case 13:	//The return key
				this.primary = false;
				this.buffer += "\n";
				MyHtmlConsole.print("\n");
                this.prompt_callback(this.buffer);

				if(!e.shiftKey){
					this.history.push(this.buffer.substring(0, this.buffer.length - 1));
					this.cur_history_num = this.history.length;
				}
				break;

			default:
				var chara = String.fromCharCode(e.keyCode);
				this.buffer = this.buffer.concat(chara);
				MyHtmlConsole.print(this.buffer.substr(-1));
			}
		}

		private onKeyDown(e : KeyboardEvent)
		{
			switch(e.keyCode){
			case 8:		//The Backspace key
				this.buffer = this.buffer.substr(0, this.buffer.length - 1);
				this.clearCurrentLine();
				MyHtmlConsole.print(this.buffer);
				break;
				
			case 38:	//The up arrow key
				e.preventDefault();
				--this.cur_history_num;
				if(this.cur_history_num < 0) this.cur_history_num = this.history.length - 1;
				this.buffer = this.history[this.cur_history_num];
				this.clearCurrentLine();
				this.update();
				break;

			case 40:	//The down arrow key
				e.preventDefault();
				++this.cur_history_num;
				if(this.cur_history_num >= this.history.length) this.cur_history_num = 0;
				this.buffer = this.history[this.cur_history_num];
				this.clearCurrentLine();
				this.update();
				break;
			}
		}
	}
    
    export class HtmlConsole
    {
        private static console : any = null;
        private static inst = null;
        private static WELCOME_MSG : string = "Welcome to the TS Lisp console!\nThis is a version of Lisp interpreter implemented in TypeScript\n\nCall the help function for more info on TSLisp.\n";
        private static use_my_console = false;
        
        public static initialize(use_my_console : bool)
        {
            if(!HtmlConsole.inst) HtmlConsole.inst = new HtmlConsole();
            HtmlConsole.use_my_console = use_my_console;
            if(!use_my_console){
                this.console = $("#console").jqconsole(HtmlConsole.WELCOME_MSG, ">>> ", "... ");
                this.console.RegisterMatching('{', '}', "brace");
                this.console.RegisterMatching('[', ']', "brackets");
                this.console.RegisterMatching('(', ')', "paren");
            }else{
                this.console = MyHtmlConsole.getInstance();
                MyHtmlConsole.println(HtmlConsole.WELCOME_MSG);
                this.console.printPS();
            }
        }
        
        public static getInstance() : HtmlConsole
        {
            return inst;
        }
        
        public static print(text : string, cls? : string) : void
        {
            if(!HtmlConsole.use_my_console)
                this.console.Write(text, cls);
            else
                MyHtmlConsole.print(text);
        }
        
        public static println(text : string, cls? : string) : void
        {
            if(!HtmlConsole.use_my_console)
                this.console.Write(text + "\n", cls);
            else
                MyHtmlConsole.println(text);
        }
        
        public prompt(callback : (input) => void, continue_callback? : (input) => any) : void
        {
            if(HtmlConsole.use_my_console){
                HtmlConsole.console.printPS();
                HtmlConsole.console.setPromptCallback(callback);
            }else{
                HtmlConsole.console.Prompt(true, callback, continue_callback);
            }
        }
        
        public abortPrompt() : void
        {
            if(HtmlConsole.use_my_console)
                throw ErrorFactory.makeError("Not implemented!");
            else
                HtmlConsole.console.AbortPrompt();
        }
        
        public input(input_callback : (input) => void) : void
        {
            if(HtmlConsole.use_my_console)
                throw ErrorFactory.makeError("Not implemented!");
            else
                HtmlConsole.console.Input(input_callback);
        }
    }
}