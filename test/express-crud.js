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
    it('expects the first arg to be type string', function(){
      assert.throws(function(){
        app.crud(null, ResourceStub);
      }, /Error:\sroute\sexpected\sas\sstring/);
    });

    it('does not prefix with / if route has / prefix', function(){
      app.crud('/blas', ResourceStub);
      sinon.assert.calledWith(app.post, '/blas', sinon.match.func);
    });

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

    describe('on a resource with crud methods and a param at the end of the route', function() {
      beforeEach(function(){
        app.crud('blas/:blaId', ResourceStub);
      });

      it('adds POST routes', function() {
        sinon.assert.calledWith(app.post, '/blas', sinon.match.func);
        sinon.assert.calledOnce(app.post);
      });

      it('adds DELETE routes', function() {
        sinon.assert.calledWith(app.delete, '/blas/:blaId', sinon.match.func);
        sinon.assert.calledOnce(app.delete);
      });

      it('adds GET routes', function() {
        sinon.assert.calledWith(app.get, '/blas/:blaId', sinon.match.func);
        sinon.assert.calledWith(app.get, '/blas', sinon.match.func);
        sinon.assert.calledTwice(app.get);
      });

      it('adds PUT routes', function() {
        sinon.assert.calledWith(app.put, '/blas/:blaId', sinon.match.func);
        sinon.assert.calledOnce(app.put);
      });
    });

    describe('with middleware on a resource with crud methods', function(){
      var middleware1;
      var middleware2;
      var randomFn;
      beforeEach(function() {
        middleware1 = function(req, res, next){};
        middleware2 = function(req, res, next){};
        randomFn = function(){};//this should be filtered
        app.crud('foo', randomFn, middleware1, middleware2, ResourceStub);
      });

      it('adds POST routes', function() {
        sinon.assert.calledWith(
          app.post, '/foo', middleware1, middleware2, sinon.match.func
        );
      });

      it('adds DELETE routes', function() {
        sinon.assert.calledWith(
          app.delete, '/foo/:id', middleware1, middleware2, sinon.match.func
        );
      });

      it('adds GET routes', function() {
        sinon.assert.calledWith(
          app.get, '/foo/:id', middleware1, middleware2, sinon.match.func
        );
        sinon.assert.calledWith(
          app.get, '/foo', middleware1, middleware2, sinon.match.func
        );
      });

      it('adds PUT routes', function() {
        sinon.assert.calledWith(
          app.put, '/foo/:id', middleware1, middleware2, sinon.match.func
        );
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
      describe('for a single id' , function() {
        it('deletes one resource', function() {
          req.params.id = '8';
          ResourceStub.delete.callsArgWith(2, null);
          getRoute('/resources/:id', app.delete.args)(req, res, next);
          sinon.assert.calledWith(
            ResourceStub.delete,
            '8',
            sinon.match.object,
            sinon.match.func
            );
          sinon.assert.calledWith(res.send, 204);
        });
      });

      describe('for multiple ids', function() {
        it('deletes multiple resources', function() {
          req.params.id = '8,6,7';
          ResourceStub.delete.callsArgWith(2, null);
          getRoute('/resources/:id', app.delete.args)(req, res, next);
          sinon.assert.calledWith(res.send, 204);

          sinon.assert.calledWith(
            ResourceStub.delete,
            '7',
            sinon.match.object,
            sinon.match.func
            );
          sinon.assert.calledWith(
            ResourceStub.delete,
            '8',
            sinon.match.object,
            sinon.match.func
            );

          sinon.assert.calledWith(
            ResourceStub.delete,
            '6',
            sinon.match.object,
            sinon.match.func
            );
        });
      });
    });

    describe('GET', function() {
      describe('query by id', function() {
        describe('when given a single id', function () {
          it('returns 200 when a resource is found', function() {
            var resource = {};
            req.params.id = '7';
            getRoute('/resources/:id', app.get.args)(req, res, next);
            ResourceStub.read.args[0][2](null, resource);
            sinon.assert.calledWith(
              ResourceStub.read,
              '7',
              null,
              sinon.match.func
              );
            sinon.assert.calledWith(
              res.json,
              200,
              resource
              );
          });

          it('returns 404 when a resource is not found', function() {
            req.params.id = '7';
            req.query.foo = 9;
            getRoute('/resources/:id', app.get.args)(req, res, next);
            ResourceStub.read.args[0][2](null, null);
            sinon.assert.calledWith(
              ResourceStub.read,
              '7',
              null,
              sinon.match.func
              );
            sinon.assert.calledWith(
              res.json,
              404,
              null
              );
          });
        });

        describe('when given multiple ids', function() {
          it('returns 200 when all the resources are found', function(done) {
            req.params.id = '8,6,7';
            var resource1 = {};
            var resource2 = {};
            var resource3 = {};
            getRoute('/resources/:id', app.get.args)(req, res, next);
            ResourceStub.read.args[0][2](null, resource1);
            ResourceStub.read.args[1][2](null, resource2);
            ResourceStub.read.args[2][2](null, resource3);

            setTimeout(function(){
              sinon.assert.calledWith(
                ResourceStub.read,
                '7',
                null,
                sinon.match.func
                );

              sinon.assert.calledWith(
                ResourceStub.read,
                '8',
                null,
                sinon.match.func
                );

              sinon.assert.calledWith(
                ResourceStub.read,
                '6',
                null,
                sinon.match.func
                );
              assert.deepEqual(res.json.args[0], [200, [resource1, resource2, resource3]]);
              done();
            },10);
          });

          it('returns 404 when at least one of the resources is not found', function() {
            req.params.id = '8,6,7';
            ResourceStub.read.callsArgWith(2, null, null);
            getRoute('/resources/:id', app.get.args)(req, res, next);

            sinon.assert.calledWith(
              ResourceStub.read,
              '7',
              null,
              sinon.match.func
              );

            sinon.assert.calledWith(res.json, 404, [null, null, null]);
            sinon.assert.calledWith(
              ResourceStub.read,
              '8',
              null,
              sinon.match.func
              );

            sinon.assert.calledWith(
              ResourceStub.read,
              '6',
              null,
              sinon.match.func
              );
          });
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
        ResourceStub.update.callsArgWith(3, null, 5);
        getRoute('/resources/:id', app.put.args)(req, res, next);
        sinon.assert.calledWith(
          ResourceStub.update,
          9,
          sinon.match.object,
          sinon.match({foo:6}),
          sinon.match.func
        );
        sinon.assert.calledWith(res.json, 200, 5);
        sinon.assert.notCalled(next);
      });

      it('returns 404 when no resource is found', function() {
        req.params.id=9;
        req.body.foo=6;
        ResourceStub.update.callsArgWith(3, null, null);
        getRoute('/resources/:id', app.put.args)(req, res, next);
        sinon.assert.calledWith(
          ResourceStub.update,
          9,
          sinon.match.object,
          sinon.match({foo:6}),
          sinon.match.func
        );
        sinon.assert.calledWith(res.json, 404, null);
        sinon.assert.notCalled(next);
      });
    });
  });
});
