(function () {
    var interp = TSLisp.interp;
    interp.loadNatives();
    document.addEventListener("keyup", function (e) {
        if(e.keyCode == 13) {
            interp.run();
        }
    });
})();
