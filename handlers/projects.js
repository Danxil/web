var config = require('../config.js');

var mongoose = require('mongoose');
var path = require('path');
var fs = require('fs-extra');
var im = require('imagemagick');
var phantom = require('phantom');
var vow = require('vow');
var sizeOf = require('image-size');

require('../models/project');

var Project = mongoose.model('Project');

var IMAGE_EXTENSIONS =
    [
        'jpeg',
        'jpg',
        'gif',
        'png'
    ];

uploadImage = function(file, callback) {
    var src = path.join(config.TEMP, file.name);
    var dest = path.join(config.CLOUD, file.name);

    var dimensions = sizeOf(src);

    var resizeWidth = 500;
    var resizeHeight = resizeWidth / dimensions.width * dimensions.height;

    im.resize({
        srcPath: path.join(config.TEMP, file.name),
        dstPath: path.join(config.TEMP, file.name),
        width: resizeWidth,
        height: resizeHeight,
        quality: 1
    }, function(error, stdout, stderr) {
        if (error)
            return next(error);

        var dimensions = sizeOf(src);

        var croupHeight = dimensions.height < 1080 ? dimensions.height : 1080;


        im.crop({
            srcPath: path.join(config.TEMP, file.name),
            dstPath: path.join(config.CLOUD, file.name),
            width: resizeWidth,
            height: croupHeight,
            gravity: 'North',
            quality: 1
        }, function(error, stdout, stderr) {
            if (error)
                return next(error);

            callback(error, file.name);
        });
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
                page.render(dest, function() {
                    ph.exit();

                    callback(shot);
                });
            });
        });
    });
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
                    fs.unlink(path.join(config.CLOUD, value), function ()
                    {

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

        var defer = vow.defer();

        promises2.push(defer.promise());

        Project.find().sort({order: -1}).limit(1).exec(function (error, projects) {
            if (error)
                return next(error);

            project.order = projects[0].order + 1;

            defer.resolve();
        });

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

                    uploadImage(value, function (error, image) {
                        if (error)
                            return next(error);

                        project.images.push(image);

                        responseNewImages.push(image);

                        defer.resolve();

                        fs.unlink(path.join(config.TEMP, image));
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

            if (data.order && data.order != project.order) {
                var skip = data.order < project.order ? data.order - 1 : project.order - 1
                var limit = Math.abs(data.order - project.order) + 1

                var defer = vow.defer();

                promises2.push(defer.promise());

                Project.find().sort({order: 1}).skip(skip).limit(limit).exec(function (error, projects) {
                    if (error)
                        return next(error);

                    defer.resolve();

                    projects.forEach(function(value, index) {
                        if (value.id != project.id)
                            var newOrder = data.order < project.order ? value.order + 1 : value.order - 1
                        else
                            var newOrder = data.order

                        var defer = vow.defer();

                        promises2.push(defer.promise());

                        value.update({$set: {order: newOrder}}).exec(function (error, projects) {
                            if (error)
                                return next(error)

                            defer.resolve();
                        });
                    });
                });
            }

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
                        fs.exists(path.join(config.CLOUD, value), function (exists) {
                            if (exists)
                                fs.unlinkSync(path.join(config.CLOUD, value));
                        });
                    });

                var responseNewImages = [];

                data.newImages.forEach(function (value, index) {

                    var defer = vow.defer();

                    uploadImage(value, function (error, image) {
                        if (error)
                            return next(error);

                        updateObj.$push.images.$each.push(image);

                        responseNewImages.push(image);

                        defer.resolve();

                        fs.unlink(path.join(config.TEMP, image));
                    });

                    promises2.push(defer.promise())
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
