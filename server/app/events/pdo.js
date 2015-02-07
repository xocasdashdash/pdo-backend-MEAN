'use strict';
var events = require('events');
//var ee = new events.EventEmitter();
var Pdo = require('mongoose').model('Pdo');
var logger = require('../log/log.js');
module.exports.initialize = function(ee) {
    ee.on('pdo:removed_from_group', function(pdo_id) {
        logger.debug('Eliminando pdo group (%s)', pdo_id);
        Pdo.findByIdAndUpdate(pdo_id, {
            $set: {
                group_id: null
            }
        }, function(err, pdo) {
            if (err) {
                logger.error('Error al modificar el PDO(%s):%s', pdo_id, err);
            }
        });
    });
    ee.on('pdo:added_to_group', function (pdo_id) {
        logger.debug('Pdo (%s) aniadido al grupo', pdo_id);
    });
    ee.on('pdo:added_comment',function (pdo_id) {
        //Notifico al usuario que se ha añadido un comentario
    });
};