var config = require('../config.js');

var mongoose = require('mongoose');
var path = require('path');
var fs = require('fs-extra');
var phantom = require('phantom');
var vow = require('vow');
var sizeOf = require('image-size');
var cloudinary = require('cloudinary');
var im = require('imagemagick');

cloudinary.config({
    cloud_name: 'hvwthfvq6',
    api_key: '737989479753773',
    api_secret: '11mHeIlk5ntEdPtKqsXP-MxLq0s'
});

require('../models/project');

var Project = mongoose.model('Project');

uploadImage = function(image, callback) {
    if (!image)
        return;

    var dimensions = sizeOf(image);

    var limitWidth = 500;
    var limitHeight = 1200;

    var k = 500 / dimensions.width;

    var defer = vow.defer();

    if (dimensions.height * k > limitHeight)
        im.crop({
            srcPath: image,
            dstPath: image,
            width: dimensions.width,
            height: limitHeight / k,
            gravity: 'North',
            quality: 1
        }, function(error, stdout, stderr) {
            if (error)
                return next(error);

            defer.resolve();
        });
    else
        defer.resolve();

    defer.promise().then(function() {
        cloudinary.uploader.upload(image,
            function(result) {
                callback(result.error, {src: image, dst: result.url});
            },
            {
                width: limitWidth,
                gravity: 'north',
                format: 'jpg',
                quality: 100,
                crop: 'limit'
            });
    });
}

deleteImage = function(image, callback) {
    if (!image)
        return callback();

    if (!callback)
        callback = function(){};

    arr = image.split('/');
    arr = arr[arr.length - 1].split('.')[0];

    arr = [arr];

    cloudinary.api.delete_resources(arr,
        function(result) {
            callback();
        });
}

createScreenshot = function(url, options, callback) {
    if (!options) options = {};

    var shot = {
        name: parseInt(Math.random() * 1000000) + '.png'
    }

    var dest = path.join(config.TEMP, shot.name);

    phantom.create(function (ph) {
        ph.createPage(function (page) {
            var viewportSize = {};

            viewportSize.width = options.width || 1024;
            viewportSize.height = options.height || 768;

            page.set('viewportSize', viewportSize);

            page.open(url, function (status) {

                setTimeout(function() {
                    page.render(dest, function() {
                        ph.exit();

                        callback(shot);
                    });
                }, 1000);
            });
        });
    });
}

setProjectOrder = function(set, project, promises) {
    if (set && set != project.order) {
        if (set <= 0) set = 1

        if (project.order) {
            var skip = set < project.order ? set - 1 : project.order - 1;
            var limit = Math.abs(set - project.order) + 1;
        } else {
            var skip = 0;
            var limit = null;

            var newProject = true;
        }

        var defer = vow.defer();

        promises.push(defer.promise());

        Project.find().sort({order: 1}).skip(skip).limit(limit).exec(function(error, projects) {
            if (error)
                return;

            defer.resolve();

            projects.forEach(function(value, index) {
                if (value.id != project.id && !newProject)
                    var newOrder = set < project.order ? value.order + 1 : value.order - 1;
                else if (value.id == project.id)
                    var newOrder = set;
                else
                    var newOrder = value.order + 1;

                var defer = vow.defer();

                promises.push(defer.promise());

                value.update({$set: {order: newOrder}}).exec(function (error, projects) {
                    if (error)
                        return next(error)

                    defer.resolve();
                });
            });

            project.order = set;
        });
    }
}

