var Utils;
(function (Utils) {
    function isWhitespace(ch) {
        return ch.search(/[\s]/) != -1;
    }
    Utils.isWhitespace = isWhitespace;
    function combineHashes(lhs, rhs) {
        return rhs ^ ((lhs >> 5) + lhs);
    }
    Utils.combineHashes = combineHashes;
    function getHashCodeFor(obj) {
        var val = obj.toString();
        var result;
        if(typeof val === "string") {
            result = val.charCodeAt(0);
            for(var i = 1; i < val.length; ++i) {
                result = combineHashes(val.charCodeAt(i), result);
            }
            return result;
        } else {
            return val;
        }
    }
    Utils.getHashCodeFor = getHashCodeFor;
})(Utils || (Utils = {}));

