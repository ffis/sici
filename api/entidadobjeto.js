(function(module){
	'use strict';

	module.exports.get = function (models) {
		return function (req, res) {
			var entidadobjeto = models.entidadobjeto(),
				id = req.params._id;
			if (id){
				entidadobjeto.findOne({'_id': id}, function (err, data) {
					if (err) {
						console.error(err);
						res.status(500).end();
						return;
					}
					res.json(data);
				});
			} else {
				var restricciones = JSON.parse(JSON.stringify(req.query));
				if (typeof restricciones.idjerarquia !== 'undefined'){
					restricciones.idjerarquia = parseInt(restricciones.idjerarquia);
				}
				entidadobjeto.find(restricciones, function (err, data) {
					if (err) {
						console.error(err);
						res.status(500).end();
						return;
					}
					res.json(data);
				});
			}
		};
	};

	module.exports.update = function (models) {
		return function (req, res) {
			var entidadobjeto = models.entidadobjeto();
			var content = JSON.parse(JSON.stringify(req.body));
			var id = content._id;

			delete content._id;

			content.idjerarquia = parseInt(content.idjerarquia);
			content.fecha_version = new Date();
			//entidadobjeto.markModified('fecha_version');

			entidadobjeto.update({'_id': id}, content, {upsert: true}, function (e) {
				if (e) {
					res.status(500).send({'error': 'An error has occurred:' + e});
				} else {
					//se reenvía lo mismo que se recibió
					res.send(req.body);
				}
			});
		};
	};

})(module);

