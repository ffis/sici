(function(module, logger){
	'use strict';
	const request = require('request');

	module.exports.uncrypt = function(req, res, next){
		if (typeof req.body.notcarmuser !== 'undefined' && req.body.notcarmuser){
			next();

			return;
		}

	const urlbasedecrypt = req.metaenvironment.cfg.urlbasedecrypt;
		const buffer = req.body.t,
			url = urlbasedecrypt + buffer;

		request(url, function(err, response, txt) {
			if (err){
				res.status(401).send({error: err});

				//next({error: err});
			} else if (txt){
				//aqui debería comprobarse si el lapso de tiempo es válido
				try {
					const parsed = JSON.parse(txt);
					req.body.token = parsed;
					req.body.username = parsed.carmid;
					req.body.password = 'password';

					next();
				} catch (exc){
					logger.error('Error parseando JSON token-sesión ' + txt);
					logger.error('Wrong token password');
					res.status(401).send({error: 'Wrong token password'});

					//next({error: 'Wrong token password'});
				}
			} else {
				logger.error('Wrong token password');
				res.status(401).send({error: 'Wrong token password'});

				//next({error: 'Wrong token password'});
			}
		});
	};

})(module, console);
