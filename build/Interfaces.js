var Common;
(function (Common) {
    var Enumerator = (function () {
        function Enumerator(iterator) {
            this.iterator = iterator;
            this.current = null;
        }
        Object.defineProperty(Enumerator.prototype, "Current", {
            get: function () {
                return this.current;
            },
            enumerable: true,
            configurable: true
        });
        Enumerator.prototype.moveNext = function () {
            this.current = this.iterator();
            return this.current != null;
        };
        return Enumerator;
    })();
    Common.Enumerator = Enumerator;    
    var StringDictionary = (function () {
        function StringDictionary() {
            this.store = {
            };
            this.count = 0;
        }
        Object.defineProperty(StringDictionary.prototype, "Count", {
            get: function () {
                return this.count;
            },
            enumerable: true,
            configurable: true
        });
        StringDictionary.prototype.add = function (key, data) {
            if(this.store[key]) {
                return false;
            }
            this.store[key] = data;
            ++this.count;
            return true;
        };
        StringDictionary.prototype.addOrUpdate = function (key, data) {
            if(!this.store[key]) {
                ++this.count;
            }
            this.store[key] = data;
            return true;
        };
        StringDictionary.prototype.contains = function (key) {
            return this.store[key] !== undefined;
        };
        StringDictionary.prototype.lookup = function (key) {
            return this.store[key];
        };
        StringDictionary.prototype.remove = function (key) {
            delete this.store[key];
            --this.count;
            return null;
        };
        StringDictionary.prototype.getAllKeys = function () {
            var keys = [];
            for(var key in this.store) {
                if(this.store.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            return keys;
        };
        return StringDictionary;
    })();
    Common.StringDictionary = StringDictionary;    
    var HashEntry = (function () {
        function HashEntry(key, data) {
            this.key = key;
            this.data = data;
        }
        return HashEntry;
    })();
    Common.HashEntry = HashEntry;    
    var HashTable = (function () {
        function HashTable(size, hash_func, equals_func) {
            this.size = size;
            this.hash_func = hash_func;
            this.equals_func = equals_func;
            this.store = new Array();
            this.count = 0;
            for(var i = 0; i < size; ++i) {
                this.store[i] = null;
            }
        }
        Object.defineProperty(HashTable.prototype, "Count", {
            get: function () {
                return this.count;
            },
            enumerable: true,
            configurable: true
        });
        HashTable.prototype.add = function (key, data) {
            var new_entry = new HashEntry(key, data);
            var val = this.hash_func(key);
            val = val % this.size;
            for(var cur = this.store[val]; cur != null; cur = cur.next) {
                if(this.equals_func(key, cur.key)) {
                    return false;
                }
            }
            new_entry.next = this.store[val];
            this.store[val] = new_entry;
            ++this.count;
            return true;
        };
        HashTable.prototype.remove = function (key) {
            var val = this.hash_func(key);
            val = val % this.size;
            var result = null;
            var prev_entry = null;
            for(var cur = this.store[val]; cur != null; cur = cur.next) {
                if(this.equals_func(key, cur.key)) {
                    result = cur.data;
                    --this.count;
                    if(prev_entry) {
                        prev_entry.next = cur.next;
                    } else {
                        this.store[val] = cur.next;
                    }
                    break;
                }
                prev_entry = cur;
            }
            return result;
        };
        HashTable.prototype.lookup = function (key) {
            var val = this.hash_func(key);
            val = val % this.size;
            for(var cur = this.store[val]; cur != null; cur = cur.next) {
                if(this.equals_func(key, cur.key)) {
                    return cur.data;
                }
            }
            return undefined;
        };
        HashTable.prototype.contains = function (key) {
            var val = this.hash_func(key);
            val = val % this.size;
            for(var cur = this.store[val]; cur != null; cur = cur.next) {
                if(this.equals_func(key, cur.key)) {
                    return true;
                }
            }
            return false;
        };
        return HashTable;
    })();
    Common.HashTable = HashTable;    
})(Common || (Common = {}));

