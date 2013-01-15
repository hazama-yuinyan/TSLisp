///<reference path='../LispTypes.ts' />


module TSLisp{
    export module Test{
        export module Util{
           export function cons(car, cdr) : TSLisp.Cell
           {
               return new TSLisp.Cell(car, cdr);
           }
        }
    }
}