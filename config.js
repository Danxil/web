var path = require('path');
var express = require('express');
var app = express();

module.exports.TEMP = process.env.TEMP_DIR || path.join(__dirname, 'tmp/');
module.exports.CLOUD = process.env.CLOUD_DIR || path.join(__dirname, 'cloud/');
module.exports.DB = process.env.NODE_ENV == 'production' ? 'mongodb://danxil:7d1cE3a8@ds061189.mongolab.com:61189/name' :
                    'mongodb://localhost:27017/name';
