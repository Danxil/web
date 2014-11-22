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
        srcPath: file.path,
        dstPath: path.join(config.CLOUD, file.name),
        width: 512,
        quality: 1
    }, function(error, stdout, stderr){

        callback(error);
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
        name: Math.random() + '.png'
    }

    shot.path = path.join(config.TEMP, shot.name + '.png')

    webshot(url, shot.path, options, function(error) {
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
                    fs.unlink(value.path, function ()
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

        if (attachImages && !Array.isArray(attachImages))
            attachImages = [attachImages];

        project.images = [];

        createShotPromises = [];

        if (project.links)
            project.links.forEach(function(value, index) {
                var defer = vow.defer();

                createShotPromises.push(defer.promise());

                createScreenshot(value, function(error, shot) {
                    if (error)
                        return next(error);

                    project.images.push({name: shot.name, path: shot.path});

                    defer.resolve();
                });
            });

        vow.all(createShotPromises).then(function() {
            if (attachImages) {
                attachImages.forEach(function(value, index) {
                    project.images.push({name: value.name, path: value.path});
                });
            }

            images = project.images

            project.save(function (error, project) {
                if (error) {
                    if (images.length)
                        images.forEach(function (value, index) {
                            fs.unlinkSync(value.path);
                        });

                    return next(error);
                }

                if (project.images.length) {
                    var responseNewImages = [];
                    var uploadImageDefers = []

                    project.images.forEach(function (value, index) {
                        var defer = vow.defer();

                        uploadImageDefers.push(defer.promise());

                        uploadImage(value, function (error) {
                            if (error)
                                return next(error);

                            responseNewImages.push(value);

                            defer.resolve();

                            fs.unlink(value.path);
                        });
                    });

                    vow.all(uploadImageDefers).then(function() {
                        res.send({_id: project._id, images: responseNewImages});
                    });
                }
                else
                    res.send({_id: project._id});
            });
        });
    },
    put: function (req, res, next) {
        if (!req.params.id || (!req.body.title && !req.body.description && !req.body.link && !req.body.delImage && !req.files.image))
            throw new Error;

        var data = req.body;

        data.id = req.params.id;
        data.newImages = req.files.image;
        data.delImages = req.body.delImage;

        if (data.newImages && !Array.isArray(data.newImages))
            data.newImages = [data.newImages];

        if (data.delImages && !Array.isArray(data.delImages))
            data.delImages = [data.delImages];

        var editObj =
        {
            $set: {}
        };

        var updateObj = {};

        editObj.$set.title = data.title ? data.title : '';
        editObj.$set.description = data.description ? data.description : '';
        editObj.$set.link = data.link ? data.link : '';

        if (data.delImages) {
            if (!editObj.$pullAll)
                editObj.$pullAll = {};

            editObj.$pullAll.images = data.delImages;
        }

        Project.update({_id: data.id}, editObj, function (error) {
            if (error) {
                if (data.newImages)
                    data.newImages.forEach(function (value, index) {
                        fs.unlinkSync(value.path);
                    });

                return next(error);
            }

            if (data.delImages)
                data.delImages.forEach(function (value, index) {
                    fs.exists(value.path, function(exists)
                    {
                        if (exists)
                            fs.unlinkSync(value.path);
                    });
                });

            if (data.newImages) {
                if (!updateObj.$push)
                    updateObj.$push = {};

                updateObj.$push.images = {$each: []};

                data.newImages.forEach(function (value, index) {
                    updateObj.$push.images.$each.push(data.newImages[i].name);
                });

                Project.update({_id: data.id}, updateObj, function (error) {
                    if (error) {
                        data.newImages.forEach(function (value, index) {
                            fs.unlinkSync(value.path);
                        });

                        return next(error);
                    }

                    var responseNewImages = [];
                    var uploadImageDefers = []

                    data.newImages.forEach(function (value, index) {
                        var defer = vow.defer();

                        uploadImage(value, function (error) {
                            if (error)
                                return next(error);


                            responseNewImages.push(value);

                            defer.resolve();

                            fs.unlink(value.path);
                        });

                        uploadImageDefers.push(defer.promise())
                    });

                    vow.all(uploadImageDefers).then(function(result) {
                        res.send({newImages: responseNewImages});
                    });
                });
            }
            else
                res.send(200);
        });
    }
};
