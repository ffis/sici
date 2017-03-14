(function(module){
	'use strict';

	module.exports.create = function(req, res){
		const planmejoramodel = req.metaenvironment.models.planmejora(),
			content = req.body;
		planmejoramodel.create(content, req.eh.cbWithDefaultValue(res, content));
	};

	module.exports.get = function (req, res) {
		const planmejoramodel = req.metaenvironment.models.planmejora(),
			id = req.params.id;
		if (typeof id === 'string' && id !== ''){
			planmejoramodel.findOne({'_id': req.metaenvironment.models.objectId(id)}).exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
		} else {
			const restricciones = JSON.parse(JSON.stringify(req.query));
			if (typeof restricciones.idjerarquia !== 'undefined'){
				restricciones.idjerarquia = parseInt(restricciones.idjerarquia, 10);
			}
			if (typeof req.query.anualidad !== 'undefined'){
				restricciones.anualidad = parseInt(req.query.anualidad, 10);
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
			planmejoramodel.update({'_id': req.metaenvironment.models.objectId(id)}, content, {upsert: false}, req.eh.cbWithDefaultValue(res, content));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	module.exports.remove = function(req, res){
		const planmejoramodel = req.metaenvironment.models.planmejora(),
			id = req.params.id,
			content = req.body;
		if (typeof id === 'string' && id !== ''){
			planmejoramodel.remove({'_id': req.metaenvironment.models.objectId(id)}, req.eh.cbWithDefaultValue(res, content));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	module.exports.list = function (req, res) {
		const planmejoramodel = req.metaenvironment.models.planmejora(),
			fields = req.query.fields,
			restricciones = {};

		if (typeof req.params.idjerarquia !== 'string' || isNaN(parseInt(req.params.idjerarquia, 10))){
			req.eh.missingParameterHelper(res, 'idjerarquia');

			return;
		}

		const jerarquiaspermitidas = req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura);
		const idjerarquia = parseInt(req.params.idjerarquia, 10);

		if (jerarquiaspermitidas.indexOf(idjerarquia) < 0){
			req.eh.unauthorizedHelper(res);

			return;
		}

		if (typeof req.params.recursivo === 'undefined' || !JSON.parse(req.params.recursivo)){
			restricciones.idjerarquia = parseInt(req.params.idjerarquia, 10);
			if (typeof req.query.anualidad !== 'undefined'){
				restricciones.anualidad = parseInt(req.query.anualidad, 10);
			}

			const query = planmejoramodel.find(restricciones);
			if (typeof fields !== 'undefined') {
				query.select(fields);
			}
			query.exec().then(req.eh.okHelper(res), req.eh.errorHelper(res));

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
					query2.exec().then(req.eh.okHelper(res), req.eh.errorHelper(res));
				} else {
					req.eh.notFoundHelper(res);
				}

			}, req.eh.errorHelper(res));
		}
	};

})(module);
