array-events.js
===============

Is an Array extension class which adds asynchronous functions to Array as well as firing events on 'remove', 'add' or 'change'

    var EventedArray = require('array-events');
    var myArray = new EventedArray();

events
------

*change* : fired any time an element is added or removed

*add* : fired any time an element is added

*remove* : fired any time an element is removed 

emitter functions
-----------------

EventedArrays are also [Emitters](http://docs.nodejitsu.com/articles/getting-started/control-flow/what-are-event-emitters) but have an expanded syntax from [extended-emitter](https://github.com/khrome/extended-emitter) and the additional `.when()` call.

    myArray.on('change', function(event){ });
    myArray.once('change', function(event){ });
    myArray.off('change', function(event){ });
    myArray.emit('change'[, arguments]);

async functions
---------------

forEachEmission : execute serially

    myArray.forEachEmission(function(item, index, done){
        somethingAsynchronous(function(){
            done();
        });
    }, function(){
        //we're all done!
    });
    
forAllEmissions : execute all jobs in parallel

    myArray.forAllEmissions(function(item, index, done){
        somethingAsynchronous(function(){
            done();
        });
    }, function(){
        //we're all done!
    });
    
forAllEmissionsInPool : execute all jobs in parallel up to a maximum #, then queue for later

    myArray.forAllEmissionsInPool(poolSize, function(item, index, done){
        somethingAsynchronous(function(){
            done();
        });
    }, function(){
        //we're all done!
    });
    
utility functions
-----------------

contains : does the array contain this element?

    new EventedArray(['dog', 'cat', 'mouse']).contains('cat') //returns true;
    
combine : generate a new array that is the union of the provided arrays

    new EventedArray(['dog', 'cat']).combine(['mouse']) //returns a new array  ['dog', 'cat', 'mouse'];
    
erase : generate a new array without the member provided
    
    new EventedArray(['dog', 'cat', 'mouse']).erase('cat') //returns a new array ['dog', 'mouse'];
    
EventedArray.is : is the provided object an instance of EventedArray

    EventedArray.is(new EventedArray()); //returns true
    EventedArray.is([]) //returns false
    

Testing
-------
just run
    
    mocha

Enjoy,

-Abbey Hawk Sparrow