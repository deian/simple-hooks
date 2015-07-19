'use strict';
const util = require('util');

const HookSyncState  = require('./lib/hook-sync.js');
const HookASyncState = require('./lib/hook-async.js');


module.exports = hook;

function hook(func, _isAsync) {
  const hooks = { pre : [], post : [], func: func };
  const st    = {}; // underlying state


  const hookedFunc = function () {
    const receiver = this;
    // if flag is set then use that, otherwise infer
    const isAsync  = (typeof _isAsync === 'boolean') ? _isAsync
                   : util.isFunction(arguments[arguments.length - 1]);

    if (!isAsync) {
      const state = new HookSyncState(hooks, receiver, st,
                                      Array.prototype.slice.call(arguments));
      return state._run();
    } else {
      const state = new HookASyncState(hooks, receiver, st,
                Array.prototype.slice.call(arguments, 0, arguments.length - 1),
                arguments[arguments.length - 1]);
      return state._run();
    }
  };

  hookedFunc.state = st;

  hookedFunc.pre = function (cb) {
    return hooks.pre.push({ callback: cb, location: _lastLocation() });
  };

  hookedFunc.post = function (cb) {
    return hooks.post.push({ callback: cb, location: _lastLocation() });
  };

  hookedFunc.redefine = function (f) {
    hooks.func = f;
  };

  hookedFunc.replace = function (f) {
    hooks.func = f(hooks.func);
  };

  // TODO(ds) Object.freeze(hookedFunc);
  return hookedFunc;
}

hook.sync  = function (func) { return hook(func, false); };
hook.async = function (func) { return hook(func, true); };

// Get last stack location
function _lastLocation() {
  let loc = (new Error()).stack.split('\n')[3].match(/\(.*\)$/)[0];
  return loc.substr(1, loc.length - 2);
}
