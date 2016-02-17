var request = require('request');

exports.uncrypt = function(urlbasedecrypt){
	'use strict';
	return function(req, res, next)
	{//espera en body un objeto json {t:sesionencriptada}

		//console.log(req.body);
		if (typeof req.body.notcarmuser !== 'undefined' && req.body.notcarmuser) { next(); return; }

		var buffer = req.body.t,
			url = urlbasedecrypt + buffer;

		request(url, function(err, response, txt) {
			if (err){
				res.status(401).send(err);
			}else if (txt){
				//aqui debería comprobarse si el lapso de tiempo es válido
				var parsed = {};
				try {
					parsed = JSON.parse(txt);
					req.body.token = parsed;
					req.body.username = parsed.carmid;
					req.body.password = 'password';
					next();
				}catch (exc){
					console.error('Error parseando JSON token-sesión ' + txt);
					console.error('Wrong token password');
					res.status(401).send('Wrong token password');
				}
			} else {
				console.error('Wrong token password');
				res.status(401).send('Wrong token password');
			}
		});
	};
};
