(function(module){
	'use strict';

	/* TODO: add permission check */
	module.exports.create = function(req, res){
		const accionmejoramodel = req.metaenvironment.models.accionmejora(),
			content = req.body;
		accionmejoramodel.create(content, req.metaenvironment.expresshelper.cbDefaultValue(res, content));
	};

	module.exports.get = function (req, res) {
		const accionmejoramodel = req.metaenvironment.models.accionmejora(),
			restricciones = {};
		if (typeof req.params.id === 'string' && req.params.id.trim() !== ''){
			accionmejoramodel.findOne({'_id': req.metaenvironment.models.objectId(req.params.id)}, req.eh.cb(res));
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
		if (typeof req.params.id === 'string' && req.params.id.trim() !== ''){
			const accionmejoramodel = req.metaenvironment.models.accionmejora(),
				content = JSON.parse(JSON.stringify(req.body));

			Reflect.deleteProperty(content, '_id');

			accionmejoramodel.update({'_id': req.metaenvironment.models.objectId(req.params.id)}, content, {upsert: true}, req.eh.cbWithDefaultValue(res, req.body));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	module.exports.remove = function(req, res){
		const accionmejoramodel = req.metaenvironment.models.accionmejora();
		if (typeof req.params.id === 'string' && req.params.id.trim() !== ''){
			accionmejoramodel.remove({'_id': req.metaenvironment.models.objectId(req.params.id)}, req.eh.cbWithDefaultValue(res, {}));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

})(module);
