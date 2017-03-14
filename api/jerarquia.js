(function(module){
	'use strict';

	module.exports.getNodoJerarquia = function(req, res){
		const jerarquiamodel = req.metaenvironment.models.jerarquia();
		const idjerarquia = req.params.idjerarquia;
		if (typeof idjerarquia === 'string' && idjerarquia !== '' && parseInt(idjerarquia, 10) > 0){
			jerarquiamodel.findOne({'id': parseInt(idjerarquia, 10)}).exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	module.exports.getAncestros = function(req, res){
		const jerarquiamodel = req.metaenvironment.models.jerarquia();
		const idjerarquia = req.params.idjerarquia;
		if (typeof idjerarquia === 'string' && idjerarquia !== '' && parseInt(idjerarquia, 10) > 0){
			jerarquiamodel.find({'descendientes': parseInt(idjerarquia, 10)}).exec(req.eh.okHelper(res, false), req.eh.errorHelper(res));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	module.exports.getResumenJerarquia = function(req, res) {
		const idjerarquia = req.params.idjerarquia;
		if (typeof idjerarquia === 'string' && idjerarquia !== '' && parseInt(idjerarquia, 10) > 0){
			const exportador = req.metaenvironment.exportador;
			exportador.mapReducePeriodos(req.metaenvironment.models, parseInt(req.params.idjerarquia, 10), req.permisoscalculados).then(req.eh.okHelper(res, false), req.eh.errorHelper(res));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

})(module);
