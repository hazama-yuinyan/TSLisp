var TSLisp;
(function (TSLisp) {
    (function (Test) {
        var TestFramework = (function () {
            function TestFramework(name, body, expected) {
                this.name = name;
                this.body = body;
                this.expected = expected;
            }
            TestFramework.create = function create(name, body, expected) {
                return new TestFramework(name, body, expected);
            }
            return TestFramework;
        })();
        Test.TestFramework = TestFramework;        
    })(TSLisp.Test || (TSLisp.Test = {}));
    var Test = TSLisp.Test;
})(TSLisp || (TSLisp = {}));
