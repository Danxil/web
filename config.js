var path = require('path');
var express = require('express');
var app = express();

module.exports.DB = app.get('env') == 'production' ? 'mongodb://danxil:7d1cE3a8@ds061189.mongolab.com:61189/name' :
                    'mongodb://localhost:27017/name';
