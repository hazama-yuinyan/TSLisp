

module Utils{
	export function isWhitespace(ch : string)
	{
		return ch.search(/[\s]/) != -1;
	}

	export function combineHashes(lhs : number, rhs : number)
	{
		return rhs ^ ((lhs >> 5) + lhs);
	}

	export function getHashCodeFor(obj) : number
	{
		var val = obj.toString();
		var result : number;
		if(typeof val === "string"){
			result = val.charCodeAt(0);
			for(var i = 1; i < val.length; ++i){
				result = combineHashes(val.charCodeAt(i), result);
			}
			return result;
		}else{
			return val;
		}
	}
}