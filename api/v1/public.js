(function(module){
	'use strict';
	const express = require('express');

	function Api(metaenvironment){
		const app = new express.Router();

		app.post('/feedback', metaenvironment.feedback.log);

		app.delete('/etiqueta/:id', metaenvironment.etiqueta.removeEtiqueta);
		app.delete('/expediente/:procedimiento/:id', metaenvironment.expediente.deleteExpediente);
		app.delete('/importacion/:_id', metaenvironment.importador.removeImportacionProcedimiento);
		app.delete('/operador/:id', metaenvironment.operador.removeOperador);
		app.delete('/procedimiento/:codigo', metaenvironment.procedimiento.deleteProcedimiento);

		app.get('/aggregate/:anualidad/:campo', metaenvironment.api.aggregate);
		app.get('/aggregate/:anualidad/:campo/:match', metaenvironment.api.aggregate);
		app.get('/arbol', metaenvironment.api.arbol);
		app.get('/arbol/:withemptynodes', metaenvironment.api.arbol);
		app.get('/cr/:id', metaenvironment.importador.parseCr);
		app.get('/entidadesObjetoByResponsable/:codplaza', metaenvironment.entidadobjeto.entidadobjetoByResponsable);
		app.get('/entidadobjetoList/:idjerarquia', metaenvironment.entidadobjeto.entidadobjetoList);
		app.get('/entidadobjetoList/:idjerarquia/:recursivo', metaenvironment.entidadobjeto.entidadobjetoList);
		app.get('/etiqueta', metaenvironment.etiqueta.getEtiqueta);
		app.get('/expediente/:procedimiento/:id', metaenvironment.expediente.expediente);
		app.get('/exportador/informe/:year', metaenvironment.exportador.exportarInforme);
		app.get('/exportador/jerarquia/:jerarquia', metaenvironment.exportador.tablaResultadosJerarquia);
		app.get('/exportador/procedimiento/:codigo/:year', metaenvironment.exportador.tablaResultadosProcedimiento);
		app.get('/gs/:id', metaenvironment.importador.parseGS);
		app.get('/importacion', metaenvironment.importador.importacionesprocedimiento);
		app.get('/jerarquia/:idjerarquia', metaenvironment.jerarquia.getNodoJerarquia);
		app.get('/jerarquia/resumen/:idjerarquia', metaenvironment.jerarquia.getResumenJerarquia);
		app.get('/jerarquiaancestros/:idjerarquia', metaenvironment.jerarquia.getAncestros);
		app.get('/mapReducePeriodos', metaenvironment.exportador.mapReducePeriodosExpress);
		app.get('/operador', metaenvironment.operador.getOperador);
		app.get('/operador/:id', metaenvironment.operador.getOperador);
		app.get('/permisoscalculados', metaenvironment.login.getpermisoscalculados);
		app.get('/procedimiento', metaenvironment.procedimiento.procedimiento);
		app.get('/procedimiento/:codigo', metaenvironment.procedimiento.procedimiento);
		app.get('/procedimientoCount', metaenvironment.procedimiento.totalProcedimientos);
		app.get('/procedimientoHasChildren/:codigo', metaenvironment.procedimiento.hasChildred);
		app.get('/procedimientoList', metaenvironment.procedimiento.procedimientoList);
		app.get('/procedimientoList/:idjerarquia', metaenvironment.procedimiento.procedimientoList);
		app.get('/procedimientoList/:idjerarquia/:recursivo', metaenvironment.procedimiento.procedimientoList);
		app.get('/procedimientosByResponsable/:codplaza', metaenvironment.procedimiento.procedimientosByResponsable);
		app.get('/procedimientosSinExpedientes', metaenvironment.procedimiento.procedimientosSinExpedientes);
		app.get('/procedimientosSinExpedientes/:anualidad', metaenvironment.procedimiento.procedimientosSinExpedientes);
		app.get('/ratioResueltos', metaenvironment.procedimiento.ratioResueltos);
		app.get('/ratioResueltos/:anualidad', metaenvironment.procedimiento.ratioResueltos);
		app.get('/raw/:modelname', metaenvironment.api.raw);
		app.get('/tramiteCount', metaenvironment.procedimiento.totalTramites);
		app.get('/tramiteCount/:anualidad', metaenvironment.procedimiento.totalTramites);
		app.get('/tramitesMediaMes', metaenvironment.procedimiento.mediaMesTramites);
		app.get('/tramitesMediaMes/:anualidad', metaenvironment.procedimiento.mediaMesTramites);

		app.post('/etiqueta/:id', metaenvironment.etiqueta.newEtiqueta);
		app.post('/expediente/:procedimiento', metaenvironment.expediente.initExpediente);
		app.post('/importacion/:id', metaenvironment.importador.applyImportacionProcedimiento);
		app.post('/operador', metaenvironment.operador.newOperador);
		app.post('/procedimiento/:codigo', metaenvironment.procedimiento.createProcedimiento);
		app.post('/updateByFile', metaenvironment.upload.update, metaenvironment.csvsici.parse);
		app.post('/updateByFileIE', metaenvironment.upload.update, metaenvironment.csvsici.parse);

		app.put('/etiqueta/:id', metaenvironment.etiqueta.updateEtiqueta);
		app.put('/expediente/:procedimiento/:id', metaenvironment.expediente.updateExpediente);
		app.put('/operador/:id', metaenvironment.operador.updateOperador);
		app.put('/procedimiento/:codigo', metaenvironment.procedimiento.updateProcedimiento);

		this.app = app;
	}

	module.exports = Api;

})(module);
