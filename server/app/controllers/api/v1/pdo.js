'use strict';
var mongoose = require('mongoose');
var q = require('q');
var logger = require('../../../log/log.js');


var School = mongoose.model('School'),
    Pdo = mongoose.model('Pdo'),
    Course = mongoose.model('Course'),
    Program = mongoose.model('Program'),
    PdoGroup = mongoose.model('PdoGroup'),
    PdoComment = mongoose.model('PdoComment');

module.exports = function(router) {

    //Crear un pisado
    router({
        name: 'create_pdo',
        path: '/'
    }).post(function(req, res) {
        var pdo = new Pdo(),
            promise_array = [],
            deferred_school = q.defer(),
            deferred_course = q.defer(),
            deferred_program = q.defer();
        pdo.name = req.body.name;
        pdo.surname = req.body.surname;
        pdo.email = req.body.email;
        pdo.phone = req.body.phone;
        pdo.num_id = req.body.num_id;
        pdo.title = req.body.title;
        pdo.text = req.body.text;
        pdo.posted_at = req.body.postedAt;
        pdo.deviceUUID = req.body.deviceUUID;
        promise_array.push(deferred_school.promise);
        School.findOne({
            schoolname: req.body.school.schoolname
        }, function(err, school) {
            if (err) {
                deferred_school.reject(err);
            }
            if (!school) {
                logger.error('No school found!SchoolName:%s',req.body.school.schoolname);
                deferred_school.reject(
                    'No school found with[' + req.body.school.schoolname + ']');
            }
            pdo.school = school;
            deferred_school.resolve(school);
        });

        promise_array.push(deferred_program.promise);
        Program.findOne({
            code: req.body.program.code
        }, function(err, program) {
            if (err) {
                deferred_program.reject(err);
            }
            if (!program) {
                deferred_program.reject('No program found');
            }
            pdo.program = program;
            deferred_program.resolve(program);
        });

        promise_array.push(deferred_course.promise);
        Course.findOne({
            code: req.body.course.code
        }, function(err, course) {
            if (err) {
                deferred_course.reject(err);
            }
            if (!course) {
                deferred_course.reject('No course found');
            }
            pdo.course = course;
            deferred_course.resolve(course);
        });
        q.all(promise_array).spread(function(school,program, course) {
            pdo.course = course;
            pdo.program = program;
            pdo.school = school;
            pdo.save(function(err) {
                if (err) {
                    res.send(err);
                }
                //Enviar e-mail a la persona responsable del centro
                //Enviar notificación al movil por el sistema de google/apple
                res.json(pdo);
            });
        }).fail(function(reason) {
            logger.error('Promesa rechazada. Razon: %s', reason);
            var err = new Error(reason);
            res.status(400).send(err);
        });
    });

    router({
        name: 'get_pdo',
        path: '/:pdo_id'
    }).get(function(req, res) {
        Pdo.findById(req.params.pdo_id,
            function(err, pdo) {
                if (err) {
                    res.send(err);
                    return;
                }
                if (!pdo) {
                    var error = new Error();
                    error.message = 'Pdo not found';
                    error.code = 404;
                    res.status(404).send(error);
                    return;
                }
                res.send(pdo.resource(req.route_gen));
                return;
            });
    });
    router({
        name: 'add_comment_pdo',
        path: '/:pdo_id/comment',
    }).put(function(req, res) {
        var pdo_comment = new PdoComment();
        pdo_comment.title = req.body.title;
        pdo_comment.text = req.body.text;
        logger.debug('Comentario:', req.body);
        //logger.debug('New Comment:',pdo_comment);
        pdo_comment.validate(function(err) {
            if (typeof err === 'undefined') {
                Pdo.findByIdAndUpdate(req.params.pdo_id, {
                    $push: {
                        comments: pdo_comment
                    }
                }, function(err, pdo) {
                    if (err) {
                        res.send(err);
                        return;
                    }
                    if (!pdo) {
                        var error = new Error();
                        error.message = 'Pdo not found';
                        error.code = 404;
                        res.status(error.code).send(error);
                        return;
                    }
                    logger.debug('**COMMENTS**', pdo.comments.length);
                    res.send(pdo.resource(req.route_gen));
                    return;
                });
            } else {
                //logger.debug(err);
                res.status(400);
                res.send(err);
                return;
            }
        });
    });

    router({
        name: 'delete_comment_pdo',
        path: '/:pdo_id/comment/:comment_id',
    }).delete(function(req, res) {
        Pdo.findById(req.params.pdo_id, function(err, pdo) {
            if (err) {
                res.send(err);
                return;
            }
            if (!pdo) {
                var error = new Error();
                error.message = 'Pdo not found';
                error.code = 404;
                res.status(404).send(error);
                return;
            }

            pdo.comments.id(req.params.comment_id).remove();
            try {
                pdo.save(function(err, pdo) {
                    if (err) {
                        res.send(err);
                        return;
                    }
                    if (!pdo) {
                        var error = new Error();
                        error.message = 'Pdo not found';
                        error.code = 404;
                        res.status(404).send(error);
                        return;
                    }
                    res.send(pdo.resource(req.route_gen));
                    return;
                });
            } catch (E) {
                logger.error('Error! %s', E);
            }
        });
    });


    router({
        name: 'get_pdo_comments',
        path: '/:pdo_id/comment'
    }).get(function(req, res) {
        var promise_array = [];
        var promPdoComments = q.defer(),
            promPdoGroupComments = q.defer();
        promise_array[0] = promPdoComments.promise;
        promise_array[1] = promPdoGroupComments.promise;
        q.all(promise_array).spread(function(pdo_comments, pdo_group_comments) {
            var respuesta = [];

            function compare(a, b) {
                if (a.date_created > b.date_created) {
                    return -1;
                }
                if (a.date_created < b.date_created) {
                    return 1;
                }
                return 0;
            }
            respuesta = respuesta.concat(pdo_comments);
            respuesta = respuesta.concat(pdo_group_comments);
            respuesta = respuesta.sort(compare);
            res.send(respuesta);
            return;
        }).fail(function(reason) {
            logger.error('Promesa rechazada. Razon: %s', reason);
            res.status(reason.code ? reason.code : 400).send(reason);
            return;
        });
        Pdo.findById(req.params.pdo_id,
            function(err, pdo) {
                if (err) {
                    res.send(err);
                    return;
                }
                if (!pdo) {
                    var error = new Error();
                    error.message = 'Pdo not found';
                    error.code = 404;
                    promPdoComments.reject(error);
                    return;
                }
                if (pdo.comments.length === 0) {
                    promPdoComments.resolve([]);
                } else {
                    promPdoComments.resolve(
                        pdo.comments
                    );
                }
                if (pdo.pdo_group) {
                    PdoGroup.findById(pdo.pdo_group, function(err, pdo_group) {
                        if (err) {
                            promPdoGroupComments.reject(err);
                            return;
                        }
                        if (!pdo_group) {
                            promPdoGroupComments.resolve([]);
                            return;
                        }
                        promPdoGroupComments.resolve(
                            pdo_group.comments
                        );
                    });
                } else {
                    promPdoGroupComments.resolve([]);
                }


            });
    });

    router({
        name: 'reject_pdo',
        path: '/:pdo_id/reject'
    }).put(function(req, res) {
        Pdo.findByIdAndUpdate(req.params.pdo_id, {
            status: 'STATUS_REJECTED'
        }, function(err, pdo) {
            if (err) {
                res.status(400).send(err);
                return;
            }
            if (!pdo) {
                var error = new Error();
                error.message = 'Pdo not found';
                error.code = 404;
                res.status(error.code).send(error);
                return;
            }
            logger.debug('Pdo rechazado: (%s)', pdo.status);
            res.send(pdo);
            return;
        });
    });

    router({
        name: 'get_pdo_by_school',
        path: '/school/:school_id'
    }).get(function(req, res) {
        var from = req.query.createdOnBefore,
            limit = req.query.limit,
            pdo_filter = {};
        pdo_filter.school = mongoose.Types.ObjectId(req.params.school_id);
        pdo_filter.created_on = {
            $lte: from
        };
        
        if (req.query.status_filter) {
            pdo_filter.status = req.query.status_filter;
        }
        Pdo.find(pdo_filter)
            .limit(limit)
            .exec()
            .then(
                function(pdos) {
                    logger.debug('Encontrados (%d) Pdos', pdos.length);
                    var pdoResp;
                    if (!pdos) {
                        pdoResp = [];
                    } else {
                        pdoResp = pdos.map(function(e) {
                            return e.resource(req.route_gen);
                        });
                    }
                    res.send(pdoResp);
                    return;
                }, function(err) {
                    res.status(400).send(err);
                    return;
                }
        );
    });
    router({
        name: 'get_my_pdos',
        path: '/school'
    }).get(function(req, res) {
        var from = req.query.createdOnBefore,
            limit = req.query.limit,
            pdo_filter = {};
        pdo_filter.created_on = {
            $lte: from
        };

        //Filtro por los PDo a los que tiene acceso el usuario
        //Si es super-admin puede ver todos
        //Si es local-admin puede ver los de un centro
        //Else: No debería llegar aquí
        //pdo_filter.school = mongoose.Types.ObjectId(req.params.school_id);
        if (req.query.status_filter) {
            pdo_filter.status = req.query.status_filter;
        }
        Pdo.find(pdo_filter).limit(limit).then(
            function(pdos) {
                logger.debug('Encontrados (%d) Pdos', pdos.length);
                var pdoResp;
                if (!pdos) {
                    pdoResp = [];
                } else {
                    pdoResp = pdos.map(function(e) {
                        return e.resource(req.route_gen);
                    });
                }
                res.send(pdoResp);
                return;
            }, function(err) {
                res.status(400).send(err);
                return;
            }
        );
    });
};