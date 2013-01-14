var ErrorFactory;
(function (ErrorFactory) {
    function makeSyntaxError(msg, values) {
        return new SyntaxError(Utils.substituteTemplate(msg, values));
    }
    ErrorFactory.makeSyntaxError = makeSyntaxError;
    function makeEvalException(msg, values) {
        return new TSLisp.EvalException(Utils.substituteTemplate(msg, values));
    }
    ErrorFactory.makeEvalException = makeEvalException;
    function createEvalException(msg, expr) {
        return new TSLisp.EvalException(msg, expr);
    }
    ErrorFactory.createEvalException = createEvalException;
    function makeTypeError(msg, values) {
        return new TypeError(Utils.substituteTemplate(msg, values));
    }
    ErrorFactory.makeTypeError = makeTypeError;
    function makeLispThrowException(tag, value) {
        return new TSLisp.LispThrowException(tag, value);
    }
    ErrorFactory.makeLispThrowException = makeLispThrowException;
    function makeError(msg, values) {
        return new Error(Utils.substituteTemplate(msg, values));
    }
    ErrorFactory.makeError = makeError;
})(ErrorFactory || (ErrorFactory = {}));
