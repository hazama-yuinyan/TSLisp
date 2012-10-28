///<reference path='Interpreter.ts' />


(function(){
    var interp = TSLisp.interp;
    interp.loadNatives();
    document.addEventListener("keyup", function(e : KeyboardEvent){
    	if(e.keyCode == 13) interp.run();
    })
})();
