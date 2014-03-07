'use strict';

module.exports = null;

var errHandler = require('err-handler');

require('express').application.crud = function(route, resource){
  if(!(resource instanceof Object))throw new Error('expected resource Object');

  if(resource.create){
    this.post('/'+route, postHandler.bind(null, resource));
  }

  if(resource.delete){
    this.delete('/'+route+'/:id', deleteHandler.bind(null, resource));
  }

  if(resource.read){
    this.get('/'+route, getHandler.bind(null, resource));
    this.get('/'+route+'/:id', getByIdHandler.bind(null, resource));
  }

  if(resource.update){
    this.put('/'+route+'/:id', putHandler.bind(null, resource));
  }
};

function deleteHandler(resource, req, res, next){
  resource.delete(req.params.id, errHandler(next, function(){
    res.send(204);
  }));
}

function getHandler(resource, req, res, next){
  resource.read(req.query, errHandler(next, function(resource){
    res.json(
      (Array.isArray(resource) ? !!resource.length : !!resource)
      ? 200
      : 404,
      resource
    );
  }));
}

function getByIdHandler(resource, req, res, next){
  resource.read(req.params.id, req.query, errHandler(next, function(resource){
    res.json(resource ? 200 : 404, resource);
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