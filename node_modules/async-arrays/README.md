async-arrays.js
===============

[![NPM version](https://img.shields.io/npm/v/async-arrays.svg)]()
[![npm](https://img.shields.io/npm/dt/async-arrays.svg)]()
[![Travis](https://img.shields.io/travis/khrome/async-arrays.svg)]()

This used to be an array-oriented flow control library. While it still is, [async]() does it better.

Now it's just something to use when I want something more lightweight. YMMV

Usage
-----
I find, most of the time, my asynchronous logic emerges from an array and I really just want to be able to control the completion of some job, and have a signal for all jobs. In many instances, this winds up being more versatile than a promise which limits you to a binary state and only groups returns according to it's state. 

you can either retain an instance and use it that way:

    var arrays = require('async-arrays');
    arrays.forEach(array, iterator, calback);
    

`arrays.forEach` : execute serially

    arrays.forEach(array, function(item, index, done){
        somethingAsynchronous(function(){
            done();
        });
    }, function(){
        //we're all done!
    });
    
`arrays.forAll` : execute all jobs in parallel

    arrays.forAll(array, function(item, index, done){
        somethingAsynchronous(function(){
            done();
        });
    }, function(){
        //we're all done!
    });
    
`arrays.forEachBatch` : execute all jobs in parallel up to a maximum #, then queue

    arrays.forEachBatch(array, batchSize, function(item, index, done){
        somethingAsynchronous(function(){
            done();
        });
    }, function(){
        //we're all done!
    });
    
`arrays.map` : map all elements of the array, but allow for asynchronous interaction. Alternatives are: `arrays.map.each`(sequential) `arrays.map.all`(parallel)

    arrays.map(array, function(item, index, done){
        somethingAsynchronous(function(newItem){
            done(newItem);
        });
    }, function(mappedData){
        //we're all done!
    });


Prototype Usage
---------------
Attach to the prototype (using names which don't collide with the browser implementations):

    require('async-arrays').proto();

`forEachEmission` : execute serially

    [].forEachEmission(function(item, index, done){
        somethingAsynchronous(function(){
            done();
        });
    }, function(){
        //we're all done!
    });
    
`forAllEmissions` : execute all jobs in parallel

    [].forAllEmissions(function(item, index, done){
        somethingAsynchronous(function(){
            done();
        });
    }, function(){
        //we're all done!
    });
    
`forAllEmissionsInPool` : execute all jobs in parallel up to a maximum #, then queue for later

    [].forAllEmissionsInPool(poolSize, function(item, index, done){
        somethingAsynchronous(function(){
            done();
        });
    }, function(){
        //we're all done!
    });

`mapEmissions` : map all elements of the array, but allow for asynchronous interaction

    [].mapEmissions(function(item, index, done){
        somethingAsynchronous(function(newItem){
            done(newItem);
        });
    }, function(mappedData){
        //we're all done!
    });
    
###Utility functions
**non mutating**

    ['dog', 'cat', 'mouse'].contains('cat') //returns true;

    ['dog', 'cat'].combine(['mouse']) //returns ['dog', 'cat', 'mouse'];
    
**mutators**
    
    ['dog', 'cat', 'mouse'].erase('cat') //mutates the array to ['dog', 'mouse'];
    
    ['dog', 'cat', 'mouse'].empty('cat') //mutates the array to [];
    

That's just about it, and even better you can open up the source and check it out yourself. Super simple.

Testing
-------
just run
    
    mocha

Enjoy,

-Abbey Hawk Sparrow