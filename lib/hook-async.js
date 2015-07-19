'use strict';
const debug = require('debug')('espectro:hooks');

module.exports = HookState;

function HookState(hooks, receiver, state, args, cb) {
  const self = this;

  if (!(self instanceof HookState)) {
    return new HookState(hooks, receiver, state, args, cb);
  }

  self._hooks    = hooks;
  self.state     = state;
  self._receiver = receiver;
  // arguments (for pre) and return values (for post) hooks; threaded
  // through
  self._state    = args;
  self._cb       = cb;
  // book-keeping fields used to ensure hooks always call next(ok)/fail
  self._last     = { token: undefined, cur: 0 };
  self._tokens   = { ok: Symbol('ok'), fail: Symbol('fail'), end: Symbol('end') };
}

HookState.prototype._run = function () {
  const self = this;

  // Call first pre hook, which calls all the other pre hooks
  self._runChain('pre', function () {
    if (self._last.token === self._tokens.end) {
      // don't call function, just run post hooks
      self._runChain('post', function () {
        // ended in end/fail/ok state, call callback
        self._cb.apply(null, self._state);
      });
    } else {
      self._state.push(function () {
        self._state = Array.prototype.slice.call(arguments);
        // Call the first post hooks, which calls the rest
        self._runChain('post', function () {
          // ended in end/fail/ok state, call callback
          self._cb.apply(null, self._state);
        });
      });
      // Call underlying function
      self._hooks.func.apply(self._receiver, self._state);
    }
  });
};

HookState.prototype._runChain = function (which, cb) {
  const self = this;
  if (self._hooks[which].length > 0) {
    // set the cchain to the pre/post list and reset last tracker
    self._chain = { list: self._hooks[which], cur: 0 };
    self._last  = { token : undefined, cur : 0 };

    // apply hook
    try {
      self._chain.list[0].callback.apply(self, self._state);
    } catch (e) {
      // Location of hook being called, used for error reporing
      const hookLoc = self._hooks[which][self._last.cur].location; 
      debug('Hook threw exception %s without calling fail:\n%s', e, hookLoc);
      // otherise notify user thatthe  hook threw the exception manually
      const e2 = new Error(`Hook (${hookLoc}) threw ${e}. Must call fail to terminate hook chain.`);
      return self._cb.apply(null, [e2, null]);
    }
    

    // failed, call callback with error
    if (self._last.token === self._tokens.fail) {
      self._cb.apply(null, self._state);
    } else {
      // check to make sure that hook finished with next (and thus set
      // the token and index counter) or end
      if ((self._last.token !== self._tokens.end) &&
         ((self._last.token !== self._tokens.ok) ||
          (self._last.cur !== self._hooks[which].length - 1))) {
        const hookLoc = self._hooks[which][Math.max(0, self._last.cur-1)].location; 
        debug('Hook didn\'t call next, end, or fail:\n%s', hookLoc);
        const e = new Error(`Hook (${hookLoc}) should call next or fail once.`);
        self._cb.apply(null, [e, null]);
      } else {
        cb();
      }
    }
  } else {
    cb();
  }
};

HookState.prototype.next = function () {
  let self = this;

  if (arguments.length !== 0) {
    self._state = Array.prototype.slice.call(arguments);
  }

  self._last = { token: self._tokens.ok, cur: self._chain.cur };
  self._chain.cur++;
  if (self._chain.cur < self._chain.list.length) {
    self._chain.list[self._chain.cur].callback.apply(self, self._state);
  }
};

HookState.prototype.end = function () {
  let self = this;

  self._last = { token: self._tokens.end, cur: self._chain.cur };
  self._state = Array.prototype.slice.call(arguments);
  // falls into _runChain
};

HookState.prototype.fail = function (e) {
  let self = this;

  self._state = [e, null];
  self._last  = { token: self._tokens.fail, cur: self._chain.cur };
  // falls into _runChain
};
