(function(module){
	'use strict';
	const express = require('express');

	function Api(metaenvironment){
		const app = new express.Router();



		app.get('/private/teletrabajador/:id', metaenvironment.teletrabajador.isTeletrabajador);
		app.put('/private/teletrabajador/:id', metaenvironment.teletrabajador.setTeletrabajador);




		this.app = app;
	}

	module.exports = Api;

})(module);
