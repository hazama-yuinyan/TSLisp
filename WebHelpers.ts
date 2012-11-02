///<reference path='jquery.d.ts' />



module Common{
	/**
	 * Class for emulating the console on the Web
	 */
	export class HtmlConsole implements IEnumerable
	{
		private buffer : string = "";
		private history : string[] = [];
		private cur_history_num : number = 0;
		private primary : bool = true;
		private static console_elem : JQuery;
		private static console_text : string = "|";
		private static cursor_pos : number = 0;
		private static inst : HtmlConsole = null;
		private static ps = "> ";

		public static instance()
		{
			return HtmlConsole.inst;
		}

		public static initialize()
		{
			if(!inst) inst = new HtmlConsole();
			$(document).bind("keypress", HtmlConsole.onKeyPress);
			$(document).bind("keydown", HtmlConsole.onKeyDown);
			HtmlConsole.console_elem = $("#console");
		}

		public getEnumerator() : Enumerator
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
		}

		public printPS()
		{
			if(this.primary)
				HtmlConsole.print(HtmlConsole.ps);
		}

		public reset()
		{
			//this.primary = true;
		}

		public update()
		{
			HtmlConsole.print(HtmlConsole.inst.buffer);
		}

		public static print(str : string)
		{
			HtmlConsole.console_text = HtmlConsole.console_text.substring(0, HtmlConsole.cursor_pos) + str;
			HtmlConsole.cursor_pos += str.length;
			HtmlConsole.console_text += "|";
			$(HtmlConsole.console_elem).text(HtmlConsole.console_text);
		}

		public static println(text : string)
		{
			var console_elem = HtmlConsole.console_elem;
			HtmlConsole.console_text = HtmlConsole.console_text.substr(0, HtmlConsole.cursor_pos) + text + "\n";

			HtmlConsole.cursor_pos = HtmlConsole.console_text.length;
			HtmlConsole.console_text += "|";
			$(HtmlConsole.console_elem).text(HtmlConsole.console_text);
		}

		public static clearCurrentLine()
		{
			var tmp_cursor_pos = HtmlConsole.cursor_pos;
			var ps = HtmlConsole.ps;
			while(true){
				if(HtmlConsole.console_text.substring(tmp_cursor_pos - ps.length, tmp_cursor_pos) === ps) break;
				
				--tmp_cursor_pos;
			}
			HtmlConsole.console_text = HtmlConsole.console_text.substring(0, tmp_cursor_pos) + "|";
			HtmlConsole.cursor_pos = tmp_cursor_pos;
			$(HtmlConsole.console_elem).text(HtmlConsole.console_text);
		}

		private static onKeyPress(e : KeyboardEvent)
		{
			switch(e.keyCode){
			case 13:	//The return key
				HtmlConsole.inst.primary = false;
				HtmlConsole.inst.buffer += "\n";
				HtmlConsole.print("\n");

				if(!e.shiftKey){
					HtmlConsole.inst.history.push(HtmlConsole.inst.buffer.substring(0, HtmlConsole.inst.buffer.length - 1));
					HtmlConsole.inst.cur_history_num = HtmlConsole.inst.history.length;
				}
				break;

			default:
				var chara = String.fromCharCode(e.keyCode);
				HtmlConsole.inst.buffer = HtmlConsole.inst.buffer.concat(chara);
				HtmlConsole.print(HtmlConsole.inst.buffer.substr(-1));
			}
		}

		private static onKeyDown(e : KeyboardEvent)
		{
			switch(e.keyCode){
			case 8:		//The Backspace key
				HtmlConsole.inst.buffer = HtmlConsole.inst.buffer.substr(0, HtmlConsole.inst.buffer.length - 1);
				HtmlConsole.clearCurrentLine();
				HtmlConsole.print(HtmlConsole.inst.buffer);
				break;
				
			case 38:	//The up arrow key
				e.preventDefault();
				--HtmlConsole.inst.cur_history_num;
				if(HtmlConsole.inst.cur_history_num < 0) HtmlConsole.inst.cur_history_num = HtmlConsole.inst.history.length - 1;
				HtmlConsole.inst.buffer = HtmlConsole.inst.history[HtmlConsole.inst.cur_history_num];
				HtmlConsole.clearCurrentLine();
				HtmlConsole.inst.update();
				break;

			case 40:	//The down arrow key
				e.preventDefault();
				++HtmlConsole.inst.cur_history_num;
				if(HtmlConsole.inst.cur_history_num >= HtmlConsole.inst.history.length) HtmlConsole.inst.cur_history_num = 0;
				HtmlConsole.inst.buffer = HtmlConsole.inst.history[HtmlConsole.inst.cur_history_num];
				HtmlConsole.clearCurrentLine();
				HtmlConsole.inst.update();
				break;
			}
		}
	}
}