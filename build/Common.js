var Common;
(function (Common) {
    var Enumerator = (function () {
        function Enumerator(iterator) {
            this.iterator = iterator;
            this.current = undefined;
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
            return this.current !== undefined;
        };
        return Enumerator;
    })();
    Common.Enumerator = Enumerator;    
    var Dictionary = (function () {
        function Dictionary() {
            this.store = {
            };
            this.count = 0;
        }
        Dictionary.prototype.getCount = function () {
            return this.count;
        };
        Dictionary.prototype.add = function (key, data) {
            var key_str = key.toString();
            if(this.store[key_str]) {
                return false;
            }
            this.store[key_str] = data;
            ++this.count;
            return true;
        };
        Dictionary.prototype.contains = function (key) {
            var key_str = key.toString();
            return this.store[key_str] !== undefined;
        };
        Dictionary.prototype.lookup = function (key) {
            var key_str = key.toString();
            return this.store[key_str];
        };
        Dictionary.prototype.remove = function (key) {
            var key_str = key.toString();
            var tmp = this.store[key_str];
            delete this.store[key_str];
            --this.count;
            return tmp;
        };
        return Dictionary;
    })();
    Common.Dictionary = Dictionary;    
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
        Object.defineProperty(HashTable.prototype, "Keys", {
            get: function () {
                var result = [];
                this.store.forEach(function (entry) {
                    if(entry) {
                        for(var cur = entry; cur != null; cur = cur.next) {
                            result.push(cur.key);
                        }
                    }
                });
                return result;
            },
            enumerable: true,
            configurable: true
        });
        HashTable.prototype.getCount = function () {
            return this.count;
        };
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
        HashTable.prototype.findKey = function (data) {
            var result;
            this.store.every(function (entry) {
                if(entry) {
                    for(var cur = entry; cur != null; cur = cur.next) {
                        if(data == cur.data) {
                            result = cur.key;
                            return false;
                        }
                    }
                }
                return true;
            });
            return result;
        };
        return HashTable;
    })();
    Common.HashTable = HashTable;    
    var List = (function () {
        function List(args) {
            if(args && (args instanceof Enumerator || args.getEnumerator)) {
                var er = args.getEnumerator && args.getEnumerator() || args;
                this.contents = [];
                while(er.moveNext()) {
                    this.contents.push(er.Current);
                }
            } else {
                if(args instanceof Array) {
                    this.contents = args;
                } else {
                    this.contents = [];
                }
            }
        }
        List.prototype.add = function (elem) {
            this.contents.push(elem);
        };
        List.prototype.each = function (fn) {
            this.contents.forEach(fn);
        };
        List.prototype.get = function (index) {
            return this.contents[index];
        };
        List.prototype.update = function (index, newElem) {
            if(index < 0 || index >= this.contents.length) {
                throw new RangeError("The index is out of bounds!");
            }
            this.contents[index] = newElem;
        };
        List.prototype.remove = function (elem) {
            var index = this.contents.indexOf(elem);
            if(index != -1) {
                return this.contents.splice(index, 1);
            }
        };
        List.prototype.removeAt = function (index) {
            return this.contents.splice(index, 1);
        };
        List.prototype.getCount = function () {
            return this.contents.length;
        };
        List.prototype.getEnumerator = function () {
            var _this = this;
            var cur_pos = 0;
            return new Common.Enumerator(function () {
                if(cur_pos < _this.contents.length) {
                    return _this.contents[cur_pos++];
                }
            });
        };
        return List;
    })();
    Common.List = List;    
    var StringReader = (function () {
        function StringReader(buffer) {
            this.buffer = buffer;
        }
        StringReader.prototype.getEnumerator = function () {
            var lines = this.buffer.split(/\n/);
            var cur_pos = 0;
            return new Enumerator(function () {
                if(cur_pos < lines.length) {
                    return lines[cur_pos++];
                } else {
                    return undefined;
                }
            });
        };
        return StringReader;
    })();
    Common.StringReader = StringReader;    
    var EnumeratorStore = (function () {
        function EnumeratorStore(enumerator) {
            this.enumerator = enumerator;
        }
        EnumeratorStore.prototype.getEnumerator = function () {
            return this.enumerator;
        };
        return EnumeratorStore;
    })();
    Common.EnumeratorStore = EnumeratorStore;    
    function take(count, er) {
        var i = 0;
        return new EnumeratorStore(new Common.Enumerator(function () {
            if(i < count && er.moveNext()) {
                ++i;
                return er.Current;
            }
        }));
    }
    Common.take = take;
    function takeAll(er) {
        return new EnumeratorStore(new Common.Enumerator(function () {
            if(er.moveNext()) {
                return er.Current;
            }
        }));
    }
    Common.takeAll = takeAll;
})(Common || (Common = {}));

