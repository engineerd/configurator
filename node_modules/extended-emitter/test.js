var should = require("should");
var Emitter = require('./extended-emitter.js');
var Promise = require('vow').Promise;

describe('Extended Emitter can', function(){
	
	describe('do basic object manipulation: ', function(){
		var emitter;
		it('create an instance', function(){
			emitter = new Emitter();
		});
		
		it('subscribes via .on()', function(done){
			var event = {count:0};
			emitter.on('dummy-event', function(){
				event.count++;
			});
			emitter.emit('dummy-event');
			emitter.emit('dummy-event');
			setTimeout(function(){
				event.count.should.equal(2);
				done();
			});
		});
		
		it('subscribes via .once()', function(done){
			var event = {count:0};
			emitter.once('dummy-event', function(){
				event.count++;
			});
			emitter.emit('dummy-event');
			emitter.emit('dummy-event');
			setTimeout(function(){
				event.count.should.equal(1);
				done();
			});
		});
		
		it('unsubscribes via .off()', function(done){
			var event = {count:0};
			var id = emitter.on('dummy-event', function(){
				event.count++;
			});
			emitter.off('dummy-event', id);
			emitter.emit('dummy-event');
			emitter.emit('dummy-event');
			setTimeout(function(){
				event.count.should.equal(0);
				done();
			});
		});
		
		it('attaches to an object', function(){
			var object = {};
			emitter.onto(object);
			should.exist(object.on);
			should.exist(object.off);
			should.exist(object.once);
			should.exist(object.emit);
		});
		
	});
	
	describe('correctly assembles events with .when()', function(){
		var emitter;
		
		before(function(){
			emitter = new Emitter();
		});
		
		it('subscribes via old-style ready function + events', function(done){
			var ready = function(cb){
				setTimeout(function(){
					cb();
				}, 30);
			};
			emitter.when([ready, 'dummy-event', 'other-event'], function(){
				done();
			});
			emitter.emit('dummy-event');
			emitter.emit('other-event');
		});
		
		it('subscribes via promise + events', function(done){
			var promise = new Promise(function(resolve, reject, notify) {
				setTimeout(function(){
					resolve();
				}, 10)
			});
			emitter.when([promise, 'dummy-event', 'other-event'], function(){
				done();
			});
			emitter.emit('dummy-event');
			emitter.emit('other-event');
		});
		
		it('subscribes via promise + events: alternate sequence', function(done){
			var promise = new Promise(function(resolve, reject, notify) {
				setTimeout(function(){
					resolve();
				}, 10)
			});
			emitter.when([promise, 'dummy-event', 'other-event'], function(){
				done();
			});
			setTimeout(function(){
				emitter.emit('other-event');
			}, 50)
			emitter.emit('dummy-event');
		});
	});
	
	describe('distinguishes complex contexts', function(){
		
		var emitter;
		
		before(function(){
			emitter = new Emitter();
		});
		
		it('subscribes via .once() using subvalue + range', function(done){
			var event = {count:0};
			emitter.once('dummy-event', {
				type : 'thing',
				value : {$gt : 5, $lt : 7}
			}, function(){
				event.count++;
			});
			emitter.emit('dummy-event', {
				type: 'blah',
				value: 1
			});
			emitter.emit('dummy-event', {
				type: 'blah',
				value: 6
			});
			emitter.emit('dummy-event', {
				type: 'thing',
				value: 1
			});
			emitter.emit('dummy-event', {
				type: 'thing',
				value: 10
			});
			emitter.emit('dummy-event', {
				type: 'thing',
				value: 6
			});
			setTimeout(function(){
				event.count.should.equal(1);
				done();
			}, 10)
		});
	});
    
});