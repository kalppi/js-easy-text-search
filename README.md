## Install

### From GitHub
```sh
npm install git+https://github.com/kalppi/js-easy-text-search.git
```

## Documentation

### Init
```js
const EasyTextSearch = require('js-easy-text-search'),
const search = new EasyTextSearch({ /* options */ });
```
## Configuration

### Default options

```js
{
  minLength: 3,
  caseSensitive: false,
  field: 'text',
  wildPrefix: false,
  wildSuffix: false
}
```
### Options explained

Option | Explanation
-------|------------
``minLength`` | minimum length for a word that can be searched
``caseSensitive`` | are words case sensitive
``field`` | which object field is searched
``wildPrefix`` | are wildcard prefix searches allowed (``*word``)
``wildSuffix`` | are wildcard suffix searches allowed (``key*``)

Wildcard searches can be combined, i.e. ``*inch*`` matches words like ``pinch`` and ``pinching``.

:exclamation: Wildcard searches use lots of memory, so only allow them if necessary.

## Usage

### add(`document`) / add([`documents`])

Each added document should have an unique id.

```js
search.add({
  id: 1,
  value: 100,
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
});

search.add([{
  id: 2,
  value: 200,
  text: 'Nam dolor elit, convallis ac lacinia id, rhoncus ut magna. Maecenas imperdiet auctor justo a tempor. Duis imperdiet sollicitudin velit eget maximus.'
}, {
   id: 3,
   value: 300,
   text: 'Donec convallis erat dolor, volutpat venenatis eros finibus sit amet.'
}, {
   id: 4,
   value: 400,
   text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin dignissim augue diam.'
}]);
```
### search(`searchString`) / search(`searchString`, `{options}`)

You can search documents containing multiple search words using `+` operator, or exclude documents containing certain words
with `-` operator.

```js
console.log(search.search('dolor+amet-proin'));
```
```bash
[ { id: 1,
    value: 100,
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
  { id: 3,
    value: 300,
    text: 'Donec convallis erat dolor, volutpat venenatis eros finibus sit amet.' } ]
```

#### Search options
Option | Explanation
-------|------------
``filter`` | Function to filter search results
``sort`` | Function to sort search results
``limit`` | How many results to return at maximum

```js
console.log(search.search('dolor', {
  filter: doc => {
    return doc.value >= 200;
  },
  sort: (a, b) => {
    return b.value - a.value;
  },
  limit: 2
}));
```
```bash
[ { id: 4,
    value: 400,
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin dignissim augue diam.' },
  { id: 3,
    value: 300,
    text: 'Donec convallis erat dolor, volutpat venenatis eros finibus sit amet.' } ]
```

## saveSync(`file`)
Saves the search options and data to a file as json.
```js
search.saveSync('search.json');
```

## loadSync(`file`)
Loads the search options and data from a file.
```js
const search = EasyTextSearch.loadSync('search.json');
```
