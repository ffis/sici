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
				res.status(404).json({'error': 'An error has occurred', 'details': 'Not found'});
			} else {
				res.json(data);
			}
		};
	};

	module.exports.notFoundHelper = function(res){
		res.status(404).json({'error': 'An error has occurred', 'details': 'Not found'});
		logger.trace(err);
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
		res.status(409).json({'error': 'Missing parameter', 'details': parametername});
	};

})(module, console);

/*
	BadRequestError (400 Bad Request)
	UnauthorizedError (401 Unauthorized)
	PaymentRequiredError (402 Payment Required)
	ForbiddenError (403 Forbidden)
	NotFoundError (404 Not Found)
	MethodNotAllowedError (405 Method Not Allowed)
	NotAcceptableError (406 Not Acceptable)
	ProxyAuthenticationRequiredError (407 Proxy Authentication Required)
	RequestTimeoutError (408 Request Time-out)
	ConflictError (409 Conflict)
	GoneError (410 Gone)
	LengthRequiredError (411 Length Required)
	PreconditionFailedError (412 Precondition Failed)
	RequestEntityTooLargeError (413 Request Entity Too Large)
	RequesturiTooLargeError (414 Request-URI Too Large)
	UnsupportedMediaTypeError (415 Unsupported Media Type)
	RequestedRangeNotSatisfiableError (416 Requested Range Not Satisfiable)
	ExpectationFailedError (417 Expectation Failed)
	ImATeapotError (418 I'm a teapot)
	UnprocessableEntityError (422 Unprocessable Entity)
	LockedError (423 Locked)
	FailedDependencyError (424 Failed Dependency)
	UnorderedCollectionError (425 Unordered Collection)
	UpgradeRequiredError (426 Upgrade Required)
	PreconditionRequiredError (428 Precondition Required)
	TooManyRequestsError (429 Too Many Requests)
	RequestHeaderFieldsTooLargeError (431 Request Header Fields Too Large)
	InternalServerError (500 Internal Server Error)
	NotImplementedError (501 Not Implemented)
	BadGatewayError (502 Bad Gateway)
	ServiceUnavailableError (503 Service Unavailable)
	GatewayTimeoutError (504 Gateway Time-out)
	HttpVersionNotSupportedError (505 HTTP Version Not Supported)
	VariantAlsoNegotiatesError (506 Variant Also Negotiates)
	InsufficientStorageError (507 Insufficient Storage)
	BandwidthLimitExceededError (509 Bandwidth Limit Exceeded)
	NotExtendedError (510 Not Extended)
	NetworkAuthenticationRequiredError (511 Network Authentication Required)
	BadDigestError (400 Bad Request)
	BadMethodError (405 Method Not Allowed)
	InternalError (500 Internal Server Error)
	InvalidArgumentError (409 Conflict)
	InvalidContentError (400 Bad Request)
	InvalidCredentialsError (401 Unauthorized)
	InvalidHeaderError (400 Bad Request)
	InvalidVersionError (400 Bad Request)
	MissingParameterError (409 Conflict)
	NotAuthorizedError (403 Forbidden)
	RequestExpiredError (400 Bad Request)
	RequestThrottledError (429 Too Many Requests)
	ResourceNotFoundError (404 Not Found)
	WrongAcceptError (406 Not Acceptable)
*/
