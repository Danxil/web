var mailer = require('nodemailer');
//var sendgrid  = require('sendgrid')(api_user, api_key);

var transporter = mailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'danxilggggaa@gmail.com',
        pass: '7d1cE3a6'
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
        if (!req.body.clientContact)
            throw new Error;

		var mailOptions = {
			from: 'Аццкое детище <danxilggggaa@gmail.com>',
			to: 'danxil@list.ru',
			subject: 'Заказ на сайт! ✔',
			html: 'Контакт заказчика: <b>' + req.body.clientContact + '</b>'
		};
		
		transporter.sendMail(mailOptions, function(error, info){
			console.log(error);

			if(error)
				return next(error);
			else
				res.send(200);
		});
	}
}