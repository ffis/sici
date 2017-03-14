(function(module){
	'use strict';
	module.exports.registroActividad = function (req, res) {
		const models = req.metaenvironment.models;
		const registroActividad = models.registroactividad();
		const limit = req.query.limit ? parseInt(req.query.limit, 10) : 40;
		const start = req.query.start ? parseInt(req.query.start, 10) : 0;
		const restricciones = JSON.parse(JSON.stringify(req.query));
		Reflect.deleteProperty(restricciones, 'limit');
		Reflect.deleteProperty(restricciones, 'start');
		registroActividad.find(restricciones).sort({'_id': -1}).skip(start).limit(limit).exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
	};
})(module);
