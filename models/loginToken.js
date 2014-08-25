var mongoose = require('mongoose');
var crypto = require('crypto');

var LoginToken = new mongoose.Schema(
{
	login: 
	{
		type: String,
		required: true,
		unique: true,
		maxLength: 1000
	},
	token:
	{
		type: String
	},
	series:
	{
		type: String
	}
});

LoginToken.methods.randomValue = function()
{
	return Math.round((new Date().valueOf() * Math.random())) + '';
};

LoginToken.methods.cookieValue = function()
{
	return JSON.stringify({login: this.login, series: this.series, token: this.token});
};

LoginToken.pre('save', function(next)
{
	this.token = this.randomValue();
	this.series = this.randomValue();
	
	next();
});

mongoose.model('LoginToken', LoginToken);