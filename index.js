const fs = require('fs');

const INDEX = {
	Word: 0,
	WordFullWild: 1,
	WordPrefixWild: 2,
	WordSuffixWild: 3,
};

class EasyTextSearch {
	constructor(options = null) {
		const defaultOptions = {
			minLength: 3,
			caseSensitive: false,
			field: 'text',
			wildPrefix: false,
			wildSuffix: false
		};

		this.options = Object.assign({}, defaultOptions, options || {});
		this.items = [];
		this.indexes = {};
	}

	static loadSync(file) {
		const load = fs.readFileSync(file);

		let options, dataKeys, data, indexes;

		[options, dataKeys, data, indexes] = JSON.parse(load);

		const items = [];

		for(let d of data) {
			const item = {};
			for(let i = 0; i < d.length; i++) {
				const key = dataKeys[i];
				const val = d[i];

				item[key] = val;
			}

			items.push(item);
		}

		const search = new EasyTextSearch(options);

		search.items = items;
		search.indexes = indexes;

		return search;
	}

	saveSync(file) {
		const dataKeys = Object.keys(this.items[0]);
		const data = [];

		for(let item of this.items) {
			data.push(Object.values(item));
		}

		const save = [
			this.options,
			dataKeys,
			data,
			this.indexes
		];

		fs.writeFileSync(file, JSON.stringify(save));
	}

	add(docs) {
		if(Array.isArray(docs)) {
			for(let doc of docs) {
				this._add(doc);
			}
		} else {
			this._add(docs);
		}
	}

	_add(doc) {
		const id =  this.items.length;

		this.items.push(doc);

		let text = doc[this.options.field].replace(/[^a-zA-Z0-9\- ]/g, '');

		if(!this.options.caseSensitive) {
			text = text.toLowerCase();
		}

		let words = text.split(/ |([0-9]+)\-/);

		words = words.filter(function(elem, pos) {
			return elem !== undefined && words.indexOf(elem) == pos;
		})

		const addIndex = (index, key, value) => {
			if(this.indexes[index] == undefined) {
				this.indexes[index] = {};
			}

			if(this.indexes[index][key] === undefined) {
				this.indexes[index][key] = [];
			}

			this.indexes[index][key].push(value);
		};

		for(let word of words) {
			if(word.length >= this.options.minLength) {
				if(this.options.wildPrefix && this.options.wildSuffix) {
					for(let i = 0; i < word.length; i++) {
						for(let j = word.length; j > i; j--) {
							if(j - i >= this.options.minLength) {
								const value = word.substring(i, j);
								addIndex(INDEX.WordFullWild, value, id);
							}
						}
					}
				}

				if(this.options.wildPrefix) {
					for(let i = word.length; i >= this.options.minLength; i--) {
						const value = word.substring(word.length - i);
						addIndex(INDEX.WordPrefixWild, value, id);
					}
				}

				if(this.options.wildSuffix) {
					for(let i = this.options.minLength; i <= word.length; i++) {
						const value = word.substring(0, i);
						addIndex(INDEX.WordSuffixWild, value, id);
					}
				}

				addIndex(INDEX.Word, word, id);
			}
		}
	}

	search(searchString, options = null) {
		options = options || {};

		if(!this.options.caseSensitive) searchString = searchString.toLowerCase();

		searchString = '+' + searchString.replace(/[^a-zA-Z0-9\+\-*\\]/g, '');
		searchString = searchString.replace(/\\-/g, '#');

		const parts = searchString.split(/(\+|\-)([a-zA-Z*\\#]+)/g).filter(t => { return t.length > 0; });
		const search = [];

		for(let i = 0; i < parts.length; i += 2) {
			let pWild = false,
				sWild = false;
			let term = parts[i],
				word = parts[i + 1].replace(/#/g, '-');

			if(word.charAt(0) == '*') {
				word = word.substring(1);
				pWild = true;
			}

			if(word.slice(-1) == '*') {
				word = word.substring(0, word.length - 1);
				sWild = true;
			}

			search.push({
				term: term,
				word: word,
				pWild: pWild,
				sWild: sWild
			});
		}

		const found = {
			'+': [],
			'-': []
		};

		const getValue = (index, key) => {
			return this.indexes[index][key];
		}

		for(let t of search) {
			let index = INDEX.Word;

			if(this.options.wildPrefix && this.options.wildSuffix && t.pWild && t.sWild) index = INDEX.WordFullWild;
			else if(this.options.wildPrefix && t.pWild) index = INDEX.WordPrefixWild;
			else if(this.options.wildSuffix && t.sWild) index = INDEX.WordSuffixWild;

			const ids = getValue(index, t.word);

			if(ids !== undefined) {
				found[t.term].push(ids);
			} else {
				found[t.term].push([]);
			}
		}

		let ids = found['+'].shift() || [];

		while(found['+'].length > 0) {
			const t = found['+'].shift();

			ids = ids.filter(n => t.includes(n));
		}

		const notFlat = [].concat.apply([], found['-']);
		ids = ids.filter(n => !notFlat.includes(n));

		let docs = [];
		for(let id of ids) {
			docs.push(this.items[id]);
		}

		if(options.filter) {
			docs = docs.filter(options.filter);
		}

		if(options.sort) {
			docs.sort(options.sort);
		}

		if(options.limit) {
			docs = docs.slice(0, options.limit);
		}

		return docs;
	}
}

module.exports = EasyTextSearch;