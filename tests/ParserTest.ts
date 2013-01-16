///<reference path='../LispTypes.ts' />
///<reference path='Util.ts' />
///<reference path='TestFramework.ts' />


module TSLisp{
    export module Test{
        var LL = TSLisp.LL;
        var body_literal =
            "10\n" +
            "100.3\n" +
            "-1.5\n" +
            "#b11111111\n" +                        //255
            "#o377\n" +                             //255
            "#xff\n" +                              //255
            '"abcdefg"\n' +
            '"\141\142\143\144\145\146\147"\n' +    //"abcdefg"
            '"\x61\x62\x63\x64\x65\x66\x67"\n' +    //"abcdefg"
            "a\n" +
            "$x";
        var body_special_forms =
            "(quote x)\n" +
            "(progn 1 2 3 4 x y z)\n" +
            "(cond t 1 0)\n" +
            "(setq $a 1)\n" +
            "(lambda (a) (+ a 1))\n" +
            "(macro (a) (+ a b))\n" +
            "(macro (a b) (+ a b))\n" +
            "(macro (a) (macro (x) (+ a x)))\n" +
            "(delay x)";
        var body_shorthands =
            "`x\n" +
            "`(x y z)\n" +
            "`(x ,y z)\n" +
            "`(x ,@y z)\n" +
            "`(x ,y ,@z)\n" +
            "~x\n" +
            "'x\n" +
            "'(x y z)";
        //var
        
        var symbol_x = TSLisp.Symbol.symbolOf("x"), symbol_y = TSLisp.Symbol.symbolOf("y"), symbol_z = TSLisp.Symbol.symbolOf("z");
        var symbol_a = TSLisp.Symbol.symbolOf("a"), symbol_b = TSLisp.Symbol.symbolOf("b");
        
        export var parser_test = {
            suite_name : "Parser Test",
            body : [
                Test.TestFramework.create(
                    "Literal",
                    body_literal,
                    [
                        10,
                        100.3,
                        -1.5,
                        255,
                        255,
                        255,
                        "abcdefg",
                        "abcdefg",
                        "abcdefg",
                        symbol_a,
                        TSLisp.Symbol.symbolOf("$x")
                    ]
                ),
                Test.TestFramework.create(
                    "Special Forms",
                    body_special_forms,
                    [
                        LL.list(LL.S_QUOTE, symbol_x),
                        LL.list(LL.S_PROGN, 1, 2, 3, 4, symbol_x, symbol_y, symbol_z),
                        LL.list(LL.S_COND, LL.S_T, 1, 0),
                        LL.list(LL.S_SETQ, TSLisp.Symbol.symbolOf("$a"), 1),
                        LL.list(LL.S_LAMBDA, LL.list(symbol_a),
                            LL.list(TSLisp.Symbol.symbolOf("+"), symbol_a, 1)),
                        LL.list(LL.S_MACRO, LL.list(symbol_a),
                            LL.list(TSLisp.Symbol.symbolOf("+"), symbol_a, symbol_b)),
                        LL.list(LL.S_MACRO, LL.list(symbol_a, symbol_b),
                            LL.list(TSLisp.Symbol.symbolOf("+"), symbol_a, symbol_b)),
                        LL.list(LL.S_MACRO, LL.list(symbol_a),
                            LL.list(LL.S_MACRO, LL.list(symbol_x),
                                LL.list(TSLisp.Symbol.symbolOf("+"), symbol_a, symbol_x))),
                        LL.list(LL.S_DELAY, symbol_x)
                    ]
                ),
                Test.TestFramework.create(
                    "Short Forms",
                    body_shorthands,
                    [
                        LL.list(LL.S_QUOTE, symbol_x),                              //'x
                        LL.list(LL.S_LIST, LL.list(LL.S_QUOTE, symbol_x),           //(list 'x 'y 'z)
                            LL.list(LL.S_QUOTE, symbol_y),
                            LL.list(LL.S_QUOTE, symbol_z)),
                        LL.list(LL.S_LIST, LL.list(LL.S_QUOTE, symbol_x),           //(list 'x y 'z)
                            symbol_y, LL.list(LL.S_QUOTE, symbol_z)),
                        LL.list(LL.S_APPEND, LL.list(LL.S_CONS,                     //(append (cons 'x y) (list 'z))
                            LL.list(LL.S_QUOTE, symbol_x), symbol_y),
                            LL.list(LL.S_LIST, LL.list(
                                LL.S_QUOTE, symbol_z))),
                        LL.list(LL.S_CONS, LL.list(LL.S_QUOTE, symbol_x),           //(cons 'x (cons y z))
                            LL.list(LL.S_CONS, symbol_y, symbol_z)),
                        LL.list(LL.S_DELAY, symbol_x),
                        LL.list(LL.S_QUOTE, symbol_x),
                        LL.list(LL.S_QUOTE, LL.list(symbol_x, symbol_y, symbol_z))
                    ]
                )
            ]
        };
    }
}