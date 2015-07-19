/* jshint mocha: true */
'use strict';
const hook   = require('../index.js');
const chai   = require('chai');
const expect = chai.expect;
const sinon  = require('sinon');
chai.use(require('dirty-chai'));
chai.use(require('sinon-chai'));

describe('synchronous hook: pre', function () {
  const f = function () { return 42; };

  it('should call hooks with correct arguments', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.next(4, 5, 6); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.pre(hook1);
    f_.pre(hook2);
    f_.pre(hook3);
    expect(f_(1, 2, 3)).to.equal(42);
    expect(hook1).to.have.been.calledWith(1, 2, 3).and.calledOnce();
    expect(hook2).to.have.been.calledWith(1, 2, 3).and.calledOnce();
    expect(hook3).to.have.been.calledWith(4, 5, 6).and.calledOnce();
    done();
  });

  it('exception in hook should fail', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { throw 'fail'; });
    f_.pre(hook1);
    try {
      f_();
    } catch (e) {
      expect(e.message).to.match(/Must call fail to terminate/);
    }
    expect(hook1).to.have.been.calledOnce();
    done();
  });

  it('end (result) should skip hooks', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.end(null, 43); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.pre(hook1);
    f_.pre(hook2);
    f_.pre(hook3);
    expect(f_(1, 2, 3)).to.equal(43);
    expect(hook1).to.have.been.calledOnce();
    expect(hook2).to.have.been.calledOnce();
    expect(hook3).to.not.have.been.called();
    done();
  });

  it('end (exception) should skip hooks', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.end('fail'); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.pre(hook1);
    f_.pre(hook2);
    f_.pre(hook3);
    try {
      f_(1, 2, 3);
    } catch (e) {
      expect(e).to.equal('fail');
    }
    expect(hook1).to.have.been.calledOnce();
    expect(hook2).to.have.been.calledOnce();
    expect(hook3).to.not.have.been.called();
    done();
  });

  it('fail should skip hooks', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.fail('fail'); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.pre(hook1);
    f_.pre(hook2);
    f_.pre(hook3);
    try {
      f_(1, 2, 3);
    } catch (e) {
      expect(e).to.equal('fail');
    }
    expect(hook1).to.have.been.calledOnce();
    expect(hook2).to.have.been.calledOnce();
    expect(hook3).to.not.have.been.called();
    done();
  });

  it('should always call next or fail', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.pre(hook1);
    f_.pre(hook2);
    f_.pre(hook3);
    try {
      f_();
    } catch (e) {
      expect(e.message).to.match(/should call next or fail/);
    }
    expect(hook1).to.have.been.calledOnce();
    expect(hook2).to.have.been.calledOnce();
    expect(hook3).to.not.have.been.called();
    done();
  });

  it('should call next or fail only once (two next)', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.next(); this.next(); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.pre(hook1);
    f_.pre(hook2);
    f_.pre(hook3);
    try {
      f_();
    } catch (e) {
      expect(e.message).to.match(/should call next or fail/);
    }
    expect(hook1).to.have.been.calledOnce();
    expect(hook2).to.have.been.calledOnce();
    expect(hook3).to.have.been.calledOnce();
    done();
  });

  it('fail after next should fail', function (done) {
    // XXX this is temporary; we may want to not allow fail after next
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.next(); this.fail('fail'); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.pre(hook1);
    f_.pre(hook2);
    f_.pre(hook3);
    try {
      f_();
    } catch (e) {
      expect(e).to.equal('fail');
    }
    expect(hook1).to.have.been.calledOnce();
    expect(hook2).to.have.been.calledOnce();
    expect(hook3).to.have.been.calledOnce();
    done();
  });
});

