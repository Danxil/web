var express = require('express');
var session = require('express-session');

var checkUser = require('../modules/check-user');

var homeHandlers = require('../handlers/home');
var administrationHandlers = require('../handlers/administration');
var projectsHandlers = require('../handlers/projects');
var sessionHandlers = require('../handlers/session');
var registrationHandlers = require('../handlers/registration');
var usersHandlers = require('../handlers/users');
var orderHandlers = require('../handlers/order');

var router = express.Router();

router.get('/', function(req, res, next) {
    var locale = req.cookies.locale;

    if (locale)
        res.redirect('/' + locale);
    else
        res.redirect('/en');
});

router.get('/en', function(req, res, next) {
    res.cookie('locale', 'en');

    req.setLocale('en');

    homeHandlers.get(req, res, next);
});

router.get('/ru', function(req, res, next) {
    res.cookie('locale', 'ru');

    req.setLocale('ru');

    homeHandlers.get(req, res, next);
});


router.get('/administration', checkUser.admin, administrationHandlers.get);

router.get('/projects', projectsHandlers.get);
router.post('/projects', checkUser.admin, projectsHandlers.post);
router.put('/projects/:id', checkUser.admin, projectsHandlers.put);
router.delete('/projects/:id', checkUser.admin, projectsHandlers.delete);

router.get('/session', sessionHandlers.get);
router.post('/session', sessionHandlers.post);
router.delete('/session', sessionHandlers.delete);

router.get('/registration', registrationHandlers.get);
router.post('/registration', registrationHandlers.post);

router.get('/users', checkUser.admin, usersHandlers.get);
router.put('/users/:id', checkUser.admin, usersHandlers.put);

router.post('/order', orderHandlers.post);

module.exports = router;
