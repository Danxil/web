var mongoose = require('mongoose');

require('../../models/user');
require('../../models/group');
require('../../models/loginToken');

var User = mongoose.model('User');
var Group = mongoose.model('Group');
var LoginToken = mongoose.model('LoginToken');

function checkUser(req, res, next, checkGroup)
{
	if (req.session.login)
		User.findOne({login: req.session.login}, {login: true, group: true}, function(error, user)
		{
			if (error)
				return next(error);
				
			if (user)
			{
				Group.findOne({id: user.group}, function(error, group)
				{
					if (error)
						return next(error);
					
					if (!group || checkGroup < group._doc.id)
						return res.redirect('/session');
						
					req.currentUser = user;

					req.currentUser._doc.group = group.name;
					
					next();
				});
			}
			else
				res.redirect('/session');
		});
	else if (req.cookies.logintoken)
	{
		var loginTokenCookie = JSON.parse(req.cookies.logintoken);
		
		LoginToken.findOne({login: loginTokenCookie.login, series: loginTokenCookie.series}, function(error, loginToken)
		{
			if (error)
				return next(error);
			
			if (!loginToken)
				return res.redirect('/session'); //предупреждение пользователю
			else if (loginTokenCookie.token != loginToken.token)
				return res.redirect('/session'); //предупреждение пользователю
			
			User.findOne({login: loginTokenCookie.login}, {login: true, group: true}, function(error, user)
			{
				if (error)
					return next(error);
				
				var newToken = loginToken.randomValue();
				
				loginToken.update({$set: {token: newToken}}, function()
				{
					if (error)
						return next(error);
					
					req.session.login = user.login;
					
					res.cookie('logintoken', loginToken.cookieValue(),
					{
						expires: new Date(Date.now() + 2 * 604800000),
						path: '/'
					});
					
					Group.findOne({id: user.group}, function(error, group)
					{
						if (error)
							return next(error);

						if (!group || checkGroup < group._doc.id)
							res.redirect('/session');
							
						req.currentUser = user;

						req.currentUser._doc.group = group.name;
						
						next();
					});
				});
			});
		});
	}
	else
		res.redirect('/session');
}

module.exports =
{
	admin: function(req, res, next)
	{
		checkUser(req, res, next, 0)
	},
	user: function(req, res, next)
	{
		checkUser(req, res, next, 1)
	},
	
}