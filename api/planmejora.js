(function(module){
	'use strict';
	const Q = require('q');

	module.exports.create = function(req, res){
		const planmejoramodel = req.metaenvironment.models.planmejora(),
			content = req.body;
		if (typeof content.idjerarquia === 'number' && content.idjerarquia > 0){
			
			if (req.user.permisoscalculados.superuser || req.user.permisoscalculados.jerarquiaescritura.indexOf(content.idjerarquia) >= 0){
				planmejoramodel.create(content, req.eh.cbWithDefaultValue(res, content));
				console.log( req.user.permisoscalculados.jerarquiaescritura, content.idjerarquia)
				
			} else {
				req.eh.unauthorizedHelper(res);
			}
		} else {
			req.eh.missingParameterHelper(res, 'idjerarquia');
		}
	};

	module.exports.get = function (req, res) {
		const planmejoramodel = req.metaenvironment.models.planmejora(),
			id = req.params.id;
		if (typeof id === 'string' && id !== ''){
			const restricciones = {'_id': req.metaenvironment.models.objectId(id)};
			if (!req.user.permisoscalculados.superuser){
				restricciones.idjerarquia = {'$in': req.user.permisoscalculados.jerarquiaescritura};
			}
			planmejoramodel.findOne(restricciones).exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
		} else {
			const restricciones = JSON.parse(JSON.stringify(req.query));
			if (typeof restricciones.idjerarquia !== 'undefined'){
				restricciones.idjerarquia = parseInt(restricciones.idjerarquia, 10);
			}
			if (typeof req.query.anualidad !== 'undefined'){
				restricciones.anualidad = parseInt(req.query.anualidad, 10);
			}
			if (!req.user.permisoscalculados.superuser){
				if (restricciones.idjerarquia){
					if (!req.user.permisoscalculados.jerarquialectura.indexOf(restricciones.idjerarquia) < 0){
						req.eh.unauthorizedHelper(res);

						return;
					}
				} else {
					restricciones.idjerarquia = {'$in': req.user.permisoscalculados.restricciones};
				}
			}
			planmejoramodel.find(restricciones, req.eh.cb(res));
		}
	};

	module.exports.update = function (req, res) {
		const planmejoramodel = req.metaenvironment.models.planmejora(),
			id = req.params.id,
			content = req.body;
		content.idjerarquia = parseInt(content.idjerarquia, 10);
		if (typeof id === 'string' && id !== ''){
			const restricciones = {'_id': req.metaenvironment.models.objectId(id)};
			if (!req.user.permisoscalculados.superuser){
				restricciones.idjerarquia = {'$in': req.user.permisoscalculados.jerarquiaescritura};
			}
			planmejoramodel.update(restricciones, content, {upsert: false}, req.eh.cbWithDefaultValue(res, content));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	module.exports.remove = function(req, res){
		const planmejoramodel = req.metaenvironment.models.planmejora(),
			id = req.params.id,
			content = req.body;
		if (typeof id === 'string' && id !== ''){
			const restricciones = {'_id': req.metaenvironment.models.objectId(id)};
			if (!req.user.permisoscalculados.superuser){
				restricciones.idjerarquia = {'$in': req.user.permisoscalculados.jerarquiaescritura};
			}

			planmejoramodel.remove(restricciones, req.eh.cbWithDefaultValue(res, content));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	function getAccionesMejoraCount(models){
		const defer = Q.defer();
		const accionmejoramodel = models.accionmejora();
		accionmejoramodel.aggregate([{'$match': {'eliminado': false}}, {'$group': {'_id': '$plan', 'count': {'$sum': 1}}}], defer.makeNodeResolver());

		return defer.promise;
	}

	module.exports.list = function (req, res) {
		const planmejoramodel = req.metaenvironment.models.planmejora(),
			fields = req.query.fields,
			restricciones = {};

		if (typeof req.params.idjerarquia !== 'string' || isNaN(parseInt(req.params.idjerarquia, 10))){
			req.eh.missingParameterHelper(res, 'idjerarquia');

			return;
		}

		const jerarquiaspermitidas = req.user.permisoscalculados.jerarquialectura;
		const idjerarquia = parseInt(req.params.idjerarquia, 10);

		if (req.user.permisoscalculados.superuser || jerarquiaspermitidas.indexOf(idjerarquia) >= 0){
				
			if (typeof req.params.recursivo === 'undefined' || !JSON.parse(req.params.recursivo)){
				restricciones.idjerarquia = parseInt(req.params.idjerarquia, 10);
				if (typeof req.query.anualidad !== 'undefined'){
					restricciones.anualidad = parseInt(req.query.anualidad, 10);
				}

				const query = planmejoramodel.find(restricciones);
				if (typeof fields !== 'undefined') {
					query.select(fields);
				}
				query.lean().exec().then(function(values){
					if (values.length > 0){
						getAccionesMejoraCount(req.metaenvironment.models).then(function(stats){
							for (let i = 0, j = values.length; i < j; i += 1){
								values[i].numeroacciones = 0;
								for (let k = 0, l = stats.length; k < l; k += 1){
									if (String(values[i]._id) === String(stats[k]._id)){
										values[i].numeroacciones = stats[k].count;
										break;
									}
								}
							}
							res.json(values);
						});
					} else {
						res.json([]);
					}
				}).fail(req.eh.errorHelper(res));

			} else {
				const jerarquiamodel = req.metaenvironment.models.jerarquia();
				
				jerarquiamodel.findOne({'id': idjerarquia}).exec().then(function(jerarquia){
					if (jerarquia){
						jerarquia.descendientes.push(idjerarquia);

						const restriction = {'$and': [{'idjerarquia': {'$in': jerarquia.descendientes}}, {'idjerarquia': {'$in': jerarquiaspermitidas}}]};
						
						if (typeof req.query.anualidad !== 'undefined'){
							restriction.anualidad = parseInt(req.query.anualidad, 10);
						}

						const query2 = planmejoramodel.find(restriction);
						if (typeof fields !== 'undefined') {
							query2.select(fields);
						}
						query2.lean().exec().then(function(values){
							if (values.length > 0){
								getAccionesMejoraCount(req.metaenvironment.models).then(function(stats){
									for (let i = 0, j = values.length; i < j; i += 1){
										values[i].numeroacciones = 0;
										for (let k = 0, l = stats.length; k < l; k += 1){
											if (String(values[i]._id) === String(stats[k]._id)){
												values[i].numeroacciones = stats[k].count;
												break;
											}
										}
									}
									res.json(values);
								});
							} else {
								res.json([]);
							}
						}).fail(req.eh.errorHelper(res));
					} else {
						req.eh.notFoundHelper(res);
					}

				}).fail(req.eh.errorHelper(res));
			}
		} else {
			console.dir({jerarquiaspermitidas: jerarquiaspermitidas, idjerarquia: idjerarquia});
			req.eh.unauthorizedHelper(res);
		}
	};


	module.exports.getAccionesMejoraCount = getAccionesMejoraCount;

})(module);
