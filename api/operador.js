(function(module){
	'use strict';

	module.exports.getOperador = function(req, res){
		const operadormodel = req.metaenvironment.models.operador();
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			operadormodel.findOne({'_id': req.metaenvironment.models.objectId(req.params.id)}).then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
		} else {
			operadormodel.find({}, req.eh.cb(res));
		}
	};

	module.exports.updateOperador = function(req, res) {
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			if (req.user && req.user.permisoscalculados && req.user.permisoscalculados.superuser){
				const operadormodel = req.metaenvironment.models.operador(),
					content = JSON.parse(JSON.stringify(req.body));
				Reflect.deleteProperty(content, '_id');
				
				operadormodel.update({'_id': req.metaenvironment.models.objectId(req.params.id)}, content, req.eh.cbWithDefaultValue(res, req.body));
			} else {
				req.eh.unauthorizedHelper(res);
			}
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	module.exports.newOperador = function(req, res) {
		if (req.user && req.user.permisoscalculados && req.user.permisoscalculados.superuser){
			const operadormodel = req.metaenvironment.models.operador(),
				content = req.body;
			operadormodel.create(content, req.metaenvironment.expresshelper.cbDefaultValue(res, content));
		} else {
			req.eh.unauthorizedHelper(res);
		}
	};

	module.exports.removeOperador = function(req, res) {
		if (req.user && req.user.permisoscalculados && req.user.permisoscalculados.superuser){
			const operadormodel = req.metaenvironment.models.operador();
			if (typeof req.params.id === 'string' && req.params.id !== ''){
				operadormodel.remove({'_id': req.metaenvironment.models.objectId(req.params.id)}, req.eh.cbWithDefaultValue(res, {}));
			} else {
				req.eh.missingParameterHelper(res, 'id');
			}
		} else {
			req.eh.unauthorizedHelper(res);
		}
	};

})(module);
