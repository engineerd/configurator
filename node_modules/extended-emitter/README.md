extended-emitter.js
===================

[![NPM version](https://img.shields.io/npm/v/extended-emitter.svg)]()
[![npm](https://img.shields.io/npm/dt/extended-emitter.svg)]()
[![Travis](https://img.shields.io/travis/khrome/extended-emitter.svg)]()

Everything you expect from `require('events').EventEmitter` in both the browser and client, plus:

- `.allOff()` : removes all events from this emitter
- `.emitter` : the internal emitter used, in case you need direct access.

optional criteria
-----------------
you can now using [mongo-style](https://docs.mongodb.com/manual/reference/operator/query/) queries (supported by [sift](https://www.npmjs.com/package/sift)) to subscribe to specific events (in this context `.once()` means meeting the criteria, not just firing an event of that type).

    emitter.on('my_object_event', {
        myObjectId : object.id
    }, function(){
        //do stuff here
    });
    
or
    
    emitter.once('my_object_event', {
        myObjectId : object.id,
        myObjectValue : {
        	$gt : 20,
        	$lt : 40
        }
    }, function(){
        //do stuff here
    });
    
.when()
-------
    
and there's also the addition of a `when` function which can take ready-style functions, real promises or events, making it easy to delay or wait for a state, without resorting to chaining.

    emitter.when([$(document).ready, 'my-init-event', 'my-load-event'], function(){
    	//do stuff
    });
    
.onto()
-------
Often you want an object to implement emitters, and while it's easy enough to wrap them, why not just have that done for you and avoid the boilerplate?

    emitter.onto(MyClass.prototype);
    emitter.onto(MyInstance);
    emitter.onto(MyObject);
    
or in the constructor:
	
	emitter.onto(this);

Testing
-------

Run the tests at the project root with:

    mocha

Enjoy,

-Abbey Hawk Sparrow