var should = require("should");
require('./async-arrays').proto();

describe('async-arrays', function(){
    
    describe('uses forEachEmission', function(){
        
        it('to only perform one action at a time', function(complete){
            var count = 0;
            ['a', 'b', 'c', 'd', 'e'].forEachEmission(function(item, index, done){
                count++;
                count.should.equal(1);
                setTimeout(function(){
                    count--;
                    done();
                }, 300);
            }, function(){
                count.should.equal(0);
                complete();
            });
        });
        
        it('can doubly nest iterations', function(complete){
            ['a', 'b', 'c', 'd', 'e'].forEachEmission(function(item, index, done){
                var ind = index;
                ['f', 'g', 'h', 'i', 'j'].forEachEmission(function(subitem, subindex, finish){
                    finish(subitem);
                }, function(f, g, h, i, j){
                    f.should.equal('f');
                    g.should.equal('g');
                    h.should.equal('h');
                    i.should.equal('i');
                    j.should.equal('j');
                    done(item);
                });
            }, function(a, b, c, d, e){
                a.should.equal('a');
                b.should.equal('b');
                c.should.equal('c');
                d.should.equal('d');
                e.should.equal('e');
                complete();
            });
        });
    
    });
    
    describe('uses forAllEmissions', function(){
        
        it('to perform all actions in parallel', function(complete){
            var count = 0;
            ['a', 'b', 'c', 'd', 'e'].forAllEmissions(function(item, index, done){
                count++;
                setTimeout(function(){
                    count--;
                    count.should.equal(5-(index+1));
                    done();
                }, 300 + 20*index);
            }, function(){
                count.should.equal(0);
                complete();
            });
        });
        
        it('can doubly nest iterations', function(complete){
            var rtrn;
            ['a', 'b', 'c', 'd', 'e'].forAllEmissions(function(item, index, done){
                ['f', 'g', 'h', 'i', 'j'].forAllEmissions(function(item, index, finish){
                    finish();
                }, function(){
                    done();
                });
            }, function(){
                should.not.exist(rtrn);
                rtrn = setTimeout(function(){
                    complete();
                }, 500);
            });
        });
    
    });
    
    describe('uses forAllEmissionsInPool', function(){
        
        it('to perform N actions in parallel', function(complete){
            var count = 0;
            ['a', 'b', 'c', 'd', 'e'].forAllEmissionsInPool(3, function(item, index, done){
                count++;
                setTimeout(function(){
                    count.should.not.be.above(3);
                    count--;
                    done();
                }, 300);
            }, function(){
                count.should.equal(0);
                complete();
            });
        });
    
    });
});