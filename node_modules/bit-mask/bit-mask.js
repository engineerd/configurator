var EventedArrays = require('array-events');

function BitMask(value, base){
    this.base = base || 10;
    if(value) this.value = parseInt(value, base);
}
BitMask.prototype.setBit = function(position, value){
    if(this.getBit(position)){ //it's set
        if(!value){//clear
            this.value = (1 << position) ^ this.value;
        }// else it's already set!
    }else{ //not set
        if(value){
            this.value = (1 << position) | this.value;
        }// it's already not set!
    }
};
BitMask.prototype.getBit = function(position){
    return !!((1 << (this.base-position) ) & this.value);
}
BitMask.prototype.bits = function(){
    return this.value.toString(2);
}

function OwnershipMask(value){
    //BitMask.constructor.apply(this, [value, 8]);
    this.base = 8;
    if(value) this.value = parseInt(value, 8);
};
OwnershipMask.prototype.getPosition = function(context, permission){
    var groupIndex = this.contexts.indexOf(context.toLowerCase());
    if(groupIndex === -1) throw('Unrecognized context('+context+')!');
    var permissionIndex = this.permissions.indexOf(permission.toLowerCase());
    if(permissionIndex === -1) throw('Unrecognized permission('+permission+')!');
    return groupIndex*this.permissions.length + permissionIndex;
};
OwnershipMask.prototype.hasPermission = function(context, permission){
    var position = this.getPosition(context, permission);
    return this.getBit(position);
}
OwnershipMask.prototype.setPermission = function(context, permission, value){
    var position = this.getPosition(context, permission);
    return this.setBit(position, value);
}
OwnershipMask.prototype.modify = function(clause){
    var operator = false;
    var subjects = [];
    var ch;
    var ob = this;
    if(typeof clause == 'number') this.value = clause;
    for(var lcv=0; lcv < clause.length; lcv++){
        ch = clause.charAt(lcv);
        if(operator){
            var perm;
            switch(ch){
                case 'r':
                    perm = 'read';
                    break;
                case 'w':
                    perm = 'write';
                    break;
                case 'x':
                    perm = 'execute';
                    break;
            }
            subjects.forEach(function(subject){
                var value;
                if(operator == '+') value = 1;
                if(operator == '-') value = 0;
                ob.setPermission(subject, perm, value);
            });
        }else{
            switch(ch){
                case 'u':
                    subjects.push('user');
                    break;
                case 'g':
                    subjects.push('group');
                    break;
                case 'o':
                    subjects.push('world');
                    break;
                case '+':
                case '-':
                    operator = ch;
                    break;
            }
        }
    }
}
OwnershipMask.prototype.contexts = ['user', 'group', 'world'];
OwnershipMask.prototype.permissions = ['read', 'write', 'execute'];
OwnershipMask.prototype.setBit = BitMask.prototype.setBit;
OwnershipMask.prototype.getBit = BitMask.prototype.getBit;
OwnershipMask.prototype.bits = BitMask.prototype.bits;
module.exports = BitMask;
module.exports.OwnershipMask = OwnershipMask;
