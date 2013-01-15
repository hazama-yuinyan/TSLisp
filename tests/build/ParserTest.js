var TSLisp;
(function (TSLisp) {
    (function (Test) {
        var LL = TSLisp.LL;
        var body_literal = "10\n" + "100.3\n" + "-1.5\n" + '"abcdefg"\n' + '"\141\142\143\144\145\146\147"\n' + '"\x61\x62\x63\x64\x65\x66\x67"\n' + "a\n" + "$x";
        var body_special_forms = "(quote x)\n" + "(progn 1 2 3 4 x y z)\n" + "(cond t 1 0)\n" + "(setq $a 1)\n" + "(lambda (a) (+ a 1))\n" + "(macro (a) (+ a b))\n" + "(macro (a b) (+ a b))\n" + "(macro (a) (macro (x) (+ a x)))\n" + "(delay x)";
        var body_shorthands = "`x\n" + "`(x y z)\n" + "`(x ,y ,@z)\n" + "~x\n" + "'x\n" + "'(x y z)";
        var symbol_x = TSLisp.Symbol.symbolOf("x"), symbol_y = TSLisp.Symbol.symbolOf("y"), symbol_z = TSLisp.Symbol.symbolOf("z");
        var symbol_a = TSLisp.Symbol.symbolOf("a"), symbol_b = TSLisp.Symbol.symbolOf("b");
        Test.parser_test = {
            suite_name: "Parser Test",
            body: [
                TSLisp.Test.TestFramework.create("Literal", body_literal, [
                    10, 
                    100.3, 
                    -1.5, 
                    "abcdefg", 
                    "abcdefg", 
                    "abcdefg", 
                    symbol_a, 
                    TSLisp.Symbol.symbolOf("$x")
                ]), 
                TSLisp.Test.TestFramework.create("Special Forms", body_special_forms, [
                    LL.list(LL.S_QUOTE, symbol_x), 
                    LL.list(LL.S_PROGN, 1, 2, 3, 4, symbol_x, symbol_y, symbol_z), 
                    LL.list(LL.S_COND, LL.S_T, 1, 0), 
                    LL.list(LL.S_SETQ, TSLisp.Symbol.symbolOf("$a"), 1), 
                    LL.list(LL.S_LAMBDA, LL.list(symbol_a), LL.list(TSLisp.Symbol.symbolOf("+"), symbol_a, 1)), 
                    LL.list(LL.S_MACRO, LL.list(symbol_a), LL.list(TSLisp.Symbol.symbolOf("+"), symbol_a, symbol_b)), 
                    LL.list(LL.S_MACRO, LL.list(symbol_a, symbol_b), LL.list(TSLisp.Symbol.symbolOf("+"), symbol_a, symbol_b)), 
                    LL.list(LL.S_MACRO, LL.list(symbol_a), LL.list(LL.S_MACRO, LL.list(symbol_x), LL.list(TSLisp.Symbol.symbolOf("+"), symbol_a, symbol_x))), 
                    LL.list(LL.S_DELAY, symbol_x)
                ]), 
                TSLisp.Test.TestFramework.create("Short Forms", body_shorthands, [
                    symbol_x, 
                    LL.list(symbol_x, symbol_y, symbol_z), 
                    LL.list(symbol_x, LL.list(symbol_y), symbol_z), 
                    LL.list(LL.S_DELAY, symbol_x), 
                    LL.list(LL.S_QUOTE, symbol_x), 
                    LL.list(LL.S_QUOTE, LL.list(symbol_x, symbol_y, symbol_z))
                ])
            ]
        };
    })(TSLisp.Test || (TSLisp.Test = {}));
    var Test = TSLisp.Test;
})(TSLisp || (TSLisp = {}));
