#TypeScript Lisp 1.0                                    Oct. 28 2012 
-------------------
A small Lisp implementation in TypeScript
TS Lisp uses the following objects as Lisp values:
  numbers and strings => JavaScript's primitive values(and objects)
  nil                 => null
  symbols             => Symbol class objects
  Cons cells          => Cell class objects
Since the Cell class implements IEnumerable interface, which is similar to the one in C#
(see Common.ts for more info), you can enumerate it fairly easily.

##Characteristics
* It's basically a subset of Emacs Lisp but it uses static scope instead of dynamic.
* It'll always do tail call optimization.
* The symbol '*version*' refers to a list whose car is the version number and cdr is the platform name
  on which it is running.
* The subtract function '-' takes more than one arguments.
* The divide function '/' takes more than two arguments.
* (delay x) constructs a Promise object as in Scheme, and it can be shortened to '~x'.
  The built-in functions and conditional expressions implicitly resolve them.
* The (read) function returns a EOF symbol when it encounters EOF.
* Evaluating (lambda ...) yields a function whose parameters are "compiled".
* The form (macro ...) can only be evaluated in the global scope and it yields a Macro object.
* In the form (macro ...), symbols beginning with '$' are cosidered to be dummy symbols.
  Dummy symbols are self-evaluating and the "eq" function returns t only when it is called in the macro.
* C-like escape sequences(such as "\n") can be used in the string literal.
* The back-quotes, commas and comma-ats are resolved when reading.
  e.g. "'`((,a b) ,c ,@d)" => "(cons (list a 'b) (cons c d))"
* Native functions can have optional parameters like the built-in function "help" only if they take, at most, two parameters.

##Special forms
`quote`, `progn`, `cond`, `setq`, `lambda`, `macro`, `delay`
##Built-in functions
`car`, `cdr`, `cons`, `atom`, `numberp`, `stringp`, `eq`, `eql`, `list`
`print1`, `printc`, `terpri`, `read`, `+`, `-`, `*`, `/`, `%`, `<`
`eval`, `apply`, `force`, `replaca`, `replacd`, `throw`, `mapcar`, `mapc`, `length`
`ts-self`
`dump`, `help`
##Predefined variables
`*error*`, `*version*`, `*eof*`, `t`

And the initialization script contains some more general-purpose functions and macros including `defun`, `while`, `if`, `map`, `filter` etc.