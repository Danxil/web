var mongoose = require('mongoose');

require('../models/user');
require('../models/loginToken');

var User = mongoose.model('User');
var LoginToken = mongoose.model('LoginToken');


module.exports = 
{
	get: function(req, res, next)
	{
		res.render('authorisation');
	},
	post: function(req, res, next)
	{
		if (!req.body.login || !req.body.pass)
			throw new Error;
		
		var authorisationData = req.body;
		
		User.findOne({login: authorisationData.login}, function(error, user)
		{
			if (error)
				return next(error);
				
				if (user && user.authorisation(authorisationData.pass))
				{
					req.session.login = user.login;
					
					if (authorisationData.remember)
					{
						loginToken = new LoginToken({login: authorisationData.login});
						
						LoginToken.findOneAndRemove({login: authorisationData.login}, function(error)
						{
							if (error)
								return next(error);
								
							loginToken.save(function(error)
							{
								if (error)
									return next(error);
									
								res.cookie('logintoken', loginToken.cookieValue(),
								{
									expires: new Date(Date.now() + 2 * 604800000),
									path: '/'
								});
								
								return res.sendStatus(200);
							});
						});
					}
					else
						return res.sendStatus(200);
					
				}
				else
					return res.sendStatus(401);
		});
	},
	delete: function(req, res, next)
	{
		if (req.session)
			req.session.destroy(function(error)
			{
				if (error)
					return next(error);
				
				if (req.cookies.logintoken)
				{
					var loginTokenCookie = JSON.parse(req.cookies.logintoken);
					
					LoginToken.findOneAndRemove({login: loginTokenCookie.login, series: loginTokenCookie.series, token: loginTokenCookie.token}, function(error, data)
					{
						if (error)
							return next(error);
						
						res.clearCookie('logintoken');
						
						res.sendStatus(200);
					});
				}
				else
					res.sendStatus(200);
			});
	
	}
};