module.exports =
{
    get: function (req, res, next) {
        Project.find().sort({order: 1}).exec(function (error, projects) {
            if (error)
                return next(error);

            res.send({projects: projects});
        });
    },
    delete: function (req, res, next) {
        if (!req.params.id)
            throw new Error;

        Project.findOne({_id: req.params.id}, 'images', function (error, data) {
            if (error || !data)
                return next(error);

            function checkDeleteComplete()
            {
                if (deleteComplete.length == images.length) {
                    Project.findOneAndRemove({_id: req.params.id}, function (error) {
                        if (error)
                            return next(error);

                        res.send(200);
                    });
                }
            }

            var deleteComplete = [];

            var images = data.images;

            if (images.length)
                images.forEach(function (value)
                {
                    deleteImage(value, function () {
                        deleteComplete.push(true);

                        checkDeleteComplete();
                    });
                });
            else
                checkDeleteComplete();
        });
    },
    post: function (req, res, next) {
        var project = new Project();

        if (req.body.title)
            project.title = req.body.title;

        if (req.body.description)
            project.description = req.body.description;

        if (req.body.links)
            project.links = req.body.links;

        if (project.links && !Array.isArray(project.links))
            project.links = [project.links];

        var shots = req.body.shots;

        if (!shots)
            shots = []
        else if (!Array.isArray(shots))
            shots = [shots];

        var attachImages = req.files.image;

        if (!attachImages)
            attachImages = []
        else if (!Array.isArray(attachImages))
            attachImages = [attachImages];

        if (req.body.shotWidth)
            var shotWidth = req.body.shotWidth;

        if (req.body.shotHeight)
            var shotHeight = req.body.shotHeight;

        project.images = [];

        var promises1 = [];
        var promises2 = [];

        var responseNewImages = [];

        setProjectOrder(1, project, promises2);

        if (shots)
            shots.forEach(function(value, index) {
                var defer = vow.defer();

                promises1.push(defer.promise());

                createScreenshot(value, {width: shotWidth, height: shotHeight}, function(shot) {
                    attachImages.push(shot);

                    defer.resolve();
                });
            });

        vow.all(promises1).then(function() {
            if (attachImages.length)
                attachImages.forEach(function (value, index) {
                    var defer = vow.defer();

                    promises2.push(defer.promise());

                    uploadImage(path.join(config.TEMP, value.name), function (error, result) {
                        fs.unlink(result.src);

                        if (error)
                            return next(error);

                        project.images.push(result.dst);

                        responseNewImages.push(result.dst);

                        defer.resolve();
                    });
                });

            vow.all(promises2).then(function() {
                images = project.images

                project.save(function (error) {
                    if (error) {
                        return next(error);
                    }

                    res.send({_id: project._id, images: responseNewImages});
                });
            });
        });
    },
    put: function (req, res, next) {
        if (!req.params.id || (!req.body.title && !req.body.description && !req.body.link && !req.body.delImage && !req.files.image))
            throw new Error;

        var data = req.body;

        data.newImages = req.files.image;
        data.id = req.params.id;

        if (!data.newImages)
            data.newImages = []
        else if (!Array.isArray(data.newImages))
            data.newImages = [data.newImages];

        if (data.delImages && !Array.isArray(data.delImages))
            data.delImages = [data.delImages];

        if (data.newLinks && !Array.isArray(data.newLinks))
            data.newLinks = [data.newLinks];

        if (data.delLinks && !Array.isArray(data.delLinks))
            data.delLinks = [data.delLinks];

        if (data.newShots && !Array.isArray(data.newShots))
            data.newShots = [data.newShots];

        if (req.body.shotWidth)
            var shotWidth = req.body.shotWidth;

        if (req.body.shotHeight)
            var shotHeight = req.body.shotHeight;

        var editObj =
        {
            $set: {}
        };

        var updateObj = {}

        Project.findOne({_id: data.id}, function (error, project) {
            if (error) {
                return next(error);
            }

            editObj.$set.title = data.title ? data.title : '';
            editObj.$set.description = data.description ? data.description : '';

            if (data.delImages) {
                if (!editObj.$pullAll)
                    editObj.$pullAll = {};

                editObj.$pullAll.images = data.delImages;
            }

            if (data.newLinks) {
                if (!updateObj.$push)
                    updateObj.$push = {};

                updateObj.$push.links = {$each: data.newLinks};
            }

            if (data.delLinks) {
                if (!editObj.$pullAll)
                    editObj.$pullAll = {};

                editObj.$pullAll.links = data.delLinks;
            }

            if (data.newImages) {
                if (!updateObj.$push)
                    updateObj.$push = {};

                updateObj.$push.images = {$each: []};
            }

            var promises1 = [];
            var promises2 = [];

            setProjectOrder(data.order, project, promises2);

            if (data.newShots)
                data.newShots.forEach(function(value, index) {
                    var defer = vow.defer();

                    promises1.push(defer.promise());

                    createScreenshot(value, {width: shotWidth, height: shotHeight}, function(shot) {
                        data.newImages.push(shot);

                        defer.resolve();
                    });
                });

            vow.all(promises1).then(function() {

                if (data.delImages)
                    data.delImages.forEach(function (value, index) {
                        var defer = vow.defer();

                        promises2.push(defer.promise());

                        deleteImage(value, function() {
                            defer.resolve();
                        });
                    });

                var responseNewImages = [];

                data.newImages.forEach(function (value, index) {

                    var defer = vow.defer();

                    uploadImage(path.join(config.TEMP, value.name), function (error, result) {
                        fs.unlink(result.src);

                        if (error)
                            return next(error);

                        updateObj.$push.images.$each.push(result.dst);

                        responseNewImages.push(result.dst);

                        defer.resolve();
                    });

                    promises2.push(defer.promise());
                });

                vow.all(promises2).then(function (result) {
                    project.update(editObj, function (error) {
                        if (error) {
                            return next(error);
                        }

                        project.update(updateObj, function (error) {
                            if (error) {
                                return next(error);
                            }

                            res.send({newImages: responseNewImages});
                        });
                    });
                });
            });
        });
    }
};
