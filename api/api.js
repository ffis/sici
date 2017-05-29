(function(module){
	'use strict';
	const express = require('express'),
		expressJwt = require('express-jwt'),
		path = require('path'),
		V1 = require('./v1'),
		V2 = require('./v2'),
		Bot = require('./bot');

	const Ec = require('./exportador_carta'),
		Ei = require('./exportador_indicador');

	function Api(models, cfg, settings){

		const metaenvironment = {
			accionmejora: require('./accionmejora'),
			api: require('./util'),
			cartadocx: require('./carta_docx'),
			carta: require('./carta'),
			cas: require('./cas'),
			csvsici: require('./csvsici'),
			entidadobjeto: require('./entidadobjeto'),
			expresshelper: require('./expresshelper'),
			etiqueta: require('./etiqueta'),
			expediente: require('./expediente'),
			exportador: require('./exportador'),
			exportadorCarta: new Ec(models, path.join(settings.templates.xlsxcartas)),
			exportadorIndicador: new Ei(models, path.join(settings.templates.xlsxcartas)),
			feedback: require('./feedback'),
			importador: require('./importador'),
			jerarquia: require('./jerarquia'),
			logincarm: require('./login.carm'),
			login: require('./login'),
			operador: require('./operador'),
			periodos: require('./periodos'),
			permiso: require('./permiso'),
			persona: require('./persona'),
			planmejora: require('./planmejora'),
			procedimiento: require('./procedimiento'),
			recalculate: require('./recalculate'),
			registro: require('./registro'),
			reglainconsistencia: require('./reglainconsistencia'),
			upload: require('./upload'),
			settings: settings,
			cfg: cfg,
			models: models
		};

		const v1 = new V1(metaenvironment),
			v2 = new V2(metaenvironment),
			bot = new Bot(metaenvironment);
		
		this.app = new express.Router();
		this.app.use('/', function(req, res, next){
			req.metaenvironment = metaenvironment;
			req.eh = metaenvironment.expresshelper;
			next();
		});

		this.app.use('/authenticate', metaenvironment.cas.casLogin, metaenvironment.login.authenticate);
		this.app.use('/download/:token/:hash', metaenvironment.exportador.download);
		this.app.use('/bot', bot.app);

		this.app.use('/', function(req, res, next){
			if (req.headers && req.headers.authorization) {
				const parts = req.headers.authorization.split(' ');
				if (parts.length === 2) {
					const scheme = parts[0];
					if (/^Bearer$/i.test(scheme)) {
						next();

						return;
					}
				}
			}
			req.eh.unauthenticatedHelper(res);

		}, expressJwt({'secret': cfg.secret}));

		this.app.use('/', metaenvironment.login.setpermisoscalculados);
		this.app.use('/', metaenvironment.api.log);

		this.app.use('/v1', v1.app);
		this.app.use('/v2', v2.app);

		this.metaenvironment = metaenvironment;
	}

	module.exports = Api;

})(module);
