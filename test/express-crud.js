'use strict';

describe('express-crud', function() {
  var async = require('async');
  var expressCrud = require('..');
  var assert = require('assert');
  var noport = require('noport');
  var express = require('express');
  var request = require('request').defaults({json: true});
  var app;
  var createArgs = [];
  var createResponse;
  var deleteArgs = [];
  var readArgs = [];
  var readResponse;
  var readByIdArgs = [];
  var readByIdResponse;
  var updateArgs = [];
  var updateResponse;
  var endpoint;
  var resourceData = [{}];
  var resource;

  noport.for(function(req, res){
    app.handle(req, res);
  });

  before(function(done){
    noport.get(function(err, server, port){
      endpoint = 'http://localhost:'+port;
      done();
    });
  });

  beforeEach(function(){
    app = express();

    resource = {
      create: function(model, cb){
        createArgs.push(arguments);
        cb(null, createResponse);
      },
      delete: function(id, query, cb){
        deleteArgs.push(arguments);
        cb();
      },
      read: function(query, cb){
        readArgs.push(arguments);
        cb(null, readResponse);
      },
      readById: function(id, query, cb){
        readByIdArgs.push(arguments);
        cb(null, readByIdResponse);
      },
      update: function(id, query, model, cb){
        updateArgs.push(arguments);
        cb(null, updateResponse);
      }
    };

    createArgs.length = 0;
    createResponse = resourceData[0];
    deleteArgs.length = 0;
    readArgs.length = 0;
    readResponse = resourceData;
    readByIdArgs.length = 0;
    readByIdResponse = resourceData[0];
    updateArgs.length = 0;
    updateResponse = resourceData[0];
  });

  it('has no interface', function() {
    assert.equal(expressCrud, null);
  });

  it('adds a crud method to express apps', function() {
    app.crud.should.be.type('function');
  });

  describe('app.crud()', function() {
    it('expects the first arg to be type string', function(){
      assert.throws(function(){
        app.crud(null, resource);
      }, /Error:\sroute\sexpected\sas\sstring/);
    });

    it('expects the second arg to be an object', function(){
      assert.throws(function(){
        app.crud('blas', null);
      }, /Error: expected resource Object/);
    });

    it('should not prefix with / if route has / prefix', function(done){
      app.crud('/blas', resource);
      request.get(endpoint + '/blas', function(err, res, body){
        res.statusCode.should.equal(200);
        done();
      });
    });

    it('should prefix with / if route has no / prefix', function(done){
      app.crud('blas', resource);
      request.get(endpoint + '/blas', function(err, res, body){
        res.statusCode.should.equal(200);
        done();
      });
    });

    it('should default param name to id', function(done){
      app.crud('blas', resource);
      resourceData[0].id = 5;
      request.get(endpoint + '/blas/5', function(err, res, body){
        res.statusCode.should.equal(200);
        done();
      });
    });

    it('should allow the  param name to be configurable', function(done){
      app.crud('blas/:blaId', resource);
      resourceData[0].blaId = 5;
      request.get(endpoint + '/blas/5', function(err, res, body){
        res.statusCode.should.equal(200);
        done();
      });
    });

    it('should allow middleware', function(done){
      var test;
      var middleware = function(req, res, next){test = 5;next();};
      resourceData[0].name = 'fred';
      app.crud('blas', middleware, resource);
      request.get(endpoint + '/blas', function(err, res, body){
        res.statusCode.should.equal(200);
        body[0].name.should.equal('fred');
        test.should.equal(5);
        done();
      });
    });

    it('should route create', function(done){
      app.crud('blas', resource);
      request.post(endpoint + '/blas', function(err, res, body){
        res.statusCode.should.equal(200);
        done();
      });
    });

    it('should not route resource.create when it does not exist', function(done){
      resource.create = null;
      app.crud('blas', resource);
      request.post(endpoint + '/blas', function(err, res, body){
        res.statusCode.should.equal(404);
        done();
      });
    });

    it('should route delete', function(done){
      app.crud('blas', resource);
      request.del(endpoint + '/blas/5', function(err, res, body){
        res.statusCode.should.equal(204);
        done();
      });
    });

    it('should not route resource.delete when it does not exist', function(done){
      resource.delete = null;
      app.crud('blas', resource);
      request.del(endpoint + '/blas/5', function(err, res, body){
        res.statusCode.should.equal(404);
        done();
      });
    });

    it('should handle multiple resource deletions', function(done){
      app.crud('blas', resource);
      request.del(endpoint + '/blas/5,6', function(err, res, body){
        res.statusCode.should.equal(204);
        deleteArgs.length.should.equal(2);
        deleteArgs[0][0].should.equal('5');
        deleteArgs[1][0].should.equal('6');
        done();
      });
    });

    it('should route resource.read', function(done){
      app.crud('blas', resource);
      request.get(endpoint + '/blas', function(err, res, body){
        res.statusCode.should.equal(200);
        done();
      });
    });

    it('should not route resource.read when it does not exist', function(done){
      resource.read = null;
      app.crud('blas', resource);
      request.get(endpoint + '/blas', function(err, res, body){
        res.statusCode.should.equal(404);
        done();
      });
    });

    it('should return 200 when resource.read returns empty Array', function(done){
      readResponse = [];
      app.crud('blas', resource);
      request.get(endpoint + '/blas', function(err, res, body){
        res.statusCode.should.equal(200);
        done();
      });
    });

    it('should return 404 when resource.read returns falsy', function(done){
      readResponse = null;
      app.crud('blas', resource);
      request.get(endpoint + '/blas', function(err, res, body){
        res.statusCode.should.equal(404);
        done();
      });
    });


    it('should route readById', function(done){
      app.crud('blas', resource);
      request.get(endpoint + '/blas/5', function(err, res, body){
        res.statusCode.should.equal(200);
        done();
      });
    });

    it('should not route resource.readById when it does not exist', function(done){
      resource.readById = null;
      app.crud('blas', resource);
      request.get(endpoint + '/blas/5', function(err, res, body){
        res.statusCode.should.equal(404);
        done();
      });
    });

    it('should handle multiple resource.readByIds', function(done){
      app.crud('blas', resource);
      request.get(endpoint + '/blas/6,7,1', function(err, res, body){
        res.statusCode.should.equal(200);
        readByIdArgs.length.should.equal(3);
        readByIdArgs[0][0].should.equal('6');
        readByIdArgs[1][0].should.equal('7');
        readByIdArgs[2][0].should.equal('1');
        done();
      });
    });

    it('should return 404 when resource.readById returns falsy', function(done){
      readByIdResponse = null;
      app.crud('blas', resource);
      request.get(endpoint + '/blas/5', function(err, res, body){
        res.statusCode.should.equal(404);
        done();
      });
    });

    it('should return 404 when resource.readById returns an array with a null value', function(done){
      readByIdResponse = null;
      app.crud('blas', resource);
      request.get(endpoint + '/blas/5,6', function(err, res, body){
        res.statusCode.should.equal(404);
        done();
      });
    });

    it('should route update', function(done){
      app.crud('blas', resource);
      request.put(endpoint + '/blas/5', function(err, res, body){
        res.statusCode.should.equal(200);
        done();
      });
    });

    it('should not route resource.update when it does not exist', function(done){
      resource.update = null;
      app.crud('blas', resource);
      request.put(endpoint + '/blas/5', function(err, res, body){
        res.statusCode.should.equal(404);
        done();
      });
    });

    it('should return 404 when resource.update returns falsy', function(done){
      updateResponse = null;
      app.crud('blas', resource);
      request.put(endpoint + '/blas/5', function(err, res, body){
        res.statusCode.should.equal(404);
        done();
      });
    });

  });
});
