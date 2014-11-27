'use strict';
var express = require('express'); // call express
var mongoose = require('mongoose');
var q = require('q');

var Pdo = mongoose.model('Pdo'),
    PdoGroup = mongoose.model('PdoGroup');

module.exports = function(router) {
    router({
        name: 'create_pdo_group',
        path: '/'
    }).post(function(req, res) {
        var pdo_group = new PdoGroup(),
            pdo_ids = [];
        pdo_group.title = req.body.title;
        pdo_group.summary = req.body.summary;
        pdo_ids = JSON.parse(req.body.pdos).map(
            function(pdo) {
                //console.log(pdo);
                return mongoose.Types.ObjectId(pdo);
            });
        pdo_group.pdos = pdo_ids;

        pdo_group.save(function(err, pdo_group) {
            if (err) {
                res.send(err);
                return;
            }
            res.send(pdo_group.resource(req.route_gen));
        });
    });

    router({
        name: 'add_comment',
        path: '/:pdo_group_id/comment'
    }).put(function(req, res) {
        var comment = {
            title: req.body.title,
            text: req.body.text
        };
        PdoGroup.findByIdAndUpdate(req.params.pdo_group_id, {
            $push: {
                comments: comment
            }
        }, function(err, pdo_group) {
            if (err) {
                res.send(err);
                return;
            }
            if (!pdo_group) {
                var error = new Error();
                error.message = 'Pdo group not found';
                error.code = 404;
                res.status(404).send(error);
                return;
            }
            res.send(pdo_group.resource(req.route_gen));
        });
    });

    router({
        name: 'get_comment',
        path: '/:pdo_group_id/comments/:comment_id'
    }).get(function(req, res) {
        PdoGroup.findById(req.params.pdo_group_id,
            'comments',
            function(err, pdo_group) {
                if (err) {
                    res.send(err);
                    return;
                }
                if (!pdo_group) {
                    var error = new Error();
                    error.message = 'Pdo group not found';
                    error.code = 404;
                    res.status(404).send(error);
                    return;
                }
                res.send(
                    pdo_group.comments.id(req.params.comment_id)
                    .resource(req.route_gen));
            });
    });

    router({
        name: 'delete_comment',
        path: '/:pdo_group_id/comments/:comment_id'
    }).delete(function(req, res) {
        PdoGroup.findById(req.params.pdo_group_id,
            'comments',
            function(err, pdo_group) {
                if (err) {
                    res.send(err);
                    return;
                }
                if (!pdo_group) {
                    var error = new Error();
                    error.message = 'Pdo group not found';
                    error.code = 404;
                    res.status(404).send(error);
                    return;
                }
                pdo_group.comments.id(req.params.comment_id).remove();
                pdo_group.save(function(err, pdo_group) {
                    if (err) {
                        res.send(err);
                        return;
                    }
                    if (!pdo_group) {
                        var error = new Error();
                        error.message = 'Pdo group not found';
                        error.code = 404;
                        res.status(404).send(error);
                        return;
                    }
                    res.send(pdo_group.resource(req.route_gen));
                    return;
                });

            });
    });

    router({
        name: 'get_pdo_group',
        path: '/:pdo_group_id'
    }).get(function(req, res) {
        PdoGroup.findById(req.params.pdo_group_id,
            function(err, pdo_group) {
                if (err) {
                    res.send(err);
                    return;
                }
                if (!pdo_group) {
                    var error = new Error();
                    error.message = 'Pdo group not found';
                    error.code = 404;
                    res.status(404).send(error);
                    return;
                }
                res.send(pdo_group.resource(req.route_gen));
                return;
            });
    });

    router({
        name: 'add_pdo_to_group',
        path: '/:pdo_group_id/pdo'
    }).put(function(req, res) {
        PdoGroup.findByIdAndUpdate(req.params.pdo_group_id, {
            $addToSet: {
                pdos: req.body.pdos
            }
        }, function(err, pdo_group) {
            //res.status(400).send(new Error('errrorrrr'));
            //return;
            if (err) {
                res.send(err);
                return;
            }
            if (!pdo_group) {
                var error = new Error();
                error.message = 'Pdo group not found';
                error.code = 404;
                res.status(404).send(error);
                return;
            }
            res.send(pdo_group.resource(req.route_gen));
        });
    });

    router({
        name: 'remove_pdo_from_group',
        path: '/:pdo_group_id/pdo'
    }).delete(function(req, res) {
        PdoGroup.findOne({
            _id: req.params.pdo_group_id
        }).exec()
            .then(function(pdo_group) {
                if (!pdo_group) {
                    var error = new Error();
                    error.message = 'Pdo group not found';
                    error.code = 404;
                    res.status(404).send(error);
                    return;
                }
                //No me deja quitar PDO a los grupos que tengan solo un PDO
                if (pdo_group.pdos.length > 1) {
                    return PdoGroup.findByIdAndUpdate(req.params.pdo_group_id, {
                        $pull: {
                            pdos: req.body.pdo_id
                        }
                    }).exec();
                } else {
                    var err = new Error();
                    err.message = 'Last PDO in group';
                    err.code = 400;
                    return q.reject(err);
                }
            }).then(function(pdo_group) {
                res.send(pdo_group.resource(req.route_gen));
                return;
            }).reject(function(reason) {
                res.send(reason);
                return;
            });

    });

    router({
        name: 'delete_group',
        path: '/:pdo_group_id'
    }).delete(function(req, res) {
        PdoGroup.findByIdAndRemove(
            req.params.pdo_group_id, function(err, removedDoc) {
                if (err) {
                    res.send(err);
                }
                if (!removedDoc) {
                    var error = new Error();
                    error.message = 'PdoGroup not found';
                    error.code = '404';
                    res.status(400).send(error);
                }
                res.status(200).send({
                    message: 'Removed',
                    type: 'success',
                    removedDoc: removedDoc
                });
            });
    });
};