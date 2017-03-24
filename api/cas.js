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
				logger.log(35, ticket, err, status, username);
				if (err) {
					req.eh.callbackErrorHelper(err);
				} else {
					res.json({'status': status, 'username': username});

					//next();
				}
			});
		} else {
			logger.log(req.metaenvironment.cfg);
			res.status(300).json({'redirect': req.metaenvironment.cfg.cas.login});
		}
	};
})(module, console);
