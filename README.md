# express-crud [![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coveralls Status][coveralls-image]][coveralls-url]
> Easily route a resource's crud methods to express apps!

##Example
Here's a User resource that exposes some CRUD methods:

````javascript
module.exports = {
  create:function(model, cb){},
  delete:function(id, cb){},
  read:function([id,] query, cb){},
  update:function(id, model, cb){}
};
````

Here's how you add the routes to your express app:
````javascript
var app = require('express')();
var User = require('./models/User');

require('express-crud');

app.crud('users', User);
````

Now your express app has the following routes:
````
DELETE /users/:id
GET /users
GET /users/:id
POST /users
PUT /users/:id
````

###With some middleware
````javascript
var authorizeMiddleware = function(req, res, next){//arity matters!
  if(req.query.username !== 'foo')return next(new Error('user not foo!'));
  next();
};
var fooMiddleware = function(req, res, next){next();};

app.crud('users', authorizeMiddleware, fooMiddleware, User);
````

###With any path
````javascript
app.crud('/any/old/path/for/users', User);
````
