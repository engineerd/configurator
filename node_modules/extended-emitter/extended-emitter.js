(function(root, factory){
    if (typeof define === 'function' && define.amd){
        define(['wolfy87-eventemitter', 'sift'], factory);
    }else if(typeof exports === 'object'){
        module.exports = factory(require('events').EventEmitter, require('sift'));
    }else{
        root.ExtendedEmitter = factory(root.EventEmitter, root.Sift);
    }
}(this, function(EventEmitter, sift){
    if(sift.default) sift = sift.default;

    function processArgs(args, hasTarget){
        var result = {};
        if(typeof args[args.length-1] === 'function'){
            result.callback = args[args.length-1];
        }
        args = Array.prototype.slice.call(args);
        result.name = args.shift();
        if(hasTarget) result.target = args.pop();
        result.conditions = args[0] || {};
        return result;
    }

    function meetsCriteria(name, object, testName, testObject){
	    if(name != testName) return false;
	    if(!object) return true;
	    var filter = sift(testObject);
	    var result = filter(object);
      //console.log('>>>', filter, testObject, result);
	    return result;
    }

    function ExtendedEmitter(){
        this.emitter = new EventEmitter();
        if (typeof module === 'object' && module.exports && this.emitter.setMaxListeners) this.emitter.setMaxListeners(100);
    }

    ExtendedEmitter.prototype.onto = function(objectDefinition){
	    var ob = this;
        objectDefinition.on = function(){ return ob.on.apply(ob, arguments) };
        objectDefinition.off = function(){ return ob.off.apply(ob, arguments) };
        objectDefinition.once = function(){ return ob.once.apply(ob, arguments) };
        objectDefinition.emit = function(){ return ob.emit.apply(ob, arguments) };
    };

    ExtendedEmitter.prototype.off = function(event, fn){
        return this.emitter.removeListener.apply(this.emitter, arguments)
    };

    ExtendedEmitter.prototype.allOff = function(event, fn){
        return this.emitter.removeAllListeners.apply(this.emitter, arguments)
    };

    ExtendedEmitter.prototype.on = function(name){
        var args = processArgs(arguments);
        //console.log('DEF', arguments, args, args.callback.toString())
        var proxyFn = function(data){
            if(meetsCriteria(name, data, args.name, args.conditions)){
               //console.log('CB', args, args.callback.toString())
                args.callback.apply(args.callback, arguments);
            }
        };
        this.emitter.on.apply(this.emitter, [args.name, proxyFn]);
        return proxyFn;
    }

    ExtendedEmitter.prototype.emit = function(){
        return this.emitter.emit.apply(this.emitter, arguments);
    }

    ExtendedEmitter.prototype.once = function(name){
        var args = processArgs(arguments);
        var ob = this;
        var proxyFn = function cb(data){
            if(meetsCriteria(name, data, args.name, args.conditions)){
                args.callback.apply(args.callback, arguments);
                ob.off.apply(ob, [args.name, cb]);
            }
        };
        this.emitter.on.apply(this.emitter, [args.name, proxyFn]);
        return proxyFn;
    }

    ExtendedEmitter.prototype.when = function(events, callback){
        var count = 0;
        var returns = [];
        var ob = this;
        events.forEach(function(event, index){
            var respond = function(emission){
                count++;
                returns[index] = emission;
                if(count == events.length) callback.apply(callback, returns);
            }
            if(event.then){ //promise handling
	            event.then(function(resolve, error, notify){
		            respond();
		            resolve();
	            });
	            return;
            }
            if(typeof event == 'function') event(respond);
            else return ob.emitter.once(event, respond);
        });
    };

    return ExtendedEmitter;
}));
