(function(module){
	'use strict';

	module.exports.create = function(models){
		return function(req, res){
			var PlanMejora = models.planmejora(),
				content = req.body;
			var obj = new PlanMejora(content);
			obj.save( function(e){
				if (e){
					res.status(400).json({'error': 'An error has occurred'});
				} else {
					res.json(obj);
				}
			});
		};
	};

	module.exports.get = function (models) {
		return function (req, res) {
			var planmejora = models.planmejora(),
				id = req.params.id;
			if (id){
				planmejora.findOne({'_id': id}, function (err, data) {
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
				} else if (typeof restricciones.carta !== 'undefined') {
					restricciones.carta = (restricciones.carta);
				}
				planmejora.find(restricciones, function (err, data) {
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
			var planmejora = models.planmejora();
			var content = JSON.parse(JSON.stringify(req.body));
			var id = content._id;

			delete content._id;

			content.idjerarquia = parseInt(content.idjerarquia);
			content.carta = (content.carta);

			planmejora.update({'_id': id}, content, {upsert: true}, function (e) {
				if (e) {
					res.status(500).send({'error': 'An error has occurred.', details: e});
				} else {
					res.send(req.body);
				}
			});
		};
	};

	module.exports.remove = function (models) {
		return function(req, res){
			var PlanMejora = models.planmejora(),
				id = parseInt(req.params.id);
			if (id) {
				PlanMejora.remove({'_id': id}, function(erro){
					if (erro) {
						res.status(500).json({'error': 'Error during planmejora.remove', details: erro});
					} else {
						res.json({});
					}
				});
			} else {
				res.status(400).json({'error': 'An error has occurred', details: 'Not found'});
			}
		};
	};

	module.exports.list = function (models) {
		return function (req, res) {
			var PlanMejora = models.planmejora();
			var Jerarquia = models.jerarquia();
			var fields = req.query.fields;
			var restriccion = {};
			if (typeof req.params.recursivo === 'undefined' || !JSON.parse(req.params.recursivo) ){

				restriccion.idjerarquia = parseInt(req.params.idjerarquia);
				if (typeof req.query.anualidad !== 'undefined'){
					restriccion.anualidad = parseInt(req.query.anualidad);
				}

				var query = PlanMejora.find(restriccion);
				if (typeof fields !== 'undefined') {
					query.select(fields);
				}
				query.exec().then(function(data){
					res.json(data);
				}, function(err){
					res.status(500).json({'error': 'An error has occurred', details: err, restriccion: restriccion});
				});

			} else {
				Jerarquia.findOne({'id': req.params.idjerarquia}, function(err, jerarquia){
					if (err) {
						res.status(500).json({'error': 'An error has occurred', details: err});
						return;
					} else {
						jerarquia.descendientes.push(parseInt(req.params.idjerarquia));

						var restriccion =
							(typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))) ?
							(typeof req.params.recursivo === 'undefined' || !JSON.parse(req.params.recursivo) ?
								{'$and': [
										{'idjerarquia': {'$in': jerarquia.descendientes}},
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

						if (typeof req.query.anualidad !== 'undefined'){
							restriccion.anualidad = parseInt(req.query.anualidad);
						}

						var query = PlanMejora.find(restriccion);
						if (typeof fields !== 'undefined') {
							query.select(fields);
						}
						query.exec().then(function(data){
							res.json(data);
						}, function(err){
							res.status(500).json({'error': 'An error has occurred', details: err, restriccion: restriccion});
						});
					}
				});
			}
		};
	};

})(module);
