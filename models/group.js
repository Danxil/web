var mongoose = require('mongoose');

var Group = new mongoose.Schema(
{
	_id: 
	{
		type: Number,
		required: true,
		unique: true,
		maxLength: 1000
	},
	name: 
	{
		type: String,
		required: true,
		unique: true,
		maxLength: 1000
	}
});

mongoose.model('Group', Group);