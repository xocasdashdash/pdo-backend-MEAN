'use strict';

var events = ['pdo.js'];
var emitter = require('./emitter.js');
var logger = require('../log/log');
module.exports = (function(ee) {
    var l = events.length;
    for (var i = 0; i < l; i++) {
        require('./' + events[i]).initialize(ee);
    }
    logger.debug('Eventos cargados');
})(emitter.ee);