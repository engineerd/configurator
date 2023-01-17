var should = require("should");
var ArrayEvents = require('./array-events');

describe('array-events', function(){
    
    describe('fires change events', function(){
        
        it('from .push()', function(complete){
            var arr = new ArrayEvents();
            var changes = 0;
            arr.on('change', function(event){
                if(event.type == 'add') changes++;
            });
            setTimeout(function(){
                changes.should.equal(2);
                complete();
            }, 50);
            arr.push(4);
            arr.push(23);
        });
        
        it('from .unshift()', function(complete){
            var arr = new ArrayEvents();
            var changes = 0;
            arr.on('change', function(event){
                if(event.type == 'add') changes++;
            });
            setTimeout(function(){
                changes.should.equal(2);
                complete();
            }, 50);
            arr.unshift(4);
            arr.unshift(23);
        });
        
        it('from .pop()', function(complete){
            var arr = new ArrayEvents([20, 15]);
            var changes = 0;
            arr.on('change', function(event){
                if(event.type == 'remove') changes++;
            });
            setTimeout(function(){
                changes.should.equal(2);
                complete();
            }, 50);
            arr.pop();
            arr.pop();
        });
        
        it('from .shift()', function(complete){
            var arr = new ArrayEvents([20, 15]);
            var changes = 0;
            arr.on('change', function(event){
                if(event.type == 'remove') changes++;
            });
            setTimeout(function(){
                changes.should.equal(2);
                complete();
            }, 50);
            arr.shift();
            arr.shift();
        });
    
    });
    
    describe('fires add events', function(){
        
        it('from .push()', function(complete){
            var arr = new ArrayEvents();
            var changes = 0;
            arr.on('add', function(event){
                changes++;
            });
            setTimeout(function(){
                changes.should.equal(2);
                complete();
            }, 50);
            arr.push(4);
            arr.push(23);
        });
        
        it('from .unshift()', function(complete){
            var arr = new ArrayEvents();
            var changes = 0;
            arr.on('add', function(event){
                changes++;
            });
            setTimeout(function(){
                changes.should.equal(2);
                complete();
            }, 50);
            arr.unshift(4);
            arr.unshift(23);
        });
    
    });
    
    describe('fires remove events', function(){
        
        it('from .pop()', function(complete){
            var arr = new ArrayEvents([20, 15]);
            var changes = 0;
            arr.on('remove', function(event){
                changes++;
            });
            setTimeout(function(){
                changes.should.equal(2);
                complete();
            }, 50);
            arr.pop();
            arr.pop();
        });
        
        it('from .push()', function(complete){
            var arr = new ArrayEvents([20, 15]);
            var changes = 0;
            arr.on('remove', function(event){
                changes++;
            });
            setTimeout(function(){
                changes.should.equal(2);
                complete();
            }, 50);
            arr.shift();
            arr.shift();
        });
    
    });
    
    describe('uses forEachEmission', function(){
        
        it('to only perform one action at a time', function(complete){
            var count = 0;
            new ArrayEvents(['a', 'b', 'c', 'd', 'e']).forEachEmission(function(item, index, done){
                count++;
                count.should.equal(1);
                setTimeout(function(){
                    count--;
                    done();
                }, 50);
            }, function(){
                count.should.equal(0);
                complete();
            });
        });
    
    });
    
    describe('uses forAllEmissions', function(){
        
        it('to perform all actions in parallel', function(complete){
            var count = 0;
            new ArrayEvents(['a', 'b', 'c', 'd', 'e']).forAllEmissions(function(item, index, done){
                count++;
                setTimeout(function(){
                    count--;
                    count.should.equal(5-(index+1));
                    done();
                }, 50 + 20*index);
            }, function(){
                count.should.equal(0);
                complete();
            });
        });
    
    });
    
    describe('uses forAllEmissionsInPool', function(){
        
        it('to perform N actions in parallel', function(complete){
            var count = 0;
            new ArrayEvents(['a', 'b', 'c', 'd', 'e']).forAllEmissionsInPool(3, function(item, index, done){
                count++;
                setTimeout(function(){
                    count.should.not.be.above(3);
                    count--;
                    done();
                }, 50);
            }, function(){
                count.should.equal(0);
                complete();
            });
        });
    
    });
    
    describe('self identifies', function(){
        
        it('it is an Array', function(){
            var arr = new ArrayEvents();
            Array.isArray(arr).should.equal(true);
        });
        
        it('it is an EventedArray', function(){
            var arr = new ArrayEvents();
            (ArrayEvents.is(arr)).should.equal(true);
        });
        
        it('an Array is not an EventedArray', function(){
            ArrayEvents.is([]).should.equal(false);
        });
        
    });
    
});