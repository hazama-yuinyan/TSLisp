///<reference path='./Utils.ts' />
///<reference path='./LispTypes.ts' />


module ErrorFactory{
    export function makeSyntaxError(msg : string, values? : Object) : SyntaxError
    {
        return new SyntaxError(Utils.substituteTemplate(msg, values));
    }
    
    export function makeEvalException(msg : string, values? : Object) : TSLisp.EvalException
    {
        return new TSLisp.EvalException(Utils.substituteTemplate(msg, values));
    }
    
    export function createEvalException(msg : string, expr? : any) : TSLisp.EvalException
    {
        return new TSLisp.EvalException(msg, expr);
    }
    
    export function makeTypeError(msg : string, values? : Object) : TypeError
    {
        return new TypeError(Utils.substituteTemplate(msg, values));
    }
    
    export function makeLispThrowException(tag, value) : TSLisp.LispThrowException
    {
        return new TSLisp.LispThrowException(tag, value);
    }
    
    export function makeError(msg : string, values? : Object) : Error
    {
        return new Error(Utils.substituteTemplate(msg, values));
    }
}