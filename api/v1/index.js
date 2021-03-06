(function(module){
	'use strict';
	const express = require('express'),
		Publiclib = require('./public'),
		Privatelib = require('./private'),
		Restrictedlib = require('./restricted');

	function Api(metaenvironment){
		const app = new express.Router();
		const publiclib = new Publiclib(metaenvironment);
		const privatelib = new Privatelib(metaenvironment);
		const restrictedlib = new Restrictedlib(metaenvironment);

		app.use('/restricted/', function(req, res, next){
			if (req.user.permisoscalculados.superuser){

				return next();
			}
			req.eh.unauthorizedHelper(res);

			return next({error: 'unauthorized'});
		});
		app.use('/private/', function(req, res, next){
			if (req.user.permisoscalculados.superuser || req.user.permisoscalculados.grantoption){

				return next();
			}
			req.eh.unauthorizedHelper(res);

			return next({error: 'unauthorized'});
		});

		app.use('/public', publiclib.app);
		app.use('/private', privatelib.app);
		app.use('/restricted', restrictedlib.app);
		
		this.app = app;
	}

	module.exports = Api;

})(module);
