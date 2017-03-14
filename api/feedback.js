(function(module){
	'use strict';

	module.exports.log = function(req, res){
		const feedbackmodel = req.metaenvironment.models.feedback();
		const obj = {
			usr: req.user.login,
			fecha: new Date(),
			url: req.get('referer'),
			estado: 'Registrada',
			tipo: 'Por determinar',
			destinatario: 'Por determinar'
		};

		for (var idx in req.body){
			if (typeof req.body[idx] === 'object'){
				if (typeof req.body[idx].Comentario !== 'undefined'){
					obj.comentario = req.body[idx].Comentario;
				}
				if (typeof req.body[idx].Contacto !== 'undefined'){
					obj.contacto = req.body[idx].Contacto;
				}

			} else if (typeof req.body[idx] === 'string'){
				obj.captura = req.body[idx];
			}
		}
		feedbackmodel.create(obj, req.eh.cbWithDefaultValue(res, {'OK': true}));
	};

	module.exports.get = function(req, res){
		const feedbackmodel = req.metaenvironment.models.feedback();
		const id = req.params.id;
		if (typeof id === 'string' && id !== ''){
			feedbackmodel.findOne({'_id': req.metaenvironment.models.ObjectId(id)}).exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
		} else {
			feedbackmodel.find({}, req.eh.cb(res));
		}
	};

	module.exports.update = function(req, res) {
		const feedbackmodel = req.metaenvironment.models.feedback();
		const id = req.params.id,
			content = JSON.parse(JSON.stringify(req.body));

		if (typeof id === 'string' && id !== ''){
			Reflect.deleteProperty(content, '_id');
			feedbackmodel.update({'_id': req.metaenvironment.models.ObjectId(id)}, content, {upsert: false}, req.eh.cbWithDefaultValue(res, req.body));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	module.exports.remove = function(req, res) {
		const feedbackmodel = req.metaenvironment.models.feedback();
		const id = req.params.id,
			content = req.body;

		if (typeof id === 'string' && id !== ''){
			feedbackmodel.remove({'_id': req.metaenvironment.models.ObjectId(id)}, req.eh.cbWithDefaultValue(res, content));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

})(module);
