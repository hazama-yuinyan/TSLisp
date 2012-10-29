///<reference path='Interpreter.ts' />
///<reference path='Snippets.ts' />


(function(){
    var interp = TSLisp.interp;
    interp.loadNatives();
    //interp.run(TSLisp.Lines.fromString(TSLisp.PRELUDE));
    document.addEventListener("keyup", function(e : KeyboardEvent){
    	if(e.keyCode == 13) interp.run();
    })
})();
