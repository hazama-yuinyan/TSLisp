module Common
{
	/**
	 * Implemented by classes that support a simple iteration over instances of the container.
	 */
	export interface IEnumerable
	{
		getEnumerator() : Enumerator;
	}

	/**
	 * Implemented by classes that support a simple iteration over instances of the container.
	 */
	interface IEnumerator
	{
		moveNext() : bool;
	}

	/**
	 * Like the similarily named class in C#, it can be used to iterate over instances of a container.
	 */
	export class Enumerator implements IEnumerator
	{
		private iterator;
		private current : any;

		public get Current() {return this.current;}

		constructor(iterator)
		{
			this.iterator = iterator;
			this.current = undefined;
		}

		public moveNext() : bool
		{
			this.current = this.iterator();
			return this.current !== undefined;
		}
	}

	export interface ICollection
	{
		getCount() : number;
	}

	export interface IDictionary extends ICollection
	{
		add(key : any, data : any) : bool;
		//addOrUpdate(key : any, data : any) : bool;
		contains(key : any) : bool;
		lookup(key : any) : any;
		remove(key : any) : any;
		//getAllKeys() : any[];
	}

	/**
	 * Represents a collection of key/value pairs that are organized based on key.
	 * It requires keys to have toString method.
	 */
	export class Dictionary implements IDictionary
	{
		private store = {};
		private count = 0;

		public getCount() : number
		{
			return this.count;
		}

		public add(key : any, data : any) : bool
		{
			var key_str = key.toString();
			if(this.store[key_str]) return false;

			this.store[key_str] = data;
			++this.count;
			return true;
		}

		public contains(key : any) : bool
		{
			var key_str = key.toString();
			return this.store[key_str] !== undefined;
		}

		public lookup(key : any) : any
		{
			var key_str = key.toString();
			return this.store[key_str];
		}

		public remove(key : string) : any
		{
			var key_str = key.toString();
			var tmp = this.store[key_str];
			delete this.store[key_str];
			--this.count;
			return tmp;
		}
	}

	/**
	 * Represents an entry to the HashTable.
	 */
	export class HashEntry
	{
		public next : HashEntry;

		constructor(public key, public data) {}
	}

	export class HashTable implements IDictionary
	{
		private store = new HashEntry[];
		private count : number = 0;

		/**
		 * Gets all keys in the store.
		 */
		public get Keys() {
			var result = [];
			this.store.forEach(function(entry){
				if(entry){
					for(var cur = entry; cur != null; cur = cur.next){
						result.push(cur.key);
					}
				}
			});

			return result;
		}

		constructor(public size : number, public hash_func : (key) => number, public equals_func : (key1, key2) => bool)
		{
			for(var i = 0; i < size; ++i){
				this.store[i] = null;
			}
		}

		public getCount() : number
		{
			return this.count;
		}

		public add(key : any, data : any) : bool
		{
			var new_entry : HashEntry = new HashEntry(key, data);
			var val : number = this.hash_func(key);
			val = val % this.size;

			for(var cur = this.store[val]; cur != null; cur = cur.next){
				if(this.equals_func(key, cur.key))
					return false;
			}

			new_entry.next = this.store[val];
			this.store[val] = new_entry;
			++this.count;
			return true;
		}

		public remove(key : any)
		{
			var val : number = this.hash_func(key);
			val = val % this.size;
			var result = null;
			var prev_entry : HashEntry = null;

			for(var cur = this.store[val]; cur != null; cur = cur.next){
				if(this.equals_func(key, cur.key)){
					result = cur.data;
					--this.count;
					if(prev_entry)
						prev_entry.next = cur.next;
					else
						this.store[val] = cur.next;

					break;
				}

				prev_entry = cur;
			}

			return result;
		}

		public lookup(key : any)
		{
			var val : number = this.hash_func(key);
			val = val % this.size;

			for(var cur = this.store[val]; cur != null; cur = cur.next){
				if(this.equals_func(key, cur.key))
					return cur.data;
			}

			return undefined;
		}

		public contains(key : any) : bool
		{
			var val : number = this.hash_func(key);
			val = val % this.size;

			for(var cur = this.store[val]; cur != null; cur = cur.next){
				if(this.equals_func(key, cur.key))
					return true;
			}

			return false;
		}

		/**
		 * Finds a key whose data is equal to the specified one.
		 */
		public findKey(data : any) : any
		{
			var result;
			this.store.every(function(entry){
				if(entry){
					for(var cur = entry; cur != null; cur = cur.next){
						if(data == cur.data){
							result = cur.key;
							return false;
						}
					}
				}
				return true;
			});

			return result;
		}
	}

	export interface IList extends ICollection, IEnumerable
	{
		add(elem);
		each(fn : (elem : any, index? : number, arry? : any[]) => void);
		get(index : number);
		update(index : number, newElem : any);
		remove(elem);
		removeAt(index : number);
	}

	export class List implements IList
	{
		private contents : any[];

		/**
		 * Constructs a new list object. It can take an enumarator, array or undefined as the argument.
		 */
		constructor(args?)
		{
			if(args instanceof Common.Enumerator){
				this.contents = [];
				while(args.moveNext()){
					this.contents.push(args.Current);
				}
			}else if(args instanceof Array){
				this.contents = args;
			}else{
				this.contents = [];
			}
		}

		public add(elem)
		{
			this.contents.push(elem);
		}

		public each(fn : (elem : any, index? : number, arry? : any[]) => void)
		{
			this.contents.forEach(fn);
		}

		public get(index : number)
		{
			return this.contents[index];
		}

		public update(index : number, newElem : any)
		{
			if(index < 0 || index >= this.contents.length)
				throw new RangeError("The index is out of bounds!");

			this.contents[index] = newElem;
		}

		public remove(elem)
		{
			var index = this.contents.indexOf(elem);
			if(index != -1)
				return this.contents.splice(index, 1);
		}

		public removeAt(index : number)
		{
			return this.contents.splice(index, 1);
		}

		public getCount() : number
		{
			return this.contents.length;
		}

		public getEnumerator() : Common.Enumerator
		{
			var cur_pos = 0;
			return new Common.Enumerator(() => {
				if(cur_pos < this.contents.length){
					return this.contents[cur_pos++];
				}
			});
		}
	}

	export class StringReader implements IEnumerable
	{
		private buffer : string;

		constructor(buffer : string)
		{
			this.buffer = buffer;
		}

		public getEnumerator() : Enumerator
		{
			var lines = this.buffer.split(/\n/);
			var cur_pos = 0;
			return new Enumerator(() => {
				if(cur_pos < lines.length){
					return lines[cur_pos++];
				}else{
					return undefined;
				}
			});
		}
	}

	/**
	 * Advances an enumerator a cetain times.
	 */
	export function take(count : number, er : Common.Enumerator) : Common.Enumerator
    {
        var i = 0;
        return new Common.Enumerator(() => {
            if(i < count && er.moveNext()){
                ++i;
                return er.Current;
            }
        });
    }

    /**
     * Advances an enumerator to the end.
     */
    export function takeAll(er : Common.Enumerator) : Common.Enumerator
    {
    	return new Common.Enumerator(() => {
    		if(er.moveNext()) return er.Current;
    	});
    }
}