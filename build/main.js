(function () {
    var interp = TSLisp.interp;
    interp.loadNatives();
    interp.run(TSLisp.Lines.fromString(TSLisp.PRELUDE));
    document.addEventListener("keyup", function (e) {
        if(e.keyCode == 13) {
            interp.run();
        }
    });
})();
