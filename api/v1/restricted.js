(function(module){
	'use strict';
	const express = require('express');

	function Api(metaenvironment){
		const app = new express.Router();

		app.get('/fprocedimiento', metaenvironment.recalculate.fprocedimiento);
		app.get('/fjerarquia', metaenvironment.recalculate.fjerarquia);
		app.get('/fpermiso', metaenvironment.recalculate.fpermiso);

		app.get('/periodos', metaenvironment.periodos.getPeriodo);
		app.get('/periodos/:id', metaenvironment.periodos.getPeriodo);
		app.put('/periodos/:id', metaenvironment.periodos.updatePeriodo);
		app.post('/periodos/:id', metaenvironment.periodos.newPeriodo);
		app.delete('/periodos/:id', metaenvironment.periodos.removePeriodo);

		app.post('/anualidad/:anyo', metaenvironment.periodos.nuevaAnualidad);
		app.post('/pretend/:username', metaenvironment.login.pretend);

		app.get('/persona/:id', metaenvironment.persona.get);
		app.post('/persona', metaenvironment.persona.newPersona);
		app.put('/persona/:id', metaenvironment.persona.updatePersona);
		app.post('/habilitar/persona/:id', metaenvironment.persona.setHabilitado);

		app.get('/feedback', metaenvironment.feedback.get);
		app.get('/feedback/:id', metaenvironment.feedback.get);
		app.put('/feedback/:id', metaenvironment.feedback.update);
		app.delete('/feedback/:id', metaenvironment.feedback.remove);

		app.get('/reglasinconsistencias', metaenvironment.reglainconsistencia.getReglaInconsistencia);
		app.get('/reglasinconsistencias/:id', metaenvironment.reglainconsistencia.getReglaInconsistencia);
		app.post('/reglasinconsistencias', metaenvironment.reglainconsistencia.newReglaInconsistencia);
		app.put('/reglasinconsistencias/:id', metaenvironment.reglainconsistencia.updateReglaInconsistencia);
		app.delete('/reglasinconsistencias/:id', metaenvironment.reglainconsistencia.removeReglaInconsistencia);
		this.app = app;
	}

	module.exports = Api;

})(module);
