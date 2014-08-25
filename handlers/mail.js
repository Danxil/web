var mailer = require('nodemailer');

var transporter = mailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'amokmetal@gmail.com',
        pass: '7d1cE3a8'
    }
});

module.exports =
{
	get: function(req, res, next)
	{
		res.render('mail');
	},
	post: function(req, res, next)
	{
		var mailOptions = {
			from: 'Fred Foo ✔ <amokmetal@gmail.com>',
			to: 'danxil@list.ru',
			subject: 'Hello ✔',
			text: 'Hello world ✔', 
			html: '<b>Hello world ✔</b>'
		};
		
		transporter.sendMail(mailOptions, function(error, info){
			if(error)
				return next(error);
			else
				res.send(200);
		});
	}
}