(function(module, logger){
	'use strict';

	function socketioconsole(app){
		const io = require('socket.io').listen(app);
		const fns = {
			log: logger.log,
			info: logger.info,
			error: logger.error
		};
		let counter = 0;

		function fn(fnname){

			return function(...args){
				const stackTrace = require('stack-trace'),
					frame = stackTrace.get()[1],
					file = frame.getFileName(),
					line = frame.getLineNumber(),
					functionname = frame.getFunctionName();

				for (let i = 0; i < args.length; i += 1){
					const debugmessage = {
						'id': counter += 1,
						'type': fnname,
						'time': new Date(),
						'message': JSON.stringify(args),
						'line': line,
						'functionname': functionname,
						'file': file
					};
					io.sockets.emit(fnname, debugmessage);
				}

				fns[fnname].apply(console, args);
			};
		}

		for (const funname in fns){
			if ({}.hasOwnProperty.call(fns, funname)) {
				logger[funname] = fn(funname);
			}
		}
	}

	module.exports = socketioconsole;
})(module, console);
