var config = require('../config.js');

var mongoose = require('mongoose');
var path = require('path');
var fs = require('fs-extra');

require('../models/project');

var Project = mongoose.model('Project');

var IMAGE_EXTENSIONS =
    [
        'jpeg',
        'jpg',
        'gif',
        'png'
    ];

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

            images.forEach(function (value)
            {
                fs.unlink(path.join(config.CLOUD, value), function ()
                {

                        deleteComplete.push(true);

                        checkDeleteComplete();
                });
            });
        });
    },
    post: function (req, res, next) {
        var project = new Project();

        if (req.body.title)
            project.title = req.body.title;

        if (req.body.description)
            project.description = req.body.description;

        if (req.body.link)
            project.link = req.body.link;

        var images = req.files.image;

        if (images && !Array.isArray(images))
            images = [images];

        project.images = [];

        if (images)
            for (var i = 0; i < images.length; i++) {
                if (images[i].truncated || IMAGE_EXTENSIONS.indexOf(images[i].extension) == -1) {
                    var fileTruncated = true;

                    fs.unlinkSync(images[i].path);

                    images.splice(i, 1);

                    i--;
                }
                else
                    project.images.push(images[i].name);

                if (fileTruncated)
                    res.send(500);
            }

        project.save(function (error, project) {
            if (error) {
                if (images)
                    images.forEach(function (value, index) {
                        fs.unlinkSync(value.path);
                    });

                return next(error);
            }

            if (images) {
                var responseNewImages = [];

                images.forEach(function (value, index) {
                    fs.move(value.path, path.join(config.CLOUD, value.name), function (error) {
                        if (error)
                            return next(error);

                        responseNewImages.push(value.name);

                        if (responseNewImages.length == images.length)
                            res.send({_id: project._id, images: responseNewImages});
                    });
                });
            }
            else
                res.send({_id: project._id});
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
                    fs.exists(path.join(config.CLOUD, value), function(exists)
                    {
                        if (exists)
                            fs.unlinkSync(path.join(config.CLOUD, value));
                    });
                });

            if (data.newImages) {
                if (!updateObj.$push)
                    updateObj.$push = {};

                updateObj.$push.images = {$each: []};

                for (var i = 0; i < data.newImages.length; i++) {
                    if (data.newImages[i].truncated || IMAGE_EXTENSIONS.indexOf(data.newImages[i].extension) == -1) {
                        var fileTruncated = true;

                        fs.unlinkSync(data.newImages[i].path);

                        data.newImages.splice(i, 1);

                        i--;
                    }
                    else
                        updateObj.$push.images.$each.push(data.newImages[i].name);

                }

                if (fileTruncated)
                    return res.send(500);

                Project.update({_id: data.id}, updateObj, function (error) {
                    if (error) {
                        data.newImages.forEach(function (value, index) {
                            fs.unlinkSync(value.path);
                        });

                        return next(error);
                    }

                    var responseNewImages = [];

                    data.newImages.forEach(function (value, index) {
                        fs.move(value.path, path.join(config.CLOUD, value.name), function (error) {
                            if (error)
                                return next(error);

                            responseNewImages.push(value.name);

                            if (responseNewImages.length == data.newImages.length)
                                res.send({newImages: responseNewImages});
                        });
                    });
                });
            }
            else
                res.send(200);
        });
    }
};
