///<reference path='Common.ts' />
///<reference path='WebHelpers.ts' />
///<reference path='Snippets.ts' />
///<reference path='ErrorFactory.ts' />
///<reference path='Utils.ts' />
///<reference path='LispTypes.ts' />



/**
 * Here are the definitions of Lisp built-in functions.
 * Note that the (read) and (list ...) functions are already registered in the Interpreter constructor.
 */

module TSLisp{
	function arithmeticAdd(lhs : number, rhs : number) : number{
		if(typeof lhs === "string" || typeof rhs === "string")
			throw ErrorFactory.makeTypeError("Can not add number to string or vice-versa!\nUse add function!");

		return lhs + rhs;
	}

	export var built_in_funcs = [
		{
			car : function(list){
				return (list == null) ? null : (<Cell> list).car;
			},
			is_lazy : false,
			help_msg : "(car (cons x y)) => x"
		},
		{
			cdr : function(list){
				return (list == null) ? null : (<Cell> list).cdr;
			},
			is_lazy : false,
			help_msg : "(cdr (cons x y)) => y"
		},
		{
			cons : function(car, cdr){
				return new Cell(car, cdr);
			},
			is_lazy : true,
			help_msg : "(cons x y) => (x . y)"
		},
		{
			atom : function(x){
				return (x instanceof Cell) ? null : LL.S_T;
			},
			is_lazy : false,
			help_msg : "(atom x) => t; if x is not a Cell, otherwise nil"
		},
		{
			eq : function(x, y){
				return (x == y) ? LL.S_T : null;
			},
			is_lazy : false,
			help_msg : "(eq x y) => t; if x and y refer to the same object, otherwise nil(using the JavaScript's loose equal operator '==')"
		},
		{
			stringp : function(x){
				return (typeof x === "string") ? LL.S_T : null;
			},
			is_lazy : false,
			help_msg : "(stringp x) => t; if x is a string, otherwise nil"
		},
		{
			prin1 : function(x){
				Common.HtmlConsole.print(LL.str(x, true));
				return x;
			},
			is_lazy : false,
			help_msg : "(prin1 x) : print x(if x is a string then double-quote it)"
		},
		{
			princ : function(x){
				Common.HtmlConsole.print(LL.str(x, false));
				return x;
			},
			is_lazy : false,
			help_msg : "(princ x) : just print x as it is(so strings won't be double-quoted)"
		},
		{
			terpri : function(){
				Common.HtmlConsole.println("");
				return true;
			},
			is_lazy : false,
			help_msg : "(terpri) : print a '\n'"
		},
		{
			force : function(x){
				return x;
			},
			is_lazy : false,
			help_msg : "(force x) => x(if x is a Promise then resolve it)"
		},
		{
			replaca : function(cons, newCar){
				(<Cell> cons).car = newCar;
				return newCar;
			},
			is_lazy : false,
			help_msg : "(replace (cons x y) a) => a : replace x with a. In other words, replace car with a"
		},
		{
			replacd : function(cons, newCdr){
				(<Cell> cons).cdr = newCdr;
				return newCdr;
			},
			is_lazy : false,
			help_msg : "(replacd (cons x y) a) => a : replace y with a. In other words, replace cdr with a"
		},
		{
			"throw" : function(tag, value){
				throw ErrorFactory.makeLispThrowException(tag, value);
			},
			is_lazy : false,
			help_msg : "(throw tag value) : throw value with tag"
		},
		{
			length : function(arg){
				if(arg == null)
					return 0;
				else if(arg instanceof Cell)
					return (<Cell> arg).Length;
				else if(typeof arg === "string")
					return (<string> arg).length;
				else
					return (<Common.ICollection> arg).getCount();
			},
			is_lazy : false,
			help_msg : "(length a), where a is a list, string or ICollection, => the number of elements"
		},
		{
			_add : function(lhs, rhs){
				return <string>lhs + <string>rhs;
			},
			is_lazy : false,
			help_msg : "(_add str1 str2) => str1 + str2"
		},
		{
			_concat : function(args){
				if(typeof args === "string")
					return args;
				else{
					var result = "";
					if(args != null){
						var er = (<Common.IEnumerable> args).getEnumerator();
						while(er.moveNext())
							result += er.Current.toString();
					}

					return result;
				}
			},
			is_lazy : false,
			help_msg : "(_concat '(1 2 3)) => \"\x01\x02\x03\""
		},
		{
			numberp : function(x){
				return (typeof x === "number") ? LL.S_T : null;
			},
			is_lazy : false,
			help_msg : "(numberp x) => t; if x is a number, otherwise nil"
		},
		{
			"+" : function(args : Common.IList){
				var x = 0;
				args.each(function(arg){
					x = arithmeticAdd(x, arg);
				});
				return x;
			},
			is_lazy : false,
			accepts_variable_args : true,
			help_msg : "(+ a b c ...) => a + b + c + ..."
		},
		{
			"-" : function(args : Common.IList){
				var n = args.getCount();
				var x = args.get(0);
				if(n == 1)
					return -x;
				
				for(var i = 1; i < n; ++i)
					x = x - args.get(i);

				return x;
			},
			is_lazy : false,
			accepts_variable_args : true,
			help_msg : "(- a) => -a or (- a b c ...) => a - b - c - ..."
		},
		{
			"*" : function(args : Common.IList){
				var x = 1;
				args.each(function(arg){
					x = x * arg;
				});
				return x;
			},
			is_lazy : false,
			accepts_variable_args : true,
			help_msg : "(* a b c ...) => a * b * c * ..."
		},
		{
			"/" : function(args : Common.IList){
				var n = args.getCount();
				if(n < 2)
					throw ErrorFactory.createEvalException("2 or more arguments expected", args);

				var x = args.get(0);
				for(var i = 1; i < n; ++i)
					x = x / args.get(i);

				return x;
			},
			is_lazy : false,
			accepts_variable_args : true,
			help_msg : "(/ a b c ...) => ((a / b) / c) / ..."
		},
		{
			"%" : function(lhs, rhs){
				return lhs % rhs;
			},
			is_lazy : false,
			help_msg : "(% a b) => a % b"
		},
		{
			"<" : function(lhs, rhs){
				return (lhs < rhs) ? LL.S_T : null;
			},
			is_lazy : false,
			help_msg : "(< a b) => t; if a is less than b, otherwise nil"
		},
		{
			eql : function(lhs, rhs){
				return (lhs === rhs) ? LL.S_T : null;
			},
			is_lazy : false,
			help_msg : "(eql a b) => t; if a and b are the same number, string or reference(using the JavaScript's strict equal operator '===')"
		},
		{
			"eval" : function(exp){
				var old_env : Cell = interp.Environment;
				interp.Environment = null;		//set the environment to global
				try{
					return interp.evaluate(exp, true);
				}
				finally{
					interp.Environment = old_env;
				}
			},
			is_lazy : false,
			help_msg : "(eval x) => evaluate x as a Lisp expression in the global scope"
		},
		{
			apply : function(fn, args){
				return interp.apply(fn, LL.listFromTS((<Common.IEnumerable> args)));
			},
			is_lazy : false,
			help_msg : "(apply fn (a b c ...)) => the result of (fn a b c ...)"
		},
		{
			mapcar : function(fn, seq){
				return LL.mapCar((x) => {
					return interp.apply(fn, new Common.List([x]));
				}, <Common.IEnumerable>seq);
			},
			is_lazy : false,
			help_msg : "(mapcar fn (a b c ...)) => ((fn a) (fn b) (fn c) ...)"
		},
		{
			mapc : function(fn, seq){
				var er = (<Common.IEnumerable> seq).getEnumerator();
				while(er.moveNext()){
					var x = er.Current;
					interp.apply(fn, new Common.List([x]));
				}
				return seq;
			},
			is_lazy : false,
			help_msg : "(mapc fn (a b c ...)) : apply fn on a, b, c... in sequence"
		},
		{
			"ts-get-property" : function(args : Common.IList){
                var target = args.get(0);
                var result = target, len = args.getCount();
                for(var i = 1; i < len; ++i)
                    result = result[args.get(i).toString()];
                    
                return result;
			},
			is_lazy : false,
			accepts_variable_args : true,
			help_msg : "(ts-get-property target property-name...) => the property of the object 'target'\n" +
                "e.g. Consider we have the following object\n" +
                '   var obj = {name : "a", nested_array : [1, 3, 5, 7, {another_nested : [2, 4, 6]}]}\n' +
                "   and a call '(ts-get-property obj 'nested_array 'another_nested 3)' returns '6'\n" +
                "INFO: The property-name arguments can be either symbols or strings."
		},
		{
			"ts-set-property" : function(args : Common.IList){
                var target = args.get(0), new_prop = args.get(1), len = args.getCount();
                for(var i = 2; i < len - 1; ++i)
                    target = target[args.get(i).toString()];
                    
                target[args.get(len - 1).toString()] = new_prop;
                return new_prop;
			},
			is_lazy : false,
			accepts_variable_args : true,
			help_msg : "(ts-set-property target new-prop property-name...) : set the property of 'target' to 'new-prop'\n" +
                "e.g. Consider we have the following object\n" +
                '   var obj = {name : "a", nested_array : [1, 3, 5, 7, {another_nested : [2, 4, 6]}]}\n' +
                "   and a call '(ts-set-property obj 8 'nested_array 'another_nested 2)' will change the object to\n" +
                '   {name : "a", nested_array : [1, 3, 5, 7, {another_nested : [2, 8, 6]}]}\n' +
                "INFO: The property-name arguments can be either symbols or strings."
		},
		{
			"ts-self" : function(){
				return interp;
			},
			is_lazy : false,
			help_msg : "(ts-self) => the interpreter instance"
		},
		{
			dump : function(){
				var keys = LL.listFrom(new Common.List(interp.SymbolTable.Keys));
				return LL.list(keys, interp.Environment);
			},
			is_lazy : false,
			help_msg : "(dump) => ((symbols in the global scope...) the environment)"
		},
		{
			help : function(arg){
				if(arg == null)
					Common.HtmlConsole.println(Utils.substituteTemplate(help_str, {version : LL.Version}));
				else{
					if(!(arg instanceof Symbol))
						throw ErrorFactory.createEvalException("The help function can not take arguments other than a symbol");

					var func_obj = interp.SymbolTable.lookup(<Symbol>arg);
					if(func_obj.help_msg)
						Common.HtmlConsole.println(func_obj.help_msg);
					else{
						if(func_obj.body){
							throw ErrorFactory.makeEvalException(
                                'The symbol "{arg}" doesn\'t refer to a function!',
                                {arg : arg.toString()}
                            );
						}else{
							throw ErrorFactory.makeEvalException(
                                'The target function "{arg}" doesn\'t seem to have help message.',
                                {arg : arg.toString()}
                            );
						}
					}
				}
				return null;
			},
			is_lazy : false,
			has_optional : true,
			help_msg : "(help [arg]) : print the help message when no args supplied or print the target function's help message when a symbol is passed in"
		},
		{
			"load-sample" : function(name){
				if(typeof name !== "string") throw ErrorFactory.createEvalException("This function can not take arguments other than a string!");

				name = name.toUpperCase();
				var target = TSLisp.Snippets[name];
				if(target){
					var old_env = interp.Environment;
					interp.Environment = null;		//evaluate the sample code in the global scope
					try{
						return interp.evaluateStrings(target);
					}
					finally{
						interp.Environment = old_env;
					}
				}
			},
			is_lazy : false,
			help_msg : "(load-sample sample-name) : loads the specified sample and after that, those functions which are contained in the sample can be used\n" +
						"Currently the sample-name can be \"PRIMES\" or \"FIBS\""
		},
		{
			abs : function(x){
				return Math.abs(x);
			},
			is_lazy : false,
			help_msg : "(abs x) => the absolute value of x"
		},
		{
			acos : function(x){
				return Math.acos(x) || null;
			},
			is_lazy : false,
			help_msg : "(acos x) => the arccosine of x or nil(if x is out of the range of -1 to 1) and the result value is between 0 and pi radians"
		},
		{
			asin : function(x){
				return Math.asin(x) || null;
			},
			is_lazy : false,
			help_msg : "(asin x) => the arcsine of x or nil(if x is out of the range of -1 to 1) and the result value is between -pi/2 and pi/2"
		},
		{
			atan : function(x, y){
				if(y === undefined)
					return Math.atan(x);
				else
					return Math.atan2(y, x);
			},
			is_lazy : false,
			has_optional : true,
			help_msg : "(atan x [y]) => the arctangent of arguments"
		},
		{
			ceil : function(x){
				return Math.ceil(x);
			},
			is_lazy : false,
			help_msg : "(ceil x) => the smallest integer greater than or equal to x"
		},
		{
			cos : function(x){
				return Math.cos(x);
			},
			is_lazy : false,
			help_msg : "(cos x) => the cosine of x(where x is a number representing an angle in radians)"
		},
		{
			exp : function(x){
				return Math.exp(x);
			},
			is_lazy : false,
			help_msg : "(exp x) => E^x(where x is the argument, and E is the Euler's constant)"
		},
		{
			floor : function(x){
				return Math.floor(x);
			},
			is_lazy : false,
			help_msg : "(floor x) => the largest integer less than or equal to x"
		},
		{
			log : function(x){
				return Math.log(x);
			},
			is_lazy : false,
			help_msg : "(log x) => the natural logarithms(log_e, also ln) of x"
		},
		{
			max : function(numbers : Common.IEnumerable){
				if(numbers == null) return null;

				var er = numbers.getEnumerator();
				if(!er.moveNext())
					return null;

				var result = er.Current;
				while(er.moveNext())
					result = Math.max(result, er.Current);
				
                return result || null;
			},
			is_lazy : false,
			accepts_variable_args : true,
			help_msg : "(max (a ...)) => the largest number among all the numbers in the list supplied to the function or nil" +
						"(if any one of the elements in the list is not a number or when an empty list is supplied)"
		},
		{
			min : function(numbers : Common.IEnumerable){
				if(numbers == null) return null;

				var er = numbers.getEnumerator();
				if(!er.moveNext())
					return null;

				var result = er.Current;
				while(er.moveNext())
					result = Math.min(result, er.Current);
				
                return result || null;
			},
			is_lazy : false,
			accepts_variable_args : true,
			help_msg : "(min (a ...)) => the smallest number among all the numbers in the list supplied to the function or nil" +
						"(if any one of the elements in the list is not a number or when an empty list is supplied)"
		},
		{
			pow : function(base, exponents){
				return Math.pow(base, exponents);
			},
			is_lazy : false,
			help_msg : "(pow base exponents) => base to the exponents power, that is, base^exponents"
		},
		{
			random : function(){
				return Math.random();
			},
			is_lazy : false,
			help_msg : "(random) => a psuedo-random number in the range of [0, 1), that is, from 0(inclusive) up to 1(exclusive)"
		},
		{
			round : function(x){
				return Math.round(x);
			},
			is_lazy : false,
			help_msg : "(round x) => the nearest integer to x"
		},
		{
			sin : function(x){
				return Math.sin(x);
			},
			is_lazy : false,
			help_msg : "(sin x) => the sin of x(where x is a number representing an angle in radians)"
		},
		{
			sqrt : function(x){
				return Math.sqrt(x) || null;
			},
			is_lazy : false,
			help_msg : "(sqrt x) => the positive square root of x or nil(if x is a nagative number)"
		},
		{
			tan : function(x){
				return Math.tan(x);
			},
			is_lazy : false,
			help_msg : "(tan x) => the tangent of x(where x is a number representing an angle in radians)"
		},
		{
			"radians-to-degrees" : function(a){
				return a / (Math.PI / 180);
			},
			is_lazy : false,
			help_msg : "(radians-to-degrees a) => the angle in degrees coverted from the argument"
		},
		{
			"degrees-to-radians" : function(a){
				return a * (Math.PI / 180);
			},
			is_lazy : false,
			help_msg : "(degrees-to-radians a) => the angle in radians converted from the argument"
		}
	];

