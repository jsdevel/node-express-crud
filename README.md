# express-crud [![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coveralls Status][coveralls-image]][coveralls-url]
> Easily route a resource's crud methods to express apps!

##Example
Here's a User resource that exposes some CRUD methods:

````javascript
module.exports = {
  create:   function(query, model, cb){
  ....
  cb(null, ["create"]); //first argument is response status, second is array of response data
  },
  delete:   function(id, query, cb){},
  read:     function(query, cb){},
  readById: function(id, query, cb){},
  update:   function(id, query, model, cb){}
};
````

Here's how you add the routes to your express app:
````javascript
var app = require('express')();
var User = require('./models/User');

require('express-crud')(app);

app.crud('users', User);
````

Here's how you add the routes to your express app using a formatted response object:
````javascript
var app = require('express')();
var User = require('./models/User');
var opts = {
	formatResponse: function(result) {
		return {
			timestamp: Date.now(),
			payload: result
		};
	}
};

require('express-crud')(app, opts);

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

### Changing the param name
You can change the param name by specifying it at the end of your route:
```javascript
app.crud('users/:userId', User);
```

Now your express app has the following routes:
````
DELETE /users/:userId
GET /users
GET /users/:userId
POST /users
PUT /users/:userId
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

### Restrict access to resources by user
```javascript
app.crud('settings/:settingId', authorizeMiddleware, function(req, res, next){
  //ensure that the resource get's the username.
  req.query.username = req.user.name;
  next();
}, SettingsResource);
```
### Format your response

### With any path
````javascript
app.crud('/any/old/path/for/users', User);
````

## Status Codes
When you call the callback given to resource methods without an error object as the
first arg, `express-crud` will use either `204` or `200` depending on the context.
If you wish to pass a non `2xx` status code up to your application the preferred
way is to assign a `status` property to your `error` object I.E. `cb({status: 404})`.

[downloads-image]: http://img.shields.io/npm/dm/express-crud.svg
[npm-url]: https://npmjs.org/package/express-crud
[npm-image]: http://img.shields.io/npm/v/express-crud.svg

[travis-url]: https://travis-ci.org/jsdevel/node-express-crud
[travis-image]: http://img.shields.io/travis/jsdevel/node-express-crud.svg

[coveralls-url]: https://coveralls.io/r/jsdevel/node-express-crud
[coveralls-image]: http://img.shields.io/coveralls/jsdevel/node-express-crud/master.svg
