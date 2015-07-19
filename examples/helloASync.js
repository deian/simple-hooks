var hook = require('../index.js');
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

readFile(__dirname + '/hello-world', 'utf8', function (err, res) {
  if (err) {
    throw err;
  }
  console.log(res);
});
