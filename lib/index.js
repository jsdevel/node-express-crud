'use strict';

module.exports = null;
var errHandler = require('err-handler');
var async = require('async');

require('express').application.crud = function(route, optionalWare, resource){
  var args = [].slice.call(arguments);
  var middleware = args.filter(byMiddleware);
  route = args.shift();
  resource = args.pop();

  if(typeof route !== 'string')throw new Error('route expected as string');
  if(!(resource instanceof Object))throw new Error('expected resource Object');
  if(route[0] !== '/')route = '/'+route;

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
      [route+'/:id']
      .concat(middleware)
      .concat(deleteHandler.bind(null, resource))
    );
  }

  if(resource.read){
    this.get.apply(
      this,
      [route]
      .concat(middleware)
      .concat(getHandler.bind(null, resource))
    );
    this.get.apply(
      this,
      [route+'/:id']
      .concat(middleware)
      .concat(getByIdHandler.bind(null, resource))
    );
  }

  if(resource.update){
    this.put.apply(
      this,
      [route+'/:id']
      .concat(middleware)
      .concat(putHandler.bind(null, resource))
    );
  }
};

function deleteHandler(resource, req, res, next){
  var ids = req.params.id.split(',');

  var tasks = ids.map(function(id){
    return resource.delete.bind(null, id);
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

function getByIdHandler(resource, req, res, next){
  var ids = req.params.id.split(',');

  var tasks = ids.map(function(id){
    return resource.read.bind(null, id, null);
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

function putHandler(resource, req, res, next){
  resource.update(req.params.id, req.body, errHandler(next, function(resource){
    res.json(resource ? 200 : 404, resource);
  }));
}

function byMiddleware(proposed){
  return typeof proposed === 'function' && proposed.length === 3;
}
