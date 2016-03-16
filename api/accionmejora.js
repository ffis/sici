(function(module){
	'use strict';

	module.exports.create = function(models){
		return function(req,res){
			var AccionMejora = models.accionmejora(),
				content = req.body;
			new AccionMejora(content).save( function(e){
				if (e){
					res.status(400).json({'error': 'An error has occurred'});
				}else{
					res.json(content);
				}
			});
		}
	};


	module.exports.get = function (models) {
		return function (req, res) {
			var accionmejora = models.accionmejora();
				id = req.params.id;
			if (id){
				accionmejora.findOne({'_id': id}, function (err, data) {
					if (err) {
						res.status(500).send({'error': 'An error has occurred', details: err});
						return;
					}
					res.json(data);
				});
			}
		};
	};

	module.exports.update = function (models) {
		return function (req, res) {
			var accionmejora = models.accionmejora();
			var content = JSON.parse(JSON.stringify(req.body));
			var id = content._id;

			delete content._id;

			//accionmejora.markModified('fecha_version');

			accionmejora.update({'_id': id}, content, {upsert: true}, function (e) {
				if (e) {
					res.status(500).send({'error': 'An error has occurred.', details: e});
				} else {
					//se reenvía lo mismo que se recibió
					res.send(req.body);
				}
			});
		};
	};

	module.exports.remove = function (models) {
		return function(req, res){
			var AccionMejora = models.accionmejora(),
				id = parseInt(req.params.id);
			if (id) {
				AccionMejora.remove({'_id': id}, function(erro){
					if (erro) {
						res.status(500).json({'error': 'Error during accionmejora.remove', details: erro});
					} else {
						res.json({});
					}
				});
			}
		};
	};

	module.exports.list = function (models) {
		return function (req, res) {
			var AccionMejora = models.accionmejora(),
				plan = req.params.plan;

			AccionMejora.find({'plan': req.params.plan}, function(err, acciones){
				if (err) {
					res.status(500).json({'error': 'An error has occurred', details: err});
				} else {
					res.json(acciones);
				}
			});
		};
	};

})(module);
