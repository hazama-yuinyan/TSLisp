#TypeScript Lisp 1.1                                    Jan. 19 2013 
-------------------
A small Lisp implementation in TypeScript
TS Lisp uses the following objects as Lisp values:
  numbers and strings => JavaScript's primitive values(and objects)
  nil                 => null
  symbols             => Symbol class objects
  Cons cells          => Cell class objects
Since the Cell class implements IEnumerable interface, which is similar to the one in C#
(see Common.ts for more info), you can enumerate it fairly easily.

##How to use it
First clone the git repository and execute `git submodule init` and `git submodule update`. Then you must be ready to get it working.
Just open the "console.html" file on your favorite web browser with cross-site scripting on, which can be enabled on Chrome using the 
`allow-access-from-files` switch, and you'll see the TSLisp console welcoming you.
Or if you prefer to compile the code by yourself, just type `./compile.sh` command into the terminal, if you have bash installed. Otherwise,
you have to the commands to compile one by one.

##Characteristics
* It's basically a subset of Emacs Lisp but it uses static scope instead of dynamic.
* It'll always do tail call optimization.
* The symbol '*version*' refers to a cons cell whose car is the version number and cdr is the platform name
  on which it is running.
* The subtract function '-' can take more than zero arguments.
* The divide function '/' can take more than one argument.
* (delay x) constructs a Promise object as in Scheme, and it can be shortened to '~x'.
  The built-in functions and conditional expressions implicitly resolve them.
* Evaluating (lambda ...) yields a function whose parameters are "compiled". Here "compiled" means that the symbols, which are about to be compiled,
  are transformed into offsets and therefore they can be referenced by a single indexing rather than an expensive hash table lookup or something.
* The form (macro ...) can only be evaluated in the global scope and it yields a Macro object.
* In the form (macro ...), symbols beginning with '$' are cosidered to be dummy symbols.
  Dummy symbols are self-evaluating and the "eq" function returns t only when it is called in the macro.
* C-like escape sequences(such as "\n") can be used in the string literal.
* The back-quotes, commas and comma-ats are resolved when reading.
  e.g. "'`((,a b) ,c ,@d)" => "(cons (list a 'b) (cons c d))"
* Native functions can have optional parameters like the built-in function "help" does only if they take, at most, two parameters.

##Special forms
`quote`, `progn`, `cond`, `setq`, `lambda`, `macro`, `delay`
##Built-in functions
`car`, `cdr`, `cons`, `atom`, `numberp`, `stringp`, `eq`, `eql`, `list`
`prin1`, `princ`, `terpri`, `read`, `+`, `-`, `*`, `/`, `%`, `<`
`eval`, `apply`, `force`, `replaca`, `replacd`, `throw`, `mapcar`, `mapc`, `length`
`ts-self`, `ts-get-property`, `ts-set-property`
`dump`, `help`, `load-sample`
`abs`, `acos`, `asin`, `atan`, `ceil`, `cos`, `exp`, `floor`, `log`, `max`, `min`
`pow`, `random`, `round`, `sin`, `sqrt`, `tan`, `radians-to-degrees`, `degrees-to-radians`
##Predefined variables
`*error*`, `*version*`, `*eof*`, `t`

And the initialization script contains some more general-purpose functions and macros including `defun`, `while`, `if`, `map`, `filter` etc.