(function(module){
	'use strict';

	module.exports.get = function (models) {
		return function (req, res) {
			var entidadobjeto = models.entidadobjeto(),
				id = req.params.id;
			if (id){
				entidadobjeto.findOne({'_id': id}, function (err, data) {
					if (err) {
						res.status(500).send({'error': 'An error has occurred', details: err});
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
						res.status(500).json({'error': 'An error has occurred', details: err });
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
					res.status(500).send({'error': 'An error has occurred.', details: e});
				} else {
					//se reenvía lo mismo que se recibió
					res.send(req.body);
				}
			});
		};
	};

	module.exports.entidadobjetoByResponsable = function(models){
		return function(req, res){
			if (!(req.user.permisoscalculados && req.user.permisoscalculados.superuser)) {
				var msg = 'Error de permisos.';
				res.status(403).json({'error': msg });
				return;
			}
			var Entidadobjeto = models.entidadobjeto();
			if (typeof req.params.codplaza !== 'undefined' && req.params.codplaza !== '') {
				var cod_plaza = req.params.codplaza;
				var restriccion = {
					'$and': [
							{'cod_plaza': cod_plaza},
							{'$or': [
										{'oculto': {$exists: false}},
										{'$and': [
												{'oculto': {'$exists': true}},
												{'oculto': false}
										]}
							]
						}
					]
				};
				Entidadobjeto.find(restriccion, function(err, entidadesobjeto){
					if (err) {
						res.status(500).json({'error': 'An error has occurred', details: err, restriccion: restriccion});
					} else {
						res.json(entidadesobjeto);
					}
				});
			} else {
				res.status(400).json({'error': 'An error has occurred', details: restriccion});
			}
		};
	};


	exports.entidadobjetoList = function (models) {
		return function (req, res) {
			var EntidadObjeto = models.entidadobjeto();
			var Jerarquia = models.jerarquia();
			var fields = req.query.fields;
			Jerarquia.findOne({'id': req.params.idjerarquia}, function(err, jerarquia){
				if (err) {
					res.status(500).json({'error': 'An error has occurred', details: err});
					return;
				} else {
					var jdescendientes = jerarquia.descendientes.push(parseInt(req.params.idjerarquia));

					var restriccion =
						(typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))) ?
						(typeof req.params.recursivo === 'undefined' || JSON.parse(req.params.recursivo) ?
							{'$and': [
									{'idjerarquia': {'$in': jdescendientes}},
									{'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)}}
							]} :
							{'$and': [
									{'idjerarquia': parseInt(req.params.idjerarquia)},
									{'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)}}
							]}
						)
						:
						{'$and': [
							{'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)}}
						]};

					var cb = function (err, data) {
						if (err) {
							res.status(500).json({'error': 'An error has occurred', details: err, restriccion: restriccion});
						} else {
							res.json(data);
						}
					};

					var query = EntidadObjeto.find(restriccion);
					if (typeof fields !== 'undefined') {
						query.select(fields);
					}
					query.exec(cb);
				}
			});
		};
	};

})(module);
