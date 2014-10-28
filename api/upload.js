exports.update = function(){
	return function (req, res, next) {
		console.log(req.files);
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