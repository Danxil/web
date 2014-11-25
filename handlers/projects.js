var config = require('../config.js');

var mongoose = require('mongoose');
var path = require('path');
var fs = require('fs-extra');
var im = require('imagemagick');
var webshot = require('webshot');
var vow = require('vow');

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
    im.crop({
        srcPath: path.join(config.TEMP, file.name),
        dstPath: path.join(config.CLOUD, file.name),
        width: 512,
        quality: 1
    }, function(error, stdout, stderr){

        callback(error, file.name);
    });
}

createScreenshot = function(url, callback) {
    var options = {
        screenSize: {
            width: 1024,
            height: 1080
        },
        quality: 100
    }

    var shot = {
        name: Math.random() * 1000000 + '.png'
    }

    webshot(url, path.join(config.TEMP, shot.name), options, function(error) {
        callback(error, shot);
    });
}

module.exports =
{
    get: function (req, res, next) {
        Project.find(function (error, projects) {
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
                    fs.unlink(value, function ()
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

        var attachImages = req.files.image;

        if (!attachImages)
            attachImages = []
        else if (!Array.isArray(attachImages))
            attachImages = [attachImages];

        project.images = [];

        var createShotDefers = [];

        var responseNewImages = [];

        if (project.links)
            project.links.forEach(function(value, index) {
                var defer = vow.defer();

                createShotDefers.push(defer.promise());

                createScreenshot(value, function(error, shot) {
                    if (error)
                        return next(error);

                    attachImages.push(shot);

                    defer.resolve();
                });
            });

        vow.all(createShotDefers).then(function() {
            var attachImagesPromises = [];

            if (attachImages.length)
                attachImages.forEach(function (value, index) {
                    var defer = vow.defer();

                    attachImagesPromises.push(defer.promise());

                    uploadImage(value, function (error, image) {
                        if (error)
                            return next(error);

                        project.images.push(image);

                        responseNewImages.push(image);

                        defer.resolve();

                        fs.unlink(path.join(config.TEMP, image));
                    });
                });

            vow.all(attachImagesPromises).then(function() {
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

            createShotPromises = [];

            if (data.newLinks)
                data.newLinks.forEach(function(value, index) {
                    var defer = vow.defer();

                    createShotPromises.push(defer.promise());

                    createScreenshot(value, function(error, shot) {
                        if (error)
                            return next(error);

                        data.newImages.push(shot);

                        defer.resolve();
                    });
                });

            vow.all(createShotPromises).then(function() {

                if (data.delImages)
                    data.delImages.forEach(function (value, index) {
                        fs.exists(path.join(config.CLOUD, value), function (exists) {
                            if (exists)
                                fs.unlinkSync(path.join(config.CLOUD, value));
                        });
                    });

                var responseNewImages = [];
                uploadImageDefers = [];

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

                    uploadImageDefers.push(defer.promise())
                });

                vow.all(uploadImageDefers).then(function (result) {
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
