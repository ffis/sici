(function(module, logger){
	'use strict';

	module.exports.cbWithDefaultValue = function(res, defaultvalue){
		
		return function(e){
			if (e){
				res.status(500).json(e);
				logger.trace(e);
			} else {
				res.json(defaultvalue);
			}
		};
	};

	module.exports.cb = function(res){
		
		return function(e, value){
			if (e){
				res.status(500).json(e);
				logger.trace(e);
			} else {
				res.json(value);
			}
		};
	};

	module.exports.errorHelper = function(res, errCode, defaultMessage){
		
		return function(err){
			let message = '',
				errorCode = 500;
			if (!defaultMessage && isNaN(errCode)){
				message = errCode;
			} else if (defaultMessage){
				message = defaultMessage;
			} else {
				message = 'An error has occurred';
			}
			if (Number.isInteger(errCode)){
				errorCode = errCode;
			}

			res.status(errorCode).json({'error': message, 'details': err});
			logger.trace(err);
		};
	};

	module.exports.okHelper = function(res, shouldSend400onEmpty){
		
		return function(data){
			if (!data && shouldSend400onEmpty){
				res.status(400).json({'error': 'An error has occurred', 'details': 'Not found'});
			} else {
				res.json(data);
			}
		};
	};

	module.exports.notFoundHelper = function(res){
		res.status(400).json({'error': 'An error has occurred', 'details': 'Not found'});
	};

	module.exports.unauthenticatedHelper = function(res, details){
		res.status(401).json({'error': 'Unauthenticated', 'details': details});
	};

	module.exports.unauthorizedHelper = function(res, details){
		res.status(403).json({'error': 'Unauthorized', 'details': details});
	};

	module.exports.callbackErrorHelper = function(res, err){
		res.status(500).json({'error': 'An error has occurred', 'details': err});
		logger.trace(err);
	};

	module.exports.missingParameterHelper = function(res, parametername){
		res.status(400).json({'error': 'Missing parameter', 'details': parametername});
	};

})(module, console);

/*
req.eh.okHelper(res, true), req.eh.errorHelper(res)
req.eh.cb(res)
req.eh.cbWithDefaultValue(res, value)
*/
