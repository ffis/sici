(function(module){
	'use strict';

	module.exports.getEtiqueta = function(models){
		return function(req, res){
			var etiqueta = models.etiqueta();
			var id = req.params._id;
			if (id){
				etiqueta.findOne({'_id': id}, function(err, data){
					if (err){
						console.error(err);
						res.status(400).json({'error': 'An error has occurred'});
					} else if (!data) {
						res.status(404).end();
					} else {
						res.json(data);
					}
				});
			} else {
				etiqueta.find({}, function(err, data){
					if (err){
						console.error(err);
						res.status(500).json({'error': 'An error has occurred'});
					} else {
						res.json(data);
					}
				});
			}
		};
	};

	function updateHandler(content){
		return function(err){
			if (err){
				res.status(400).json({'error': 'An error has occurred'});
			} else {
				res.json(content);
			}
		};
	}

	module.exports.updateEtiqueta = function(models){
		return function(req, res) {
			var etiqueta = models.etiqueta();
			var id = req.params.id;

			var content = req.body;
			etiqueta.update({'_id': id}, content, { upsert: true }, updateHandler(content));
		};
	};

	module.exports.newEtiqueta = function(models){
		return function(req, res) {
			var Etiqueta = models.etiqueta();
			var content = req.body;
			new Etiqueta(content).save( updateHandler(content) );
		};
	};

	module.exports.removeEtiqueta = function(models){
		return function(req, res) {
			var etiqueta = models.etiqueta();
			var id = req.params.id;
			var content = req.body;
			etiqueta.remove({'_id': id}, updateHandler(content) );
		};
	};
})(module);
