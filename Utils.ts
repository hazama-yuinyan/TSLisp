module Utils{
    /**
     * Determines whether the given string is a white space character.
     */
	export function isWhitespace(ch : string)
	{
		return ch.search(/[\s]/) != -1;
	}
    
    // This function is meant to be private to the module.
    // But due to the limitation of TypeScript it's forced to be an exported function.
	export function combineHashes(lhs : number, rhs : number)
	{
		return rhs ^ ((lhs >> 5) + lhs);
	}
    
    /**
     * Given an object, returns a hash code.
     */
	export function getHashCodeFor(obj) : number
	{
		var val = obj.valueOf();
		var result : number;
		if(typeof val === "string"){
			result = val.charCodeAt(0);
			for(var i = 1; i < val.length; ++i)
				result = combineHashes(val.charCodeAt(i), result);
			
			return result;
		}else{
			return val;
		}
	}

    /**
     * Strips all the leading and trailing white space characters.
     */
	export function strip(str : string) : string
	{
		return str.replace(/^\s+/, '').replace(/\s+$/, '');
	}

    /**
     * Given a function, returns all the formal parameter names.
     */
	export function getArgumentNamesFor(func) : string[]
	{
		var names = func.toString().match(/^[\s\(]*function[^(]*\((.*?)\)/)[1].split(",");
		names = names.map(Utils.strip);
		return (names.length == 1 && !names[0]) ? [] : names;
	}

    /**
     * Determines whether the `obj` is an instance of a subclass of `target`.
     */
	export function isInheritedFrom(obj, target) : bool
	{
		return target.prototype.isPrototypeOf(obj);
	}
    
    /**
     * Replaces all substitutions in the given string with corresponding values.
     * @param tmpl {String} A string containing substitutions
     * @param values {Object} Key-Value pairs whose keys are the placeholder names and values are the actual values being replaced
     * @returns A string in which all substitutions are replaced
     */
    export function substituteTemplate(tmpl : string, values : any) : string
    {
        return tmpl.replace(/\{(.+?)\}/g, (str, placeholder_name) => {
            return values[placeholder_name];
        });
    }
}