describe('synchronous hook: post', function () {
  const f = function () { return 42; };

  it('should call hooks with correct result', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.next(null, 43); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.post(hook1);
    f_.post(hook2);
    f_.post(hook3);
    expect(f_()).to.equal(43);
    expect(hook1).to.have.been.calledWith(null, 42).and.calledOnce();
    expect(hook2).to.have.been.calledWith(null, 42).and.calledOnce();
    expect(hook3).to.have.been.calledWith(null, 43).and.calledOnce();
    done();
  });

  it('should call hooks with correct result (exception)', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.next('fail', 43); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.post(hook1);
    f_.post(hook2);
    f_.post(hook3);
    try {
      f_();
    } catch (e) {
      expect(e).to.equal('fail');
    }
    expect(hook1).to.have.been.calledWith(null, 42).and.calledOnce();
    expect(hook2).to.have.been.calledWith(null, 42).and.calledOnce();
    expect(hook3).to.have.been.calledWith('fail', 43).and.calledOnce();
    done();
  });

  it('should call hooks with exception', function (done) {
    const f_ = hook(function () { throw 'fail'; });
    const hook1 = sinon.spy(function () { this.next(null, 42); });
    f_.post(hook1);
    expect(f_()).to.equal(42);
    expect(hook1).to.have.been.calledWith('fail', null).and.calledOnce();
    done();
  });

  it('exception in hook should fail', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { throw 'fail'; });
    f_.pre(hook1);
    try {
      f_();
    } catch (e) {
      expect(e.message).to.match(/Must call fail to terminate/);
    }
    expect(hook1).to.have.been.calledOnce();
    done();
  });

  it('exception in hook should fail', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { throw 'fail'; });
    f_.post(hook1);
    try {
      f_();
    } catch (e) {
      expect(e.message).to.match(/Must call fail to terminate/);
    }
    expect(hook1).to.have.been.calledOnce();
    done();
  });

  it('end (result) should skip hooks', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.end(null, 43); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.post(hook1);
    f_.post(hook2);
    f_.post(hook3);
    expect(f_(1, 2, 3)).to.equal(43);
    expect(hook1).to.have.been.calledOnce();
    expect(hook2).to.have.been.calledOnce();
    expect(hook3).to.not.have.been.called();
    done();
  });

  it('end (exception) should skip hooks', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.end('fail'); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.post(hook1);
    f_.post(hook2);
    f_.post(hook3);
    try {
      f_(1, 2, 3);
    } catch (e) {
      expect(e).to.equal('fail');
    }
    expect(hook1).to.have.been.calledOnce();
    expect(hook2).to.have.been.calledOnce();
    expect(hook3).to.not.have.been.called();
    done();
  });

  it('fail should skip hooks', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.fail('fail'); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.post(hook1);
    f_.post(hook2);
    f_.post(hook3);
    try {
      f_(1, 2, 3);
    } catch (e) {
      expect(e).to.equal('fail');
    }
    expect(hook1).to.have.been.calledOnce();
    expect(hook2).to.have.been.calledOnce();
    expect(hook3).to.not.have.been.called();
    done();
  });

  it('should always call next or fail', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.post(hook1);
    f_.post(hook2);
    f_.post(hook3);
    try {
      f_();
    } catch (e) {
      expect(e.message).to.match(/should call next or fail/);
    }
    expect(hook1).to.have.been.calledOnce();
    expect(hook2).to.have.been.calledOnce();
    expect(hook3).to.not.have.been.called();
    done();
  });

  it('should call next or fail only once', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.next(); this.next(); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.post(hook1);
    f_.post(hook2);
    f_.post(hook3);
    try {
      f_();
    } catch (e) {
      expect(e.message).to.match(/should call next or fail/);
    }
    expect(hook1).to.have.been.calledOnce();
    expect(hook2).to.have.been.calledOnce();
    expect(hook3).to.have.been.calledOnce();
    done();
  });

  it('fail after next should fail', function (done) {
    // XXX this is temporary; we may want to not allow fail after next
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.next(); this.fail('fail'); });
    const hook3 = sinon.spy(function () { this.next(); });
    f_.post(hook1);
    f_.post(hook2);
    f_.post(hook3);
    try {
      f_();
    } catch (e) {
      expect(e).to.equal('fail');
    }
    expect(hook1).to.have.been.calledOnce();
    expect(hook2).to.have.been.calledOnce();
    expect(hook3).to.have.been.calledOnce();
    done();
  });
});

describe('synchronous: redefine function', function () {
  const f = function () { throw 'fail'; };

  it('should call hooks with correct arguments', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    f_.pre(hook1);
    f_.redefine(function () { return 42; });
    expect(f_(1, 2, 3)).to.equal(42);
    expect(hook1).to.have.been.calledWith(1, 2, 3).and.calledOnce();
    done();
  });
});

describe('synchronous: replace function', function () {
  const f = function (x, y, z) { return x + y * z; };

  it('should call hooks with correct arguments', function (done) {
    const f_ = hook(f);
    const hook1 = sinon.spy(function () { this.next(); });
    f_.pre(hook1);
    f_.replace(function (original) {
      return function (x, y, z) {
        return 42 + original(x, y, z);
      };
    });
    expect(f_(1, 2, 3)).to.equal(49);
    expect(hook1).to.have.been.calledWith(1, 2, 3).and.calledOnce();
    done();
  });
});

describe('synchronous: state', function () {
  const f = function () { return 42; };

  it('should modify state', function (done) {
    const f_ = hook(f);
    f_.state.prop = 1336;
    const hook1 = sinon.spy(function () {
      expect(this.state.prop).to.equal(1336);
      this.end(null, this.state.prop++);
    });
    f_.pre(hook1);
    expect(f_()).to.equal(1336);
    expect(f_.state.prop).to.equal(1337);
    expect(hook1).to.have.been.calledOnce();
    done();
  });
});

describe('synchronous hooks on methods', function () {
  function Obj() { this.val = 42;}
  const f = function () { return this.val; };

  it('should call pre hooks', function (done) {
    Obj.prototype.f = hook(f);
    const obj = new Obj();
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.next(4, 5, 6); });
    const hook3 = sinon.spy(function () { this.next(); });
    obj.f.pre(hook1);
    obj.f.pre(hook2);
    obj.f.pre(hook3);
    expect(obj.f(1, 2, 3)).to.equal(42);
    expect(hook1).to.have.been.calledWith(1, 2, 3).and.calledOnce();
    expect(hook2).to.have.been.calledWith(1, 2, 3).and.calledOnce();
    expect(hook3).to.have.been.calledWith(4, 5, 6).and.calledOnce();
    done();
  });

  it('should call post hooks', function (done) {
    Obj.prototype.f = hook(f);
    const obj = new Obj();
    const hook1 = sinon.spy(function () { this.next(); });
    const hook2 = sinon.spy(function () { this.next(null, 43); });
    const hook3 = sinon.spy(function () { this.next(); });
    obj.f.post(hook1);
    obj.f.post(hook2);
    obj.f.post(hook3);
    expect(obj.f()).to.equal(43);
    expect(hook1).to.have.been.calledWith(null, 42).and.calledOnce();
    expect(hook2).to.have.been.calledWith(null, 42).and.calledOnce();
    expect(hook3).to.have.been.calledWith(null, 43).and.calledOnce();
    done();
  });
});
