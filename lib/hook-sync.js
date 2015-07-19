'use strict';
const debug = require('debug')('espectro:hooks');

module.exports = HookState;

function HookState(hooks, receiver, state, args) {
  const self = this;

  if (!(self instanceof HookState)) {
    return new HookState(hooks, receiver, state, args);
  }

  self._hooks    = hooks;
  self.state     = state;
  self._receiver = receiver;
  // arguments (for pre) and return values (for post) hooks; threaded
  // through
  self._state    = args;
  // book-keeping fields used to ensure hooks always call next(ok)/fail
  self._last     = { token: undefined, cur: 0 };
  self._tokens   = { ok: Symbol('ok'), fail: Symbol('fail'), end: Symbol('end') };
}

HookState.prototype._run = function () {
  const self = this;

  // Call first pre hook, which calls all the other pre hooks
  self._runChain('pre');

  if (self._last.token !== self._tokens.end) {
    // Call underlying function, catch any exceptions
    try {
      self._state = [null, self._hooks.func.apply(self._receiver, self._state)];
    } catch (e) {
      self._state = [e, null];
    }
  }

  // Call the first post hooks, which calls the rest
  self._runChain('post');

  // If return value is exception, throw it. Otherwsie return value
  if (self._state[0] !== null) {
    throw self._state[0];
  }
  return self._state[1];
};

HookState.prototype._runChain = function (which) {
  const self = this;
  if (self._hooks[which].length > 0) {
    // set the cchain to the pre/post list and reset last tracker
    self._chain = { list: self._hooks[which], cur: 0 };
    self._last  = { token : undefined, cur : 0 };

    try {
      // apply hook
      self._chain.list[0].callback.apply(self, self._state);
    } catch (e) {
      // if hook throw exception via fail (and thus token was set)
      // rethrow
      if (self._last.token === self._tokens.fail) {
        throw e;
      }
      // Location of hook being called, used for error reporing
      const hookLoc = self._hooks[which][self._last.cur].location; 
      debug('Hook threw exception %s without calling fail:\n%s', e, hookLoc);
      // otherise notify user thatthe  hook threw the exception manually
      throw new Error(`Hook (${hookLoc}) threw ${e}. Must call fail to terminate hook chain.`);
    }

    // check to make sure that hook finished with next (and thus set
    // the token and index counter) or end
    if ((self._last.token !== self._tokens.end) &&
       ((self._last.token !== self._tokens.ok) ||
        (self._last.cur !== self._hooks[which].length - 1))) {
      const hookLoc = self._hooks[which][Math.max(0, self._last.cur-1)].location; 
      debug('Hook didn\'t call next, end, or fail:\n%s', hookLoc);
      throw new Error(`Hook (${hookLoc}) should call next or fail once.`);
    }
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
};

HookState.prototype.fail = function (e) {
  let self = this;

  self._last.token = self._tokens.fail;

  throw e;
};
