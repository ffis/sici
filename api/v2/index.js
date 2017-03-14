(function(module){
	'use strict';
	const express = require('express');

	function Api(metaenvironment){
		const app = new express.Router();

		app.delete('/public/accionmejora/:id', metaenvironment.accionmejora.remove);
		app.delete('/public/indicador/:id', metaenvironment.carta.removeindicador);
		app.delete('/public/planmejora/:id', metaenvironment.planmejora.remove);

		app.get('/public/accionmejora', metaenvironment.accionmejora.get);
		app.get('/public/accionmejora/:id', metaenvironment.accionmejora.get);
		app.get('/public/entidadobjeto', metaenvironment.entidadobjeto.get);
		app.get('/public/entidadobjeto/:id', metaenvironment.entidadobjeto.get);
		app.get('/public/exportadorCarta/:id/:anualidad', metaenvironment.exportadorCarta.toExpress);
		app.get('/public/indicador', metaenvironment.carta.indicador);
		app.get('/public/indicador/:id', metaenvironment.carta.indicador);
		app.get('/public/informeCarta/:id', metaenvironment.cartadocx.generate);
		app.get('/public/informeCarta/:id/:anualidad', metaenvironment.cartadocx.generate);
		app.get('/public/objetivo', metaenvironment.carta.objetivo);
		app.get('/public/objetivo/:id', metaenvironment.carta.objetivo);
		app.get('/public/objetivosStats', metaenvironment.carta.objetivosStats);
		app.get('/public/planmejora/:id', metaenvironment.planmejora.get);
		app.get('/public/planmejora/list/:idjerarquia', metaenvironment.planmejora.list);
		app.get('/public/planmejora/list/:idjerarquia/:recursivo', metaenvironment.planmejora.list);
		app.get('/restricted/exportadorIndicador', metaenvironment.exportadorIndicador.toExpress);
		app.get('/restricted/registro', metaenvironment.registro.registroActividad);
		app.get('/restricted/usosIndicadores', metaenvironment.carta.usosIndicadores);

		app.post('/public/accionmejora/', metaenvironment.accionmejora.create);
		app.post('/public/dropCarta/:id', metaenvironment.carta.dropCarta);
		app.post('/public/entidadobjeto', metaenvironment.entidadobjeto.create);
		app.post('/public/indicador', metaenvironment.carta.newIndicador);
		app.post('/public/planmejora/', metaenvironment.planmejora.create);
		app.post('/public/testDownloadCarta/:id', metaenvironment.carta.testDownloadCarta);

		app.put('/public/accionmejora/:id', metaenvironment.accionmejora.update);
		app.put('/public/entidadobjeto/:id', metaenvironment.entidadobjeto.update);
		app.put('/public/indicador/:id', metaenvironment.carta.actualizaindicador);
		app.put('/public/objetivo/:id', metaenvironment.carta.actualizaobjetivo);
		app.put('/public/planmejora/:id', metaenvironment.planmejora.update);
		app.put('/public/updateformula', metaenvironment.carta.updateFormula);

		this.app = app;
	}

	module.exports = Api;

})(module);
