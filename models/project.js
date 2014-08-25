var mongoose = require('mongoose');

var Project = new mongoose.Schema(
{
	title: 
	{
		type: String,
		required: true,
		maxLength: 100
	},
	description:
	{
		type: String,
		maxLength: 1000
	},
	link:
	{
		type: String,
		maxLength: 1000
	},
	images:
	{
		type: Array,
	}
});

mongoose.model('Project', Project);