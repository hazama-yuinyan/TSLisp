///<reference path='Interpreter.ts' />


(function(){
    var interp = new TSLisp.Interpreter();
    document.addEventListener("keyup", function(e : KeyboardEvent){
    	if(e.keyCode == 13) interp.run();
    })
})();
