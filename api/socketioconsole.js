(function(module, logger){
	'use strict';

	function socketioconsole(app)
	{
		var io = require('socket.io').listen(app);
		var fns = {
			log: logger.log,
			info: logger.info,
			error: logger.error
		};
		var counter = 0;

		var fn = function(fnname){
			return function(){
				var stackTrace = require('stack-trace'),
					frame = stackTrace.get()[1],
					file = frame.getFileName(),
					line = frame.getLineNumber(),
					functionname = frame.getFunctionName();

				for (var i = 0; i < arguments.length; i++)
				{
					var debugmessage = { id: counter++, type: fnname, time: new Date(), message: JSON.stringify(arguments[i]), line: line, functionname: functionname, file: file };
					io.sockets.emit(fnname, debugmessage);
				}

				fns[fnname].apply(console, arguments);
			};
		};
		for (var funname in fns){
			logger[funname] = fn(funname);
		}
	}

	module.exports = socketioconsole;
})(module, console);
