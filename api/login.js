(function(module){
	'use strict';

	const crypto = require('crypto'),
		jsonwebtoken = require('jsonwebtoken');

	const capacidades = [
		'jerarquialectura',
		'jerarquiaescritura',
		'procedimientoslectura',
		'procedimientosescritura',
		'entidadobjetolectura',
		'entidadobjetoescritura',
		'jerarquiadirectalectura',
		'jerarquiadirectaescritura',
		'procedimientosdirectalectura',
		'procedimientosdirectaescritura',
		'entidadobjetodirectalectura',
		'entidadobjetodirectaescritura'
	];

	function sortHelper(a, b){
		return a > b;
	}

	function filterHelper(a, b){
		if (a.slice(-1)[0] !== b){
			a.push(b);
		}

		return a;
	}

	function calcularPermisos(permisos){

		const nowtime = (new Date()).getTime();
		const permisoscalculados = permisos.filter(function(permiso){

			return (!permiso.caducidad || (permiso.caducidad && permiso.caducidad.getTime() < nowtime));
		}).reduce(function(prev, permiso){
			prev.superuser = prev.superuser || permiso.superuser;
			prev.grantoption = prev.grantoption || permiso.grantoption;

			capacidades.forEach(function(capacidad){

				if (permiso[capacidad] && Array.isArray(permiso[capacidad]) && permiso[capacidad].length > 0){
					prev[capacidad] = prev[capacidad].concat(permiso[capacidad]);
				}
			});

			return prev;
		}, {
			'jerarquialectura': [],
			'jerarquiaescritura': [],
			'procedimientoslectura': [],
			'procedimientosescritura': [],
			'entidadobjetolectura': [],
			'entidadobjetoescritura': [],
			'jerarquiadirectalectura': [],
			'jerarquiadirectaescritura': [],
			'procedimientosdirectalectura': [],
			'procedimientosdirectaescritura': [],
			'entidadobjetodirectalectura': [],
			'entidadobjetodirectaescritura': [],
			'superuser': false,
			'grantoption': false
		});

		capacidades.forEach(function(capacidad){
			if (permisoscalculados[capacidad].length > 0){
				require('uniq')(permisoscalculados[capacidad]);
				//permisoscalculados[capacidad] = permisoscalculados[permisoscalculados].sort(sortHelper).reduce(filterHelper, []);
			}
		});

		return permisoscalculados;
	}

	module.exports.getpermisoscalculados = function(req, res){
		const permisomodel = req.metaenvironment.models.permiso();
		permisomodel.find({'_id': {'$in': req.user.idspermisos}}, function(err, permisos){
			if (err) {
				req.eh.callbackErrorHelper(res, err);
			} else {
				res.json(calcularPermisos(permisos));
			}
		});
	};

	module.exports.setpermisoscalculados = function(req, res, next) {
		const permisomodel = req.metaenvironment.models.permiso();
		permisomodel.find({'_id': {'$in': req.user.idspermisos}}).lean().exec().then(function(permisos){
			req.user.permisoscalculados = calcularPermisos(permisos);
			next();
		}, next);
	};

	function getErrorHandler(req, res, modoconsulta){

		return function(err){
			if (modoconsulta){
				req.eh.notFoundHelper(res);
			} else {
				req.eh.unauthenticatedHelper(res, err);
			}
		};
	}

	function getPersonAndGenerateToken(req, res, restriction, modoconsulta){
		const secret = req.metaenvironment.cfg.secret,
			cfg = req.metaenvironment.cfg,
			personamodel = req.metaenvironment.models.persona(),
			permisomodel = req.metaenvironment.models.permiso();


		personamodel.find(restriction).limit(1).exec().then(function(personas){
			if (personas.length === 0){
				getErrorHandler(req, res, modoconsulta)({'err': 'user with these restrictions not exists'});

				return;
			}
			const persona = personas[0];
			persona.ultimologin = new Date();
			persona.save();

			const restriccion = {};
			if (typeof persona.login === 'string' && persona.login !== '' && typeof persona.codplaza === 'string' && persona.codplaza !== ''){
				restriccion.$or = [{'login': persona.login}, {'codplaza': persona.codplaza}];
			} else if (typeof persona.login === 'string' && persona.login !== ''){
				restriccion.login = persona.login;
			} else if (typeof persona.codplaza === 'string' && persona.codplaza !== ''){
				restriccion.codplaza = persona.codplaza;
			} else {
				getErrorHandler(req, res, modoconsulta)();

				return;
			}

			permisomodel.find(restriccion).lean().exec().then(function (permisos){
				if (permisos.length === 0){
					getErrorHandler(req, res, modoconsulta)();
				} else {
					const o = JSON.parse(JSON.stringify(persona));
					o.idspermisos = permisos.map(function(permiso){ return permiso._id; });
					const token = jsonwebtoken.sign(o, secret, {'expiresIn': cfg.session_time});
					/* TODO: check and explain why to delete all these attrs */
					o.permisos = permisos.map(function(permiso){
						const attrsfiltrar = ['jerarquialectura', 'jerarquiaescritura', 'procedimientoslectura', 'procedimientosescritura', 'entidadobjetolectura', 'entidadobjetoescritura'];
						attrsfiltrar.forEach(function(attr){
							Reflect.deleteProperty(permiso, attr);
						});

						return permiso;
					});
					Reflect.deleteProperty(o, 'contrasenya');
					res.json({'profile': o, 'token': token});
				}
			}).fail(getErrorHandler(req, res, modoconsulta));
		}).fail(getErrorHandler(req, res, modoconsulta));
	}

	module.exports.authenticate = function(req, res){

		const restriccion = {'login': req.body.username, 'habilitado': true};
		if (req.body.notcarmuser){
			const shasum = crypto.createHash('sha256');
			shasum.update(req.body.password);
			restriccion.contrasenya = shasum.digest('hex');
		}

		getPersonAndGenerateToken(req, res, restriccion, false);
	};

	module.exports.pretend = function(req, res){
		console.log(req.user, req.user.permisoscalculados, req.user.permisoscalculados.superuser)
		if (!req.user.permisoscalculados.superuser) {
			req.eh.unauthorizedHelper(res);
		} else if (typeof req.body.username !== 'string' || req.body.username.trim() === ''){
			req.eh.missingParameterHelper(res, 'username');
		} else {
			getPersonAndGenerateToken(req, res, {'login': req.body.username.trim(), 'habilitado': true}, true);
		}
	};

})(module);
