'use strict';

exports.getReglaInconsistencia = function(models){
	return function(req,res){
		var Reglasinconsistencias = models.reglasinconsistencias();
		var _id = req.params._id;
		if (_id)
		{
			Reglasinconsistencias.findOne({'_id':id},function(err,data){
				if (err) { console.error(err); res.status(500); res.end(); return ; }
				res.json (data);
			});
		}else{
			Reglasinconsistencias.find({},function(err,data){
				if (err) { console.error(err); res.status(500); res.end(); return ; }
				res.json (data);
			});
		}
	}
}


exports.updateReglaInconsistencia = function(models){
	return function(req, res) {
		var Reglasinconsistencias = models.reglasinconsistencias();
	    var id = req.params.id;

	    var content = req.body;
	    Reglasinconsistencias.update({'_id':id}, content, { upsert: true }, function(e){
			if (e){
				 res.send({'error':'An error has occurred'});
			}else{
				res.send(content);
			}
		});
	}
}

exports.newReglaInconsistencia = function(models){
	return function(req, res) {
		var Reglasinconsistencias = models.reglasinconsistencias();
	    var content = req.body;
	    new Reglasinconsistencias(content).save( function(e){
			if (e){
				 res.send({'error':'An error has occurred'});
			}else{
				res.send(content);
			}
		});
	}
}

exports.removeReglaInconsistencia = function(models){
	return function(req, res) {
		var Reglasinconsistencias = models.reglasinconsistencias();
	    var id = req.params.id;
	    var content = req.body;
	    Reglasinconsistencias.remove({'_id':id}, function(e){
			if (e){
				 res.send({'error':'An error has occurred'});
			}else{
				res.send(content);
			}
		});
	}
}