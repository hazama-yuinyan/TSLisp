///<reference path='TestFramework.ts' />


module TSLisp{
    export module Test{
        var body_arithmetic_ops =
            "(+ 3 4)\n" +           //7
            "(- 3 4)\n" +           //-1
            "(- 1)\n" +             //-1
            "(* 3 4)\n" +           //12
            "(/ 4 4)\n" +           //1
            "(% 6 4)\n" +           //2
            "(+ a b c 1 4)\n" +     //22
            "(- b a c 1 2)\n" +     //-4
            "(* a b c 1 2)\n" +     //320
            "(/ a c)\n" +           //0.8
            "(/ 1000 a b)";         //31.25
        var body_relational_ops =
            "(< 3 4)\n" +           //true
            "(eql 1 1)\n" +         //true
            "(= 1 1)\n" +           //true
            "(< a b)\n" +           //true
            "(> a b)\n" +           //false
            "(<= a b)\n" +          //true
            "(>= a c)\n" +          //false
            "(/= a b)\n" +          //true
            "(<> a b)\n" +          //true
            '(eql str "abc")\n' +   //true
            '(= str "abc")\n' +     //true
            '(/= str "abc")\n' +    //false
            '(<> str "abc")';       //false
        var body_logical_ops =
            "(and t nil)\n" +       //false
            "(or t nil)\n" +        //true
            "(not t)\n" +           //false
            "(and 0 1)\n" +         //1
            "(or 0 1)\n" +          //0
            "(not '())";            //true
            
        export var basic_operators = {
            suite_name : "Basic Operators",
            body : [
                Test.TestFramework.create(
                    "Initialization",
                    '(setq a 4 b 8 c 5 str "abc")\n'
                ),
                Test.TestFramework.create(
                    "Arithmetic Operators",
                    body_arithmetic_ops,
                    [
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
                    ]
                ),
                Test.TestFramework.create(
                    "Relational Operators",
                    body_relational_ops,
                    [
                        LL.S_T,
                        LL.S_T,
                        LL.S_T,
                        LL.S_T,
                        null,
                        LL.S_T,
                        null,
                        LL.S_T,
                        LL.S_T,
                        LL.S_T,
                        LL.S_T,
                        null,
                        null
                    ]
                ),
                Test.TestFramework.create(
                    "Logical Operations",
                    body_logical_ops,
                    [
                        null,
                        LL.S_T,
                        null,
                        1,
                        0,
                        LL.S_T
                    ]
                )
            ]
        };
    }
}