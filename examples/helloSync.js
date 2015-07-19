var hook = require('../index.js');
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

console.log(readFileSync(__dirname + '/hello-world', 'utf8'));
