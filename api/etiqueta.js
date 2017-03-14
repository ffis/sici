(function(module){
	'use strict';

	module.exports.getEtiqueta = function(req, res){
		const etiqueta = req.metaenvironment.models.etiqueta();
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			etiqueta.findOne({'_id': req.metaenvironment.models.objectId(req.params._id)}).lean().exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
		} else {
			etiqueta.find({}, req.eh.cb(res));
		}
	};

	module.exports.updateEtiqueta = function(req, res) {
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			const etiqueta = req.metaenvironment.models.etiqueta(),
				id = req.params.id,
				content = req.body;
			etiqueta.update({'_id': req.metaenvironment.models.objectId(id)}, content, {upsert: true}, req.eh.cbWithDefaultValue(res, content));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	module.exports.newEtiqueta = function(req, res) {
		const etiqueta = req.metaenvironment.models.etiqueta(),
			content = req.body;
		etiqueta.create(content, req.eh.cbWithDefaultValue(res, content));
	};

	module.exports.removeEtiqueta = function(req, res) {
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			const etiqueta = req.metaenvironment.models.etiqueta(),
				id = req.params.id,
				content = req.body;
			etiqueta.remove({'_id': req.metaenvironment.models.objectId(id)}, req.eh.cbWithDefaultValue(res, content));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};
})(module);
