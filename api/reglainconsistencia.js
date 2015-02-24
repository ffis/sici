(function(module){
	'use strict';

	module.exports.getReglaInconsistencia = function(models){
		return function(req, res){
			var Reglasinconsistencias = models.reglasinconsistencias();
			var id = req.params.id;
			if (typeof id !== 'undefined')
			{
				Reglasinconsistencias.findOne({'_id': id}, function(err, data){
					if (err) { console.error(err); res.status(500).end(); return ; }
					res.json(data);
				});
			}else{
				Reglasinconsistencias.find({}, function(err, data){
					if (err) { console.error(err); res.status(500).end(); return ; }
					res.json(data);
				});
			}
		};
	};


	module.exports.updateReglaInconsistencia = function(models){
		return function(req, res) {
			var Reglasinconsistencias = models.reglasinconsistencias();
			var id = req.params.id;

			var content = req.body;
			Reglasinconsistencias.update({'_id': id}, content, { upsert: true }, function(e){
				if (e){
					res.send({'error': 'An error has occurred'}).end();
				}else{
					res.json(content).end();
				}
			});
		};
	};

	module.exports.newReglaInconsistencia = function(models){
		return function(req, res) {
			var Reglasinconsistencias = models.reglasinconsistencias();
			var content = req.body;
			new Reglasinconsistencias(content).save(function(e){
				if (e){
					res.send({'error': 'An error has occurred'});
				}else{
					res.json(content);
				}
			});
		};
	};

	module.exports.removeReglaInconsistencia = function(models){
		return function(req, res) {
			var Reglasinconsistencias = models.reglasinconsistencias();
			var id = req.params.id;
			var content = req.body;
			Reglasinconsistencias.remove({'_id': id}, function(e){
				if (e){
					res.send({'error': 'An error has occurred'}).end();
				}else{
					res.json(content);
				}
			});
		};
	};
})(module);
