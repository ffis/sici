(function(module){
	'use strict';

	module.exports.get = function (req, res){
		const models = req.metaenvironment.models,
			entidadobjetomodel = models.entidadobjeto();
		if (typeof req.params.id === 'string' && req.params.id.trim() !== ''){
			entidadobjetomodel.findOne({'_id': models.objectId(req.params.id)}).lean().exec().then(req.eh.okHelper(res), req.eh.errorHelper(res));
		} else {
			const restricciones = JSON.parse(JSON.stringify(req.query));
			if (typeof restricciones.idjerarquia === 'string'){
				restricciones.idjerarquia = parseInt(restricciones.idjerarquia, 10);
			}
			entidadobjetomodel.find(restricciones).lean().exec().then(req.eh.okHelper(res), req.eh.errorHelper(res));
		}
	};

	module.exports.create = function(req, res){
		if (req.user && req.user.permisoscalculados && req.user.permisoscalculados.superuser){
			const models = req.metaenvironment.models,
				entidadobjetomodel = models.entidadobjeto(),
				content = JSON.parse(JSON.stringify(req.body));

			content.idjerarquia = parseInt(content.idjerarquia, 10);
			content.fecha_version = new Date();
			entidadobjetomodel.create(content, req.eh.cb(res));
		} else {
			req.eh.unauthorizedHelper(res, 'Error de permisos');
		}
	};

	module.exports.update = function (req, res) {
		if (req.user && req.user.permisoscalculados && req.user.permisoscalculados.superuser){

			const models = req.metaenvironment.models,
				entidadobjetomodel = models.entidadobjeto(),
				content = JSON.parse(JSON.stringify(req.body));

			if (typeof content !== 'object'){
				req.eh.missingParameterHelper(res, 'content');

				return;
			}

			const id = content._id;
			Reflect.deleteProperty(content, '_id');

			entidadobjetomodel.findOne({'_id': models.objectId(id)}).exec().then(function(doc){
				if (doc){
					for (var attr in content){
						doc[attr] = content[attr];
					}
					doc.idjerarquia = parseInt(doc.idjerarquia, 10);
					doc.fecha_version = new Date();
					doc.save(req.eh.cbWithDefaultValue(res, doc));
				} else {
					req.eh.notFoundHelper(res);
				}
			}, req.eh.errorHelper(res));
		} else {
			req.eh.unauthorizedHelper(res, 'Error de permisos');
		}
	};

	module.exports.entidadobjetoByResponsable = function(req, res){
		if (!(req.user.permisoscalculados && req.user.permisoscalculados.superuser)) {
			req.eh.unauthorizedHelper(res, 'Error de permisos');

			return;
		}
		const models = req.metaenvironment.models,
			entidadobjetomodel = models.entidadobjeto();

		if (typeof req.params.codplaza === 'string' && req.params.codplaza.trim() !== ''){
			const restriccion = {
				'$and': [
						{'cod_plaza': req.params.codplaza.trim()},
						{
							'$or':
							[
									{'oculto': {'$exists': false}},
									{
										'$and': [
											{'oculto': {'$exists': true}},
											{'oculto': false}
										]
									}
							]
					}
				]
			};
			entidadobjetomodel.find(restriccion).lean().exec().then(req.eh.okHelper(res), req.eh.errorHelper(res));
		} else {
			req.eh.missingParameterHelper(res, 'codplaza');
		}
	};

	exports.entidadobjetoList = function (req, res) {
		const models = req.metaenvironment.models,
			entidadobjetomodel = models.entidadobjeto(),
			jerarquiamodel = models.jerarquia();

		if (req.params.idjerarquia && parseInt(req.params.idjerarquia, 10) > 0){
			jerarquiamodel.findOne({'id': parseInt(req.params.idjerarquia, 10)}).exec().then(function(jerarquia){

				if (jerarquia){
					jerarquia.descendientes.push(parseInt(req.params.idjerarquia, 10));

					const restriccion =
						(typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))) ?
						(typeof req.params.recursivo === 'undefined' || JSON.parse(req.params.recursivo) ?
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
							{'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura}}
						]};


					const query = entidadobjetomodel.find(restriccion);
					if (typeof req.query.fields === 'string') {
						query.select(req.query.fields);
					}
					query.exec().then(req.eh.okHelper(res), req.eh.errorHelper(res));
				} else {
					req.eh.notFoundHelper(res);
				}
			});
		} else {
			req.eh.missingParameterHelper(res, 'idjerarquia');
		}
	};

})(module);
