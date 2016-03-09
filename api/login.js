(function(module, logger){
	'use strict';

	function calcularPermisos(permisos){
		var permisoscalculados = {
			jerarquialectura: [], jerarquiaescritura: [],
			procedimientoslectura: [], procedimientosescritura: [],
			entidadobjetolectura : [], entidadobjetoescritura: [],
			superuser: false,
			grantoption: false
		};

		var now = new Date();
		logger.log('Cargando...', permisos.length);
		for (var i = 0, j = permisos.length; i < j; i++ ){
			logger.log(permisos[i]);
			if (!permisos[i].caducidad || permisos[i].caducidad.getTime() < now.getTime())
			{
				permisoscalculados.superuser = permisoscalculados.superuser || permisos[i].superuser;
				permisoscalculados.jerarquiaescritura = permisoscalculados.jerarquiaescritura.concat( permisos[i].jerarquiaescritura);
				permisoscalculados.procedimientosescritura = permisoscalculados.procedimientosescritura.concat( permisos[i].procedimientosescritura);
				permisoscalculados.entidadobjetoescritura = permisoscalculados.entidadobjetoescritura.concat ( permisos[i].entidadobjetoescritura);
				permisoscalculados.grantoption = permisoscalculados.grantoption || permisos[i].grantoption;
				//o.permisos.push( permisos[i] );
			}
			var k, l;
			for (k = 0, l = permisos[i].jerarquialectura.length; k < l; k++){
				if ( (!permisos[i].caducidad || permisos[i].caducidad.getTime() < now.getTime()) &&
					(permisoscalculados.jerarquiaescritura.indexOf(permisos[i].jerarquialectura[k]) === -1 ) )
				{
					permisoscalculados.jerarquialectura.push( permisos[i].jerarquialectura[k]);
				}
			}
			for (k = 0, l = permisos[i].procedimientoslectura.length; k < l; k++){
				if ( (!permisos[i].caducidad || permisos[i].caducidad.getTime() < now.getTime()) &&
					(permisoscalculados.procedimientosescritura.indexOf(permisos[i].procedimientoslectura[k]) === -1 ) )
				{
					permisoscalculados.procedimientoslectura.push( permisos[i].procedimientoslectura[k]);
				}
			}
			for (k = 0, l = permisos[i].entidadobjetolectura.length; k < l; k++){
				if ( (!permisos[i].caducidad || permisos[i].caducidad.getTime() < now.getTime()) &&
					(permisoscalculados.entidadobjetoescritura.indexOf(permisos[i].entidadobjetolectura[k]) === -1 ) )
				{
					permisoscalculados.entidadobjetolectura.push( permisos[i].entidadobjetolectura[k]);
				}
			}
		}

		return permisoscalculados;
	}

	module.exports.getpermisoscalculados = function(models) {
		return function(req, res){
			var Permisos = models.permiso();
			Permisos.find({'_id': {'$in': req.user.idspermisos}}, function(err, permisos){
				if (err) {
					res.status(500).json({error: 'Error getpermisoscalculados', details: err});
				} else {
					var permisoscalculados = calcularPermisos(permisos);
					res.json(permisoscalculados);
				}
			});
		};
	};

	module.exports.setpermisoscalculados = function(config){
		return function(req, res, next) {
			var Permisos = config.models.permiso();
			Permisos.find({'_id': {'$in': req.user.idspermisos}}, function(err, permisos){
				if (err){
					next(err);
				} else {
					var permisoscalculados = calcularPermisos(permisos);
					req.user.permisoscalculados = permisoscalculados;
					next();
				}
			});
		};
	};

	module.exports.authenticate = function(config){
		var jwt = config.jwt;
		var secret = config.secret;
		var Persona = config.models.persona();
		var Permisos = config.models.permiso();
		var crypto = config.crypto;

		if (!jwt || !secret || !Persona || !Permisos){
			throw new Error('bad config for authenticate method');
		}

		return function(req, res){
			var shasum;

			//should delegate
			//if is invalid, return 401
			//for testing this should be enough

			/*if (req.body.password !== 'password') {
				res.status(401).send('Wrong password');
				return;
			}*/

			var restriccion = {login: req.body.username, habilitado: true};

			if (req.body.notcarmuser){
				shasum = crypto.createHash('sha256');
				shasum.update(req.body.password);
				restriccion.contrasenya = shasum.digest('hex');
			}

			//console.log(restriccion);
			Persona.find( restriccion,
				function(err, personas){
					if (err || personas.length === 0)
					{
						res.status(401).send('Wrong user or password');
						return;
					}
					personas[0].ultimologin = new Date();
					personas[0].save();

					//Permisos are bound using login or codplaza
					Permisos.find(
						{ $or: [ {login: personas[0].login}, {codplaza: personas[0].codplaza} ] },
						function (erro, permisos){
							if (erro || permisos.length === 0){
								res.status(404).json({error: 'Sin permisos'});
							} else {
								var o = JSON.parse(JSON.stringify(personas[0]));
								o.idspermisos = [];
								for (var i = 0, j = permisos.length; i < j; i++ ){
									o.idspermisos.push(permisos[i]._id);
									delete permisos[i].jerarquialectura;
									delete permisos[i].jerarquiaescritura;
									delete permisos[i].procedimientosescritura;
									delete permisos[i].procedimientosescritura;
								}
								o.permisos = permisos;
								var token = jwt.sign(o, secret, { expiresIn: config.session_time });
								res.json({ profile: o, token: token });
							}
						}
					);
				}
			);
		};
	};

	module.exports.pretend = function(config){
		var jwt = config.jwt,
			secret = config.secret,
			Persona = config.models.persona(),
			Permisos = config.models.permiso();

		if (!jwt || !secret || !Persona || !Permisos){
			throw new Error('bad config for pretend method');
		}

		return function(req, res){
			if (!req.user || !req.user.permisoscalculados || !req.user.permisoscalculados.superuser) {
				res.status(403).json({'error': 'Not allowed'}); /* provoca perdida de sesión */
			}else if (typeof req.body.username === 'undefined'){
				res.status(404).json({'error': 'Fallo de petición'});
			} else {
				Persona.find( { login: req.body.username, habilitado: true },
					function(err, personas){
						if (err || personas.length === 0)
						{
							res.status(404).json({'error': 'Petición fallida o usuario no encontrado en la base de datos.'});
						} else {
							personas[0].ultimologin = new Date();
							personas[0].save();
							//Permisos are bound using login or codplaza
							Permisos.find(
								{ $or: [ {login: personas[0].login}, {codplaza: personas[0].codplaza} ] },
								function (erro, permisos){
									if (erro || permisos.length === 0){
										res.status(404).json({'error': 'El usuario no tiene permisos específicos para usar la aplicación.'});
									} else {
										var o = JSON.parse(JSON.stringify(personas[0]));
										o.idspermisos = [];
										for (var i = 0, j = permisos.length; i < j; i++ ){
											o.idspermisos.push(permisos[i]._id);
											delete permisos[i].jerarquialectura;
											delete permisos[i].jerarquiaescritura;
											delete permisos[i].procedimientosescritura;
											delete permisos[i].procedimientosescritura;
										}
										o.permisos = permisos;
										var token = jwt.sign(o, secret, { expiresIn: 86400000 }); /* 1 day */
										res.json({ profile: o, token: token });
									}
								}
							);
						}
					}
				);
			}
		};
	};

})(module, console);