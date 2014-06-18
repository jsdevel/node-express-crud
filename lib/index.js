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
      res.send(204);
    }));
  }

  async.parallel(tasks, errHandler(next, function(){
    res.send(204);
  }));
}

function getHandler(resource, req, res, next){
  resource.read(req.query, errHandler(next, function(resource){
    res.json(
      (Array.isArray(resource) ?
              (!!resource.length && resource.indexOf(null) === -1) : !!resource)
      ? 200
      : 404,
      resource
    );
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
      res.json(resource ? 200 : 404, resource);
    }));
  }

  async.parallel(tasks, errHandler(next, function(result){
    return res.json(result.indexOf(null) === -1 ? 200 : 404, result);
  }));
}

function postHandler(resource, req, res, next){
  resource.create(req.body, errHandler(next, function(resource){
    res.json(resource);
  }));
}

function putHandler(resource, param, req, res, next){
  var id = req.params[param];
  var query = req.query;
  var body = req.body;

  resource.update(id, query, body, errHandler(next, function(resource){
    res.json(resource ? 200 : 404, resource);
  }));
}

function byMiddleware(proposed){
  return typeof proposed === 'function' && proposed.length === 3;
}
