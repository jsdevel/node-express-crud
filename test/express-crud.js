'use strict';

describe('express-crud', function() {
  var assert = require('assert');
  var prequire = require('proxyquire').noCallThru();
  var sinon = require('sinon');
  var app = {
    delete: sinon.stub(),
    get: sinon.stub(),
    post: sinon.stub(),
    put: sinon.stub()
  };
  var express = {application: app};
  var module = prequire('../lib/index', {
    'express': express
  });
  var getRoute = require('./test-helpers').getRoute;
  var ResourceStub = {
    create: sinon.stub(),
    delete: sinon.stub(),
    read: sinon.stub(),
    readById: sinon.stub(),
    update: sinon.stub()
  };

  beforeEach(function() {
    app.delete.reset();
    app.get.reset();
    app.post.reset();
    app.put.reset();
    ResourceStub.create.reset();
    ResourceStub.delete.reset();
    ResourceStub.read.reset();
    ResourceStub.update.reset();
  });

  it('has no interface', function() {
    assert.equal(module, null);
  });

  it('adds a crud method to express apps', function() {
    app.crud.should.be.type('function');
  });

  describe('app#crud', function() {
    describe('on a resource with crud methods', function() {

      beforeEach(function(){
        app.crud('blas', ResourceStub);
      });

      it('throws error if resource is not an instance of Object', function() {
        assert.throws(function(){
          app.crud('blas', null);
        });
      });

      it('adds POST routes', function() {
        sinon.assert.calledWith(app.post, '/blas', sinon.match.func);
        sinon.assert.calledOnce(app.post);
      });

      it('adds DELETE routes', function() {
        sinon.assert.calledWith(app.delete, '/blas/:id', sinon.match.func);
        sinon.assert.calledOnce(app.delete);
      });

      it('adds GET routes', function() {
        sinon.assert.calledWith(app.get, '/blas/:id', sinon.match.func);
        sinon.assert.calledWith(app.get, '/blas', sinon.match.func);
        sinon.assert.calledTwice(app.get);
      });

      it('adds PUT routes', function() {
        sinon.assert.calledWith(app.put, '/blas/:id', sinon.match.func);
        sinon.assert.calledOnce(app.put);
      });
    });

    describe('on a resource without crud methods', function() {
      beforeEach(function() {
        app.crud('foo', {});
      });

      it('does not add any routes', function() {
        sinon.assert.notCalled(app.delete);
        sinon.assert.notCalled(app.get);
        sinon.assert.notCalled(app.post);
        sinon.assert.notCalled(app.put);
      });
    });
  });

  describe('routes', function() {
    var next = sinon.stub();
    var req = {
      body: null,
      params: null,
      query: null
    };
    var res = {
      json: sinon.stub(),
      send: sinon.stub()
    };

    beforeEach(function() {
      app.delete.reset();
      app.get.reset();
      app.post.reset();
      app.put.reset();
      next.reset();
      req.body = {};
      req.params = {};
      req.query = {};
      res.json.reset();
      res.send.reset();
      app.crud('resources', ResourceStub);
    });

    describe('DELETE', function() {
      it('calls delete on ResourceStub', function() {
        req.params.id = 8;
        ResourceStub.delete.callsArgWith(1, null);
        getRoute('/resources/:id', app.delete.args)(req, res, next);
        sinon.assert.calledWith(
          ResourceStub.delete,
          8,
          sinon.match.func
        );
        sinon.assert.calledWith(res.send, 204);
      });
    });

    describe('GET', function() {
      describe('query by id', function() {
        it('returns 200 when a resource is found', function() {
          var resource = {};
          req.params.id = 7;
          ResourceStub.read.callsArgWith(2, null, resource);
          getRoute('/resources/:id', app.get.args)(req, res, next);
          sinon.assert.calledWith(
            ResourceStub.read,
            7,
            sinon.match({}),
            sinon.match.func
          );
          sinon.assert.calledWith(
            res.json,
            200,
            resource
          );
        });

        it('returns 404 when a resource is not found', function() {
          req.params.id = 7;
          req.query.foo = 9;
          ResourceStub.read.callsArgWith(2, null, null);
          getRoute('/resources/:id', app.get.args)(req, res, next);
          sinon.assert.calledWith(
            ResourceStub.read,
            7,
            sinon.match({foo: 9}),
            sinon.match.func
          );
          sinon.assert.calledWith(
            res.json,
            404,
            null
          );
        });
      });

      describe('query for all', function() {
        it('returns 200 when resources are found', function() {
          var resources = [{}];
          req.query.foo='asdf';
          ResourceStub.read.callsArgWith(1, null, resources);
          getRoute('/resources', app.get.args)(req, res, next);
          sinon.assert.calledWith(
            ResourceStub.read,
            sinon.match({foo:'asdf'}),
            sinon.match.func
          );
          sinon.assert.calledWith(
            res.json,
            200,
            resources
          );
        });

        it('returns 404 when no resource is found', function() {
          var resources = [];
          req.query.foo='asdf';
          ResourceStub.read.callsArgWith(1, null, resources);
          getRoute('/resources', app.get.args)(req, res, next);
          sinon.assert.calledWith(
            ResourceStub.read,
            sinon.match({foo:'asdf'}),
            sinon.match.func
          );
          sinon.assert.calledWith(
            res.json,
            404,
            resources
          );
        });

        it('returns 404 when resource is null', function() {
          ResourceStub.read.callsArgWith(1, null, null);
          getRoute('/resources', app.get.args)(req, res, next);
          sinon.assert.calledWith(
            ResourceStub.read,
            sinon.match({}),
            sinon.match.func
          );
          sinon.assert.calledWith(
            res.json,
            404,
            null
          );
        });
      });
    });

    describe('POST', function() {
      it('creates a new resource', function() {
        ResourceStub.create.callsArgWith(1, null, 5);
        getRoute('/resources', app.post.args)(req, res, next);
        sinon.assert.calledWith(
          ResourceStub.create,
          sinon.match.object,
          sinon.match.func
        );
        sinon.assert.calledWith(res.json, sinon.match(5));
        sinon.assert.notCalled(next);
      });
    });

    describe('PUT', function() {
      it('returns 200 when resource is found', function() {
        req.params.id=9;
        req.body.foo=6;
        ResourceStub.update.callsArgWith(2, null, 5);
        getRoute('/resources/:id', app.put.args)(req, res, next);
        sinon.assert.calledWith(
          ResourceStub.update,
          9,
          sinon.match({foo:6}),
          sinon.match.func
        );
        sinon.assert.calledWith(res.json, 200, 5);
        sinon.assert.notCalled(next);
      });

      it('returns 404 when no resource is found', function() {
        req.params.id=9;
        req.body.foo=6;
        ResourceStub.update.callsArgWith(2, null, null);
        getRoute('/resources/:id', app.put.args)(req, res, next);
        sinon.assert.calledWith(
          ResourceStub.update,
          9,
          sinon.match({foo:6}),
          sinon.match.func
        );
        sinon.assert.calledWith(res.json, 404, null);
        sinon.assert.notCalled(next);
      });

    });

  });
});
