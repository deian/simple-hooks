This is a hooks library that allows you to define functions executed
before and after a given function.

## Synchronous example

### Security policy:

```javascript
var hook = require('simple-hooks');
var fs   = require('fs');

var readFileSync = hook(fs.readFileSync);

readFileSync.pre(function (file, encoding) {
  if (encoding !== 'utf8') {
    this.fail(new Error('We are only supporting utf8 files'));
  } else {
    this.next(file, encoding);
  }
});

readFileSync.post(function (err, res) {
  if (!err && /bye/.test(res)) {
    this.fail(new Error('Contains \'bye\'; not allowed!'));
  } else {
    this.next();
  }
});

console.log(readFileSync('./hello-world', 'utf8'));
```

## Asynchronous example

### Security policy:

```javascript
var hook = require('simple-hooks');
var fs   = require('fs');

var readFile = hook(fs.readFile);

readFile.pre(function (file, encoding) {
  if (encoding !== 'utf8') {
    this.fail(new Error('We are only supporting utf8 files'));
  } else {
    this.next(file, encoding);
  }
});

readFile.post(function (err, res) {
  if (!err && /bye/.test(res)) {
    this.fail(new Error('Contains \'bye\'; not allowed!'));
  } else {
    this.next();
  }
});

readFile('./hello-world', 'utf8', function (err, res) {
  if (err) {
    throw err;
  }
  console.log(res);
});
```
