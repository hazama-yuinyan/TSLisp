var TSLisp;
(function (TSLisp) {
    (function (Test) {
        (function (Util) {
            function cons(car, cdr) {
                return new TSLisp.Cell(car, cdr);
            }
            Util.cons = cons;
        })(Test.Util || (Test.Util = {}));
        var Util = Test.Util;
    })(TSLisp.Test || (TSLisp.Test = {}));
    var Test = TSLisp.Test;
})(TSLisp || (TSLisp = {}));
