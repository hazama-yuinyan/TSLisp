var TSLisp;
(function (TSLisp) {
    (function (Test) {
        var body_arithmetic_ops = "(+ 3 4)\n" + "(- 3 4)\n" + "(- 1)\n" + "(* 3 4)\n" + "(/ 4 4)\n" + "(% 6 4)\n" + "(+ a b c 1 4)\n" + "(- b a c 1 2)\n" + "(* a b c 1 2)\n" + "(/ a c)\n" + "(/ 1000 a b)";
        var body_relational_ops = "(< 3 4)\n" + "(eql 1 1)\n" + "(= 1 1)\n" + "(< a b)\n" + "(> a b)\n" + "(<= a b)\n" + "(>= a c)\n" + "(/= a b)\n" + "(<> a b)\n" + '(eql str "abc")\n' + '(= str "abc")\n' + '(/= str "abc")\n' + '(<> str "abc")';
        var body_logical_ops = "(and t nil)\n" + "(or t nil)\n" + "(not t)\n" + "(and 0 1)\n" + "(or 0 1)\n" + "(not '())";
        Test.basic_operators = {
            suite_name: "Basic Operators",
            body: [
                TSLisp.Test.TestFramework.create("Initialization", '(setq a 4 b 8 c 5 str "abc")\n'), 
                TSLisp.Test.TestFramework.create("Arithmetic Operators", body_arithmetic_ops, [
                    7, 
                    -1, 
                    -1, 
                    12, 
                    1, 
                    6 % 4, 
                    22, 
                    -4, 
                    320, 
                    4 / 5, 
                    1000 / 4 / 8
                ]), 
                TSLisp.Test.TestFramework.create("Relational Operators", body_relational_ops, [
                    TSLisp.LL.S_T, 
                    TSLisp.LL.S_T, 
                    TSLisp.LL.S_T, 
                    TSLisp.LL.S_T, 
                    null, 
                    TSLisp.LL.S_T, 
                    null, 
                    TSLisp.LL.S_T, 
                    TSLisp.LL.S_T, 
                    TSLisp.LL.S_T, 
                    TSLisp.LL.S_T, 
                    null, 
                    null
                ]), 
                TSLisp.Test.TestFramework.create("Logical Operations", body_logical_ops, [
                    null, 
                    TSLisp.LL.S_T, 
                    null, 
                    1, 
                    0, 
                    TSLisp.LL.S_T
                ])
            ]
        };
    })(TSLisp.Test || (TSLisp.Test = {}));
    var Test = TSLisp.Test;
})(TSLisp || (TSLisp = {}));
