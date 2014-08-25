var mongoose = require('mongoose');
var crypto = require('crypto');

var User = new mongoose.Schema(
{
	login: 
	{
		type: String,
		required: true,
		unique: true,
		maxLength: 1000
	},
	password:
	{
		type: String,
		required: true,
		maxLength: 1000,
	},
	salt:
	{
		type: String,
		required: true
	},
	group:
	{
		type: Number,
		ref: 'Group',
		required: true,
        default: 1
	},
	pass:
	{
		type: String,
		set: function(pass)
		{
			this.salt = this.makeSalt(),
			this.password = this.encryptPass(pass)
		}
	}
});

User.methods.authorisation = function(pass)
{
	return this.encryptPass(pass) === this.password;
};

User.methods.encryptPass = function(pass)
{
	return crypto.createHmac('sha1', this.salt).update(pass).digest('hex');	
};

User.methods.makeSalt = function()
{
	return Math.round((new Date().valueOf() * Math.random())) + '';
}


mongoose.model('User', User);