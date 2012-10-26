module Common
{
	export interface IEnumerable
	{
		getEnumerator() : Enumerator;
	}

	interface IEnumerator
	{
		moveNext() : bool;
	}

	export class Enumerator implements IEnumerator
	{
		private iterator;
		private current : any;

		public get Current() {return this.current;}

		constructor(iterator)
		{
			this.iterator = iterator;
			this.current = null;
		}

		public moveNext() : bool
		{
			this.current = this.iterator();
			return this.current != null;
		}
	}

	export interface Hashable
	{
		getHashCode() : number;
	}

	export interface IDictionary
	{
		add(key : any, data : any) : bool;
		//addOrUpdate(key : any, data : any) : bool;
		contains(key : any) : bool;
		lookup(key : any) : any;
		remove(key : any) : any;
		//getAllKeys() : any[];
	}

	export class StringDictionary implements IDictionary
	{
		private store = {};
		private count = 0;

		public get Count() : number {return this.count;}

		public add(key : string, data : any) : bool
		{
			if(this.store[key]) return false;

			this.store[key] = data;
			++this.count;
			return true;
		}

		public addOrUpdate(key : string, data : any) : bool
		{
			if(!this.store[key]) ++this.count;

			this.store[key] = data;
			return true;
		}

		public contains(key : string) : bool
		{
			return this.store[key] !== undefined;
		}

		public lookup(key : string) : any
		{
			return this.store[key];
		}

		public remove(key : string) : any
		{
			delete this.store[key];
			--this.count;
			return null;
		}

		public getAllKeys() : string[]
		{
			var keys = [];
			for(var key in this.store){
				if(this.store.hasOwnProperty(key)) keys.push(key);
			}
			return keys;
		}
	}

	export class HashEntry
	{
		public next : HashEntry;

		constructor(public key, public data) {}
	}

	export class HashTable implements IDictionary
	{
		private store = new HashEntry[];
		private count : number = 0;

		public get Count() : number {return this.count;}

		constructor(public size : number, public hash_func : (key) => number, public equals_func : (key1, key2) => bool)
		{
			for(var i = 0; i < size; ++i){
				this.store[i] = null;
			}
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

			return null;
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
	}
}