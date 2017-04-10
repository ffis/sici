(function(module, logger){
	'use strict';

	const CAS = require('cas');
	let cas = false;

	function init(cassettings){
		cas = new CAS({'base_url': cassettings.baseurl, 'service': cassettings.service});
	}

	module.exports.casLogin = function(req, res, next) {

		if (typeof req.body.notcarmuser !== 'undefined' && req.body.notcarmuser){
			next();

			return;
		}

		const ticket = req.query.ticket;
		if (typeof ticket === 'string' && ticket !== '') {
			if (!cas){
				init(req.metaenvironment.cfg.cas);
			}
			cas.validate(ticket, function(err, status, username) {
				if (err) {
					res.status(300).json({'redirect': req.metaenvironment.cfg.cas.login});
					//req.eh.callbackErrorHelper(err);
				} else if (status && username && typeof username === 'string' && username.trim() !== ''){ 
					//res.json({'status': status, 'username': username});

					req.body.username = username;
					req.body.notcarmuser = false;
					next();
				} else {
					res.status(300).json({'redirect': req.metaenvironment.cfg.cas.login});
				}
			});
		} else {
			res.status(300).json({'redirect': req.metaenvironment.cfg.cas.login});
		}
	};
})(module, console);
