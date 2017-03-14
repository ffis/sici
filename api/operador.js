(function(module){
	'use strict';

	module.exports.getOperador = function(req, res){
		const operadormodel = req.metaenvironment.models.operador();
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			operadormodel.findOne({'_id': req.metaenvironment.models.objectId(req.params._id)}).then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
		} else {
			operadormodel.find({}, req.eh.cb(res));
		}
	};

	module.exports.updateOperador = function(req, res) {
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			const operadormodel = req.metaenvironment.models.operador(),
				content = JSON.parse(JSON.stringify(req.body));
			Reflect.deleteProperty(content, '_id');
			
			operadormodel.update({'_id': req.metaenvironment.models.objectId(req.params.id)}, content, {upsert: true}, req.eh.cbWithDefaultValue(res, req.body));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	module.exports.newOperador = function(req, res) {
		const Operador = req.metaenvironment.models.operador(),
			content = req.body;
		new Operador(content).save(req.metaenvironment.expresshelper.cbDefaultValue(res, content));
	};

	module.exports.removeOperador = function(req, res) {
		const operadormodel = req.metaenvironment.models.operador(),
			id = req.params.id;
		if (typeof id === 'string' && id !== ''){
			operadormodel.remove({'_id': req.metaenvironment.models.objectId(req.params.id)}, req.eh.cbWithDefaultValue(res, {}));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

})(module);
