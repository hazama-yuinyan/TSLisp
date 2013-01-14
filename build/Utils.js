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
        var val = obj.valueOf();
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
    function strip(str) {
        return str.replace(/^\s+/, '').replace(/\s+$/, '');
    }
    Utils.strip = strip;
    function getArgumentNamesFor(func) {
        var names = func.toString().match(/^[\s\(]*function[^(]*\((.*?)\)/)[1].split(",");
        names = names.map(Utils.strip);
        return (names.length == 1 && !names[0]) ? [] : names;
    }
    Utils.getArgumentNamesFor = getArgumentNamesFor;
    function isInheritedFrom(obj, target) {
        return target.prototype.isPrototypeOf(obj);
    }
    Utils.isInheritedFrom = isInheritedFrom;
    function substituteTemplate(tmpl, values) {
        return tmpl.replace(/\{(.+?)\}/g, function (str, placeholder_name) {
            return values[placeholder_name];
        });
    }
    Utils.substituteTemplate = substituteTemplate;
})(Utils || (Utils = {}));
