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
			const idj = parseInt(req.params.idjerarquia, 10);
			const exportador = req.metaenvironment.exportador;
			exportador.mapReducePeriodos(req.metaenvironment.models, idj, req.permisoscalculados).then(function(results){
				const plain = results.filter(function(result){
					return result._id.idjerarquia == idj;
				}).reduce(function(prev, element){
					prev.periodos['a' + element._id.anualidad] = element.value;
					return prev;
				}, {periodos:{}});

				res.json(plain);
			}, req.eh.errorHelper(res));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

})(module);