	var help_str = 
		"TypeScript Lisp {version}                                    Oct. 28 2012\n" +
        "                                            Last modified at Jan. 14 2013\n\n" +
		"A small Lisp implementation in TypeScript\n\n" +
		"TS Lisp uses the following objects as Lisp values:\n\n" +
		"  numbers and strings => JavaScript's primitive values(and objects)\n" +
		"  nil                 => null\n" +
		"  symbols             => Symbol class objects\n" +
		"  Cons cells          => Cell class objects\n\n" +
		"Since the Cell class implements IEnumerable interface, which is similar to the one in C#\n" +
		"(see Common.ts for more info), you can enumerate it fairly easily.\n\n" +
		"Characteristics:\n" +
		"* It's basically a subset of Emacs Lisp but it uses static scope instead of dynamic.\n" +
		"* It'll always do tail call optimization.\n" +
		"* The symbol '*version*' refers to a list whose car is the version number and cdr is the platform name\n" +
		"  on which it is running.\n" +
		"* The subtract function '-' can take more than zero arguments(when only one argument is supplied it works as the unary operator '-').\n" +
		"* The divide function '/' can take more than one argument.\n" +
		"* (delay x) constructs a Promise object as in Scheme, and it can be shortened to '~x'.\n" +
		"  The built-in functions and conditional expressions implicitly resolve them.\n" +
		"* The (read) function returns the EOF symbol when it encounters EOF.\n" +
		"* Evaluating (lambda ...) yields a function whose parameters are \"compiled\".\n" +
		"* The form (macro ...) can only be evaluated in the global scope and it yields a Macro object.\n" +
		"* In the form (macro ...), symbols beginning with '$' are cosidered to be dummy symbols.\n" +
		"  Dummy symbols are self-evaluating and the \"eq\" function returns t only when it is called in the macro.\n" +
		"* C-like escape sequences(such as \"\\n\") can be used in the string literal.\n" +
		"* The back-quotes, commas and comma-ats are resolved when reading.\n" +
		"  e.g. \"'`((,a b) ,c ,@d)\" => \"(cons (list a 'b) (cons c d))\"\n" +
		"* Native functions can have optional parameters like the built-in function \"help\" does only if they take, at most, two parameters.\n" +
		"Note: Most of the implementation is taken from the following web site; http://www.oki-osk.jp/esc/llsp/v8.html\n" +
        "(The above web site is written only in Japanese)\n\n" +
        "Notations used in the help messages of native functions:\n" +
		"Here I will explain the notations used in the help messages of native functions.\n\n" +
		"Above all I use the word \"Native function\" to mean the functions that are written in TypeScript.\n" +
		"And those functions are named in the following list, so see it to ensure which one is native and which is not.\n\n" +
		"Here are some typical function descriptions. And I will explain the notations through these.\n" +
		"  (foo x y [z]) => x + y or z - x + y(when z is supplied)\n" +
		"  (barp x) => t; if x is the string \"bar\", otherwise nil\n" +
		"  (bar (x y...)) : print x y ...\n" +
		"The first description reads \"function 'foo' has 2 or 3 parameters(since z is optional) and it evaluates to 'x + y', when 2 arguments supplied, or 'z - x + y', when 3 arguments supplied.\"\n" +
		"The second reads \"function 'barp' has only 1 parameter and it returns the symbol 't' if the argument is the string 'bar', otherwise returns nil.\"\n" +
		"Generally descriptions of predicate functions, which are the functions that test some conditions against the arguments and " +
		"return 't' if the test succeeds, or if the test fails, return 'nil', will take this form.\n" +
		"And the third reads \"function 'bar' takes a list and print the elements in the order the list have the elements.\"\n" +
		"Lists as arguments can usually have as many elements as you would like, unless they are described otherwise.\n" +
		"And, as you may see from the third example, a colon ':' indicates that the function returns nothing or nothing useful " +
		"for later computation and therefore can be considered to only has side-effects.\n\n" +
		"Special forms:\n" +
		"quote, progn, cond, setq, lambda, macro, delay\n" +
		"Built-in functions:\n" +
		"car, cdr, cons, atom, numberp, stringp, eq, eql, list\n" +
		"prin1, princ, terpri, read, +, -, *, /, %, <\n" +
		"eval, apply, force, replaca, replacd, throw, mapcar, mapc, length\n" +
		"ts-get-property, ts-set-property, ts-self\n" +
		"dump, help, load-sample\n" +
		"abs, acos, asin, atan, ceil, cos, exp, floor, log, max, min\n" +
		"pow, random, round, sin, sqrt, tan, radians-to-degrees, degrees-to-radians\n" +
		"Predefined variables:\n" +
		"*error*, *version*, *eof*, t\n" +
		"Predefined constants:\n" +
		"*pi*, *napier*";
}