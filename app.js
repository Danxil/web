var config = require('./config.js');

var express = require('express');

var app = express();
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var multer  = require('multer');
var routes = require('./routes/index');
var methodOverride = require('method-override');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var debug = require('debug')('node_test');

mongoose.connect(config.DB);

var sessinStore = new MongoStore(
{
    url: config.DB + '/sessions'
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');

app.use(session(
{
	secret: 'ololo',
	store: sessinStore
}));
app.use(logger('dev'));
app.use(favicon());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(multer(
{
	dest: config.TEMP,
	limits:
	{
		files: 20,
		fileSize: 5 * 1024 * 1024
	}
}));
app.use(methodOverride(function(req, res)
{
  if (req.body && typeof req.body === 'object' && '_method' in req.body)
  {
    var method = req.body._method
    delete req.body._method
    return method
  }
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/files', express.static(config.CLOUD));

app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
