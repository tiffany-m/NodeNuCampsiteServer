const express = require('express');
const bodyParser = require('body-parser');
const Campsite = require("../models/campsite");
const authenticate = require('../authenticate');

const campsiteRouter = express.Router();

campsiteRouter.use(bodyParser.json());

campsiteRouter.route('/')
.get((req, res, next) => {
    Campsite.find()
    .populate('comments.author')
    .then(campsites => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(campsites);
    })
    .catch(err => next(err));
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.create(req.body)
    .then(campsite => {
        console.log("Campsite Created ", campsite);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(campsite);
    })
    .catch(err => next(err));
})
.put(authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /campsites');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.deleteMany()
    .then(response => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(response);
        })
    .catch(err => next(err));
});

campsiteRouter.route('/:campsiteId')
.get((req, res,next) => {
    Campsite.findById(req.params.campsiteId)
    .populate('comments.author')
    .then(campsite => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(campsite);
    })
    .catch(err => next(err));
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
    res.statusCode = 403;
    res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
})
.put(authenticate.verifyUser, (req, res, next) => {
    Campsite.findByIdAndUpdate(req.params.campsiteId, {
        $set: req.body,
        }, { new: true })
        .then(campsite => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(campsite);
        })
        .catch(err => next(err));
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Campsite.findByIdAndDelete(req.params.campsiteId)
    .then(response => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(response);
    })
    .catch(err => next(err));
});

campsiteRouter
    .route("/:campsiteId/comments")
    .get((req, res, next) => {
        Campsite.findById(req.params.campsiteId)
        .populate('comments.author')
        .then(campsite => {
            if (campsite) {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(campsite.comments);
            } else {
                err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return new(err);
            }
        })
        .catch(err => next(err));
    })
    .post(authenticate.verifyUser, (req, res, next) => {
        Campsite.findById(req.params.campsiteId)
        .then(campsite => {
            if (campsite) {
                req.body.author = req.user._id;
                campsite.comments.push(req.body);
                campsite.save()
                .then(campsite => {
                    res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(campsite);
                })
                .catch(err => next(err))
            } else {
                err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return new err();
            }
        })
        .catch(err => next(err));
    })
    .put(authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
    })
    .delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Campsite.findById(req.params.campsiteId)
        .then(campsite => {
            if (campsite) {
                for (let i = campsite.comments.length - 1; i >= 0; i--) {
                    campsite.comments.id(campsite.comments[i]._id).remove();
                }
                campsite.save()
                .then(campsite => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(campsite);
                })
                .catch(err => next(err));
            } else {
                err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return new err();
            }
        })
        .catch(err => next(err));
    }); 

campsiteRouter
    .route("/:campsiteId/comments/:commentId")
    .get((req, res, next) => {
        Campsite.findById(req.params.campsiteId)
        .populate('comments.author')
        .then(campsite => {
            if (campsite && campsite.comments.id(req.params.commentId)) {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(campsite.comments.id(req.params.commentId));
            } else if (!campsite) {
                err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return new(err);
            } else {
                err = new Error(`Comment ${req.params.commentId} not found`);
                err.status = 404;
                return new(err);
            }
        })
        .catch(err => next(err));
    })
    .post(authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
    })
    .put(authenticate.verifyUser, (req, res, next) => {
        Campsite.findById(req.params.campsiteId)
        .then(campsite => {
            const comment = campsite.comments.id(req.params.commentId);
            if (campsite && comment) {
                const authorId = comment.author._id;
                //req.user._id
                //id1.equals(id2)
                if (authorId.equals(req.user._id)) {
                    if (req.body.rating) {
                        campsite.comments.id(req.params.commentId).rating = req.body.rating;
                    }
                    if (req.body.text) {
                        campsite.comments.id(req.params.commentId).text = req.body.text;
                    }
                    campsite.save()
                    .then(campsite => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(campsite);
                    })
                    .catch(err => next(err));
                } else {
                    err = new Error(`You are not authorized to update ${req.params.campsiteId}`);
                    err.status = 404;
                    return next(err);
                }
            } else if (!campsite) {
                err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return next(err);
            } else {
                err = new Error(`Comment ${req.params.commentId} not found`);
                err.status = 404;
                return next(err);
            }
        })
        .catch(err => next(err));
    })
    .delete(authenticate.verifyUser, (req, res, next) => {
        Campsite.findById(req.params.campsiteId) //campsite = one we found by id
        .then(campsite => {
            if (campsite && campsite.comments.id(req.params.commentId)) { //if they are both truthy, a campsite and a comment, objects, not null, finds comment returns it
                const authorId = campsite.comments.id(req.params.commentId).author._id; //after finding comment gives specific author id of comment
                if (authorId.equals(req.user._id)) { //if author id and user id match then...
                    campsite.comments.id(req.params.commentId).remove(); //remove comment
                    campsite.save()
                        .then(campsite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json'); 
                            res.json(campsite); //sending back campsite so you can see it was removed
                        })
                        .catch(err => next(err)); //err for if not saved properly 
                } else {
                    err = new Error(`You are not authorized to delete ${req.params.campsiteId}`); //this section saying they weren't authorized to delete comment
                    err.status = 404;
                    return next(err);
                }
            } else if (!campsite) {
                err = new Error(`Campsite ${req.params.campsiteId} not found`); //if campsite doesn't match send error
                err.status = 404;
                return new(err);
            } else {
                err = new Error(`Comment ${req.params.commentId} not found`);  //if comment doesn't match send error
                err.status = 404;
                return new(err);
            }
        })
        .catch(err => next(err));
    }); 

module.exports = campsiteRouter;
