var mongoose = require('mongoose');

require('../models/user');

var User = mongoose.model('User');

module.exports = 
{
	get: function(req, res, next)
	{
		if (!req.xhr)
			res.render('users');
		else
			User.find({}, {login: true, group: true}, function(error, data)
			{
				if (error)
					return next(error);
				
				res.send(data);
			});
	},
	put: function(req, res, next)
	{
		if (!req.body.group === undefined || !req.params.id === undefined)
			throw new Error;
		
		var editUserData = req.body;
		
		User.update({login: req.params.id}, {$set: editUserData}, function(error)
		{
			if (error)
				return next(error);
				
			res.send(200);
		});
	}
}