(function(module){
	'use strict';

	module.exports.isTeletrabajador = function(req, res){
		const personamodel = req.metaenvironment.models.persona();
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			personamodel.findOne({'_id': req.metaenvironment.models.objectId(req.params.id)}).then(function(usuario) {
				res.json({'teletrabajador': Boolean(usuario.teletrabajador)});
			}, req.eh.errorHelper(res));
		} else {
			personamodel.find({}, req.eh.cb(res));
		}
	};

	module.exports.setTeletrabajador = function(req, res) {
		if (typeof req.params.id === 'string' && req.params.id !== ''){
			if (req.user && req.user.permisoscalculados && req.user.permisoscalculados.superuser) {
				const personamodel = req.metaenvironment.models.persona();
				const teletrabajador = Boolean(req.body.teletrabajador);


				personamodel.update({'_id': req.metaenvironment.models.objectId(req.params.id)}, {$set: {'teletrabajador': teletrabajador}}, req.eh.cbWithDefaultValue(res, req.body));
			} else {
				req.eh.unauthorizedHelper(res);
			}
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};


})(module);
