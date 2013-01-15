var TSLisp;
(function (TSLisp) {
    (function (Test) {
        var body_special_forms_eval = "(quote x)\n" + "(progn 1 2 3 4 x y z)\n" + "(cond t 1 0)\n" + "(setq :a 1)\n" + "((lambda (a) (+ a 1)) z)\n" + "((lambda (x) (+ :a x)) b)\n" + "((macro (a) (+ a b)) 10)\n" + "((macro (a b) (+ a b)) 10 20)\n" + "(delay x)";
        var body_special_forms_error = "((macro (a) (macro (x) (+ a x))) 10)\n";
        Test.special_forms = {
            suite_name: "Special Forms",
            body: [
                TSLisp.Test.TestFramework.create("Initialization", "(setq b 50 z 100)"), 
                TSLisp.Test.TestFramework.create("Special Forms Evaluation", body_special_forms_eval, [
                    TSLisp.Symbol.symbolOf("x"), 
                    100, 
                    1, 
                    1, 
                    101, 
                    51, 
                    60, 
                    30, 
                    {
                        obj_type: "Promise"
                    }
                ])
            ]
        };
    })(TSLisp.Test || (TSLisp.Test = {}));
    var Test = TSLisp.Test;
})(TSLisp || (TSLisp = {}));
