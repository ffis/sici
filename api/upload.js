'use strict';

exports.update = function(){
	return function (req, res, next) {
		if (next){
			next();
		}else{
			var response = {
				fichero : req.files.file.name,
				time : new Date()
			};
			res.json(response);
		}
	}
};
