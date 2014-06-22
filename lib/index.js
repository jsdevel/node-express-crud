'use strict';

module.exports = null;
var errHandler = require('err-handler');
var async = require('async');
var paramRegx = /\/:([^\/]+)$/;

require('express').application.crud = function(route, optionalWare, resource){
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
      if(resource)return res.json(200, resource);
      res.json(204, null);
    }));
  }

  async.parallel(tasks, errHandler(next, function(results){
    res.json(200, results);
  }));
}

function getHandler(resource, req, res, next){
  resource.read(req.query, errHandler(next, function(resource){
    if(Array.isArray(resource))res.json(200, resource);
    else res.json(204, null);
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
      if(resource)res.json(200, resource);
      else res.json(204, null);
    }));
  }

  async.parallel(tasks, errHandler(next, function(result){
    res.json(200, result);
  }));
}

function postHandler(resource, req, res, next){
  resource.create(req.query, req.body, errHandler(next, function(resource){
    if(resource)res.json(200, resource);
    else res.json(204, null);
  }));
}

function putHandler(resource, param, req, res, next){
  var id = req.params[param];
  var query = req.query;
  var body = req.body;

  resource.update(id, query, body, errHandler(next, function(resource){
    if(resource)res.json(200, resource);
    else res.json(204, null);
  }));
}

function byMiddleware(proposed){
  return typeof proposed === 'function' && proposed.length === 3;
}
