
module.exports =
{
	get: function(req, res, next)
	{
		res.render('administration', {currentUser: req.currentUser});
	}
}