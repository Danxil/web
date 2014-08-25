var mongoose = require('mongoose');

require('../models/user');

var User = mongoose.model('User');

module.exports = 
{
	get: function(req, res, next)
	{
		res.render('registration');
	},
	post: function(req, res, next)
	{
		if (!req.body.login || !req.body.pass)
			throw new Error;
		
		var newUserData = req.body;
		
		User.create({login: newUserData.login, pass: newUserData.pass}, function(error)
		{
			if (error)
				return next(error);
				
			res.send(200);
		});
	}
}