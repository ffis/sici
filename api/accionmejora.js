(function(module){
	'use strict';

	/* TODO: add permission check */

	module.exports.create = function(req, res){
		const AccionMejora = req.metaenvironment.models.accionmejora(),
			content = req.body;
		new AccionMejora(content).save(req.metaenvironment.expresshelper.cbDefaultValue(res, content));
	};

	module.exports.get = function (req, res) {
		const accionmejoramodel = req.metaenvironment.models.accionmejora(),
			id = req.params.id,
			restricciones = {};
		if (typeof id === 'string' && id !== ''){
			accionmejoramodel.findOne({'_id': req.metaenvironment.models.ObjectId(id)}, req.eh.cb(res) );
		} else {
			if (typeof req.query.plan !== 'undefined'){
				restricciones.plan = req.query.plan;
			}
			if (typeof req.query.idjerarquia !== 'undefined' && parseInt(req.query.idjerarquia, 10) > 0){
				restricciones.entidad = parseInt(req.query.idjerarquia, 10);
			}
			accionmejoramodel.find(restricciones).then(req.eh.okHelper(res), req.eh.errorHelper(res));
		}
	};

	module.exports.update = function (req, res) {

		if (typeof req.params.id === 'string' && req.params.id !== ''){
			const accionmejora = req.metaenvironment.models.accionmejora(),
				content = JSON.parse(JSON.stringify(req.body));

			Reflect.deleteProperty(content, '_id');

			accionmejora.update({'_id': id}, content, {upsert: true}, req.eh.cbWithDefaultValue(res, req.body));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	module.exports.remove = function(req, res){
		const accionMejora = req.metaenvironment.models.accionmejora(),
			id = req.params.id;
		if (typeof id === 'string' && id !== ''){
			accionMejora.remove({'_id': req.metaenvironment.models.ObjectId(req.params.id)}, req.eh.cbWithDefaultValue(res, {}));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

})(module);
