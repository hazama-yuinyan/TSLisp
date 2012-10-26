

module Common{
	/**
	 * Class for emulating the console on the Web
	 */
	export class HtmlConsole implements IEnumerable
	{
		private buffer : string = "";
		private histrory : string[] = [];
		private cur_history_num : number = 0;
		private primary : bool = true;
		private static console_elem : HTMLDivElement;
		private static cursor : HTMLSpanElement;
		private static inst : HtmlConsole = null;

		public static instance()
		{
			return HtmlConsole.inst;
		}

		public static initialize()
		{
			if(!inst) inst = new HtmlConsole();
			document.addEventListener("keypress", HtmlConsole.onKeyPress);
			document.addEventListener("keyup", HtmlConsole.onKeyUp);
			HtmlConsole.console_elem = <HTMLDivElement>document.getElementById("console");
			HtmlConsole.cursor = <HTMLSpanElement>document.getElementsByClassName("cursor")[0];
		}

		public getEnumerator() : Enumerator
		{
			return new Enumerator(() => {
				if(this.buffer.search(/\n$/) != -1){
					var tmp = this.buffer;
					this.buffer = "";
					return tmp;
				}else{
					return null;
				}
			});
		}

		public reset()
		{
			this.primary = true;
		}

		public update()
		{
			HtmlConsole.print(HtmlConsole.inst.buffer);
		}

		public static print(str : string)
		{
			HtmlConsole.console_elem.insertBefore(document.createTextNode(str), HtmlConsole.cursor);
		}

		public static println(str : string)
		{
			var lines = str.split(/\n/);
			lines.forEach(function(line){
				HtmlConsole.console_elem.insertBefore(document.createTextNode(line), HtmlConsole.cursor);
				HtmlConsole.console_elem.insertBefore(document.createElement("br"), HtmlConsole.cursor);
			});

			if(HtmlConsole.inst.primary)
				HtmlConsole.console_elem.insertBefore(document.createTextNode("> "), HtmlConsole.cursor);
		}

		private static onKeyPress(e : KeyboardEvent)
		{
			switch(e.keyCode){
			case 13:	//The return key
				HtmlConsole.inst.buffer = HtmlConsole.inst.buffer.concat("\n");
				HtmlConsole.inst.histrory.push(HtmlConsole.inst.buffer);
				HtmlConsole.console_elem.insertBefore(document.createElement("br"), HtmlConsole.cursor);
				HtmlConsole.inst.primary = false;
				break;

			default:
				var chara = String.fromCharCode(e.keyCode);
				HtmlConsole.inst.buffer = HtmlConsole.inst.buffer.concat(chara);
				HtmlConsole.print(HtmlConsole.inst.buffer.substr(-1));
			}
		}

		private static onKeyUp(e : KeyboardEvent)
		{
			switch(e.keyCode){
			case 8:		//The Backspace key
				if(HtmlConsole.cursor.previousSibling.nodeType == 3){
					HtmlConsole.inst.buffer = HtmlConsole.inst.buffer.substr(0, HtmlConsole.inst.buffer.length - 1);
					HtmlConsole.console_elem.removeChild(HtmlConsole.cursor.previousSibling);
				}
				break;
				
			case 38:	//The up arrow key
				--HtmlConsole.inst.cur_history_num;
				if(HtmlConsole.inst.cur_history_num < 0) HtmlConsole.inst.cur_history_num = HtmlConsole.inst.histrory.length - 1;
				HtmlConsole.inst.buffer = HtmlConsole.inst.histrory[HtmlConsole.inst.cur_history_num];
				HtmlConsole.inst.update();
				break;

			case 40:	//The down arrow key
				++HtmlConsole.inst.cur_history_num;
				if(HtmlConsole.inst.cur_history_num >= HtmlConsole.inst.histrory.length) HtmlConsole.inst.cur_history_num = 0;
				HtmlConsole.inst.buffer = HtmlConsole.inst.histrory[HtmlConsole.inst.cur_history_num];
				HtmlConsole.inst.update();
				break;
			}
		}
	}
}