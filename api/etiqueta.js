(function(module){
	'use strict';

	module.exports.getEtiqueta = function(models){
		return function(req, res){
			var etiqueta = models.etiqueta();
			var id = req.params._id;
			if (id)
			{
				etiqueta.findOne({'_id': id}, function(err, data){
					if (err){
						console.error(err); res.status(400).end();
					} else if (!data) {
						res.status(404).end();
					} else {
						res.json(data);
					}
				});
			}else{
				etiqueta.find({}, function(err, data){
					if (err) { console.error(err); res.status(500); res.end(); return ; }
					res.json(data);
				});
			}
		};
	};

	module.exports.updateEtiqueta = function(models){
		return function(req, res) {
			var etiqueta = models.etiqueta();
			var id = req.params.id;

			var content = req.body;
			etiqueta.update({'_id': id}, content, { upsert: true }, function(e){
				if (e){
					res.status(400).json({'error': 'An error has occurred'});
				}else{
					res.json(content);
				}
			});
		};
	};

	module.exports.newEtiqueta = function(models){
		return function(req, res) {
			var Etiqueta = models.etiqueta();
			var content = req.body;
			new Etiqueta(content).save( function(e){
				if (e){
					res.status(400).json({'error': 'An error has occurred'});
				}else{
					res.json(content);
				}
			});
		};
	};

	module.exports.removeEtiqueta = function(models){
		return function(req, res) {
			var etiqueta = models.etiqueta();
			var id = req.params.id;
			var content = req.body;
			etiqueta.remove({'_id': id}, function(e){
				if (e){
					res.status(400).json({'error': 'An error has occurred'});
				}else{
					res.json(content);
				}
			});
		};
	};
})(module);
