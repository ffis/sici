(function(module){
	'use strict';

	const express = require('express');

	function Api(metaenvironment){
		const app = new express.Router();

		app.use('/', function(req, res, next){
			if (req.ip === '127.0.0.1' || req.ip === '::ffff:127.0.0.1'){
				return next();
			}
			req.eh.unauthorizedHelper(res);

			return next({error: 'unauthorized'});
		});

		/* funcionalidad bots */
		app.get('/personas/actualizarGesper', metaenvironment.persona.updateCodPlazaByLogin );
		app.get('/personas/actualizarGesper/:login', metaenvironment.persona.updateCodPlazaByLogin );

		this.app = app;
	}

	module.exports = Api;

})(module);
