(function () {
    var interp = new TSLisp.Interpreter();
    document.addEventListener("keyup", function (e) {
        if(e.keyCode == 13) {
            interp.run();
        }
    });
})();
