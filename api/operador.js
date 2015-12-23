(function(module){
	'use strict';

	module.exports.getOperador = function(models){
		return function(req, res){
			var operador = models.operador();
			var id = req.params._id;
			if (id)
			{
				operador.findOne({'_id': id}, function(err, data){
					if (err){
						console.error(err); res.status(400).end();
					} else if (!data) {
						res.status(404).end();
					} else {
						res.json(data);
					}
				});
			}else{
				operador.find({}, function(err, data){
					if (err) { console.error(err); res.status(500); res.end(); return ; }
					res.json(data);
				});
			}
		};
	};

	module.exports.updateOperador = function(models){
		return function(req, res) {
			var operador = models.operador();
			var id = req.params.id;

			var content = req.body;
			operador.update({'_id': id}, content, { upsert: true }, function(e){
				if (e){
					res.status(400).json({'error': 'An error has occurred'});
				}else{
					res.json(content);
				}
			});
		};
	};

	module.exports.newOperador = function(models){
		return function(req, res) {
			var Operador = models.operador();
			var content = req.body;
			new Operador(content).save( function(e){
				if (e){
					res.status(400).json({'error': 'An error has occurred'});
				}else{
					res.json(content);
				}
			});
		};
	};

	module.exports.removeOperador = function(models){
		return function(req, res) {
			var operador = models.operador();
			var id = req.params.id;
			var content = req.body;
			operador.remove({'_id': id}, function(e){
				if (e){
					res.status(400).json({'error': 'An error has occurred'});
				}else{
					res.json(content);
				}
			});
		};
	};
})(module);
