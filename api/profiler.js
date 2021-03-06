(function(module, gc, global, logger){
'use strict';

	var memwatch = require('memwatch');

	module.exports = function profiler(){
		return function(req, res, next){
			const end = res.end,
				previousinvoke = new memwatch.HeapDiff();

			// state snapshot
			if (typeof gc === 'function') {
				gc();
			} else if (global && global.gc){
				global.gc();
			}

			// proxy res.end()
			res.end = function(data, encoding){
				res.end = end;
				res.end(data, encoding);

				const diff = previousinvoke.end();
				previousinvoke = new memwatch.HeapDiff();
				diff.change.details.sort(function(a, b){ return (b.size_bytes - a.size_bytes); });
				logger.log(JSON.stringify(diff));
			};

			next();
		};
	};
})(module, gc, global, console);
