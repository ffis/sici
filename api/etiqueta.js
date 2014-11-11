'use strict';

exports.getEtiqueta = function(models){
	return function(req,res){
		var etiqueta = models.etiqueta();
		var _id = req.params._id;
		if (_id)
		{
			etiqueta.findOne({'_id':id},function(err,data){
				if (err) { console.error(err); res.status(500); res.end(); return ; }
				res.json (data);
			});
		}
		etiqueta.find({},function(err,data){
			if (err) { console.error(err); res.status(500); res.end(); return ; }
			res.json (data);
		});
	}
}


exports.updateEtiqueta = function(models){
	return function(req, res) {
		var etiqueta = models.etiqueta();
	    var id = req.params.id;

	    var content = req.body;
	    etiqueta.update({'_id':id}, content, { upsert: true }, function(e){
			if (e){
				 res.send({'error':'An error has occurred'});
			}else{
				res.send(content);
			}
		});
	}
}

exports.newEtiqueta = function(models){
	return function(req, res) {
		var etiqueta = models.etiqueta();
	    var content = req.body;
	    new etiqueta(content).save( function(e){
		//etiqueta.update({'_id':id}, content, { upsert: true }, function(e){
			if (e){
				 res.send({'error':'An error has occurred'});
			}else{
				res.send(content);
			}
		});
	}
}

exports.removeEtiqueta = function(models){
	return function(req, res) {
		var etiqueta = models.etiqueta();
	    var id = req.params.id;
	    var content = req.body;
	    etiqueta.remove({'_id':id}, function(e){
			if (e){
				 res.send({'error':'An error has occurred'});
			}else{
				res.send(content);
			}
		});
	}
}