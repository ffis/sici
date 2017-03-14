(function(module){
	'use strict';

	module.exports.getReglaInconsistencia = function(req, res){
		const reglasinconsistenciasmodel = req.metaenvironment.models.reglasinconsistencias(),
			id = req.params.id;
		if (typeof id === 'string' && id !== ''){
			reglasinconsistenciasmodel.findOne({'_id': req.metaenvironment.models.ObjectId(id)}).exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
		} else {
			reglasinconsistenciasmodel.find({}, req.eh.cb(res));
		}
	};

	module.exports.updateReglaInconsistencia = function(req, res) {
		const reglasinconsistenciasmodel = req.metaenvironment.models.reglasinconsistencias(),
			id = req.params.id,
			content = JSON.parse(JSON.stringify(req.body));
		if (typeof id === 'string' && id !== ''){
			Reflect.deleteProperty(content, '_id');
			reglasinconsistenciasmodel.update({'_id': id}, content, {upsert: false}, req.eh.cbWithDefaultValue(res, req.body));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	module.exports.newReglaInconsistencia = function(req, res) {
		const reglasinconsistenciasmodel = req.metaenvironment.models.reglasinconsistencias(),
			content = req.body;
		reglasinconsistenciasmodel.create(content, req.eh.cbWithDefaultValue(res, content));
	};

	module.exports.removeReglaInconsistencia = function(req, res) {
		const reglasinconsistenciasmodel = req.metaenvironment.models.reglasinconsistencias(),
			id = req.params.id,
			content = req.body;
		if (typeof id === 'string' && id !== ''){
			reglasinconsistenciasmodel.remove({'_id': req.metaenvironment.models.ObjectId(id)}, req.eh.cbWithDefaultValue(res, content));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

})(module);
