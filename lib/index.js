'use strict';

var errHandler = require('err-handler');
var async = require('async');
var paramRegx = /\/:([^\/]+)$/;
var identity = function(self) {
  return self;
};

module.exports = function(application, options) {
  options = options || {};

  var formatResponse = options.formatResponse || identity;

  application.crud = function(route, optionalWare, resource){
    var args = [].slice.call(arguments);
    route = args.shift();
    resource = args.pop();
    var middleware = args.filter(byMiddleware);
    var param = '/:id';
    var paramName = 'id';
    var paramMatch = paramRegx.exec(route);


    if(typeof route !== 'string')throw new Error('route expected as string');
    if(!(resource instanceof Object))throw new Error('expected resource Object');
    if(route[0] !== '/')route = '/'+route;
    if(paramMatch){
      param = paramMatch[0];
      paramName = paramMatch[1];
      route = route.replace(paramRegx, '');
    }

    if(resource.create){
      this.post.apply(
        this,
        [route]
        .concat(middleware)
        .concat([postHandler.bind(null, resource)])
      );
    }

    if(resource.delete){
      this.delete.apply(
        this,
        [route + param]
        .concat(middleware)
        .concat(deleteHandler.bind(null, resource, paramName))
      );
    }

    if(resource.read){
      this.get.apply(
        this,
        [route]
        .concat(middleware)
        .concat(getHandler.bind(null, resource))
      );
    }

    if(resource.readById){
      this.get.apply(
        this,
        [route + param]
        .concat(middleware)
        .concat(getByIdHandler.bind(null, resource, paramName))
      );
    }

    if(resource.update){
      this.put.apply(
        this,
        [route + param]
        .concat(middleware)
        .concat(putHandler.bind(null, resource, paramName))
      );
    }
  };

  function deleteHandler(resource, param, req, res, next){
    var ids = req.params[param].split(',');
    var query = req.query;

    var tasks = ids.map(function(id){
      return resource.delete.bind(null, id, query);
    });

    if(tasks.length === 1) {
      return tasks[0](errHandler(next, function(resource){
        if(resource)return res.status(200).json(formatResponse(resource));
        res.status(204).json(null);
      }));
    }

    async.parallel(tasks, errHandler(next, function(results){
      res.status(200).json(formatResponse(results));
    }));
  }

  function getHandler(resource, req, res, next){
    resource.read(req.query, errHandler(next, function(resource){
      if(Array.isArray(resource))res.status(200).json(formatResponse(resource));
      else res.status(204).json(null);
    }));
  }

  function getByIdHandler(resource, param, req, res, next){
    var ids = req.params[param].split(',');
    var query = req.query;

    var tasks = ids.map(function(id){
      return resource.readById.bind(null, id, query);
    });

    if(tasks.length === 1){
      return tasks[0](errHandler(next, function(resource){
        if(resource)res.status(200).json(formatResponse(resource));
        else res.status(204).json(null);
      }));
    }

    async.parallel(tasks, errHandler(next, function(result){
      res.status(200).json(formatResponse(result));
    }));
  }

  function postHandler(resource, req, res, next){
    resource.create(req.query, req.body, errHandler(next, function(resource){
      if(resource)res.status(200).json(formatResponse(resource));
      else res.status(204).json(null);
    }));
  }

  function putHandler(resource, param, req, res, next){
    var id = req.params[param];
    var query = req.query;
    var body = req.body;

    resource.update(id, query, body, errHandler(next, function(resource){
      if(resource)res.status(200).json(formatResponse(resource));
      else res.status(204).json(null);
    }));
  }

  function byMiddleware(proposed){
    return typeof proposed === 'function' && proposed.length === 3;
  }

  return application;
};