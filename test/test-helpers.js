'use strict';

module.exports = {
  getRoute: function(route, args){
    var routeHandler = null;
    args.forEach(function(arg){
      if(arg[0] === route && !routeHandler)routeHandler = arg[1];
    });
    return routeHandler;
  }
};
