(function(module, process, logger){
	'use strict';
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

	const Q = require('q'),
		crypto = require('crypto'),
		soap = require('../lib/soap');

	const WS_USUARIO_EN_GESPER = '00';
	const WS_USUARIO_NO_EN_GESPER = '01';
	const EXPRESSION_REGULAR_CODIGO_PLAZA = /X{3}\d{3}/i;
	const EXPRESSION_REGULAR_CODIGO_PLAZA2 = /[A-Z]{2}\d{5}/;
	const EXPRESSION_REGULAR_LOGIN_CARM = /[a-z]{3}\d{2}[a-z]{1}/;
	const EXPRESSION_REGULAR_RESPUESTA_WS = /(\d{2})\.-(.*)/g;

	function callWs(cfg, method, args, cb){
		soap.createClient(cfg.ws_url, {}, function (err, client) {
			if (err) {
				cb(err);
			} else {
				client.setSecurity(new soap.WSSecurity(cfg.ws_user, cfg.ws_pwd, 'PasswordText'));
				client[method](args, cb);
			}
		});
	}

	function infoByPlaza2(req, res) {
		const cfg = req.metaenvironment.cfg,
			args = {'arg0': {'key': 'P_PLAZA', 'value': req.params.codplaza}};
		callWs(cfg, 'SacaOcupante', args, req.eh.cb(res));
	}

	function infoByLogin2(req, res) {
		const cfg = req.metaenvironment.cfg,
			args = {'arg0': {'key': 'p_login', 'value': req.params.login}};
		callWs(cfg, 'SacaPlaza', args, req.eh.cb(res));
	}

	function infoByLogin(login, cfg) {
		const def = Q.defer(),
			args = {'arg0': {'key': 'p_login', 'value': login}};
		callWs(cfg, 'SacaPlaza', args, def.makeNodeResolver());

		return def.promise;
	}

	function infoByPlaza(codplaza, cfg) {
		const def = Q.defer(),
			args = {'arg0': {'key': 'P_PLAZA', 'value': codplaza}};
		callWs(cfg, 'SacaOcupante', args, def.makeNodeResolver());

		return def.promise;
	}

	module.exports.get = function (req, res) {
		const personamodel = req.metaenvironment.models.persona(),
			id = req.params.id;
		if (typeof id === 'string' && id.trim() !== ''){
			personamodel.findOne({'_id': req.metaenvironment.models.objectId(id)}, req.eh.cb(res));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	module.exports.personasByPuesto = function (req, res) {
		const personamodel = req.metaenvironment.models.persona();
		if (typeof req.params.cod_plaza === 'string' && req.params.cod_plaza !== ''){
			personamodel.find({'codplaza': req.params.cod_plaza}, {'contrasenya': 0}, req.eh.cb(res));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	module.exports.personasByLogin = function (req, res) {
		const personamodel = req.metaenvironment.models.persona();
		if (typeof req.params.login !== 'undefined' && req.params.cod_plaza !== ''){
			personamodel.find({'login': req.params.login}, {'contrasenya': 0}, req.eh.cb(res));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	module.exports.setHabilitado = function(req, res){
		const models = req.metaenvironment.models,
			personamodel = models.persona(),
			id = req.params.id,
			content = req.body,
			habilitado = content.habilitado ? content.habilitado === 'true' || content.habilitado === true : false;
		personamodel.update({'_id': models.objectId(id)}, {'$set': {'habilitado': habilitado}}, req.eh.cbWithDefaultValue(res, {'habilitado': habilitado, 'id': id}));
	};

	module.exports.updatePersona = function (req, res) {
		const personamodel = req.metaenvironment.models.persona(),
			id = req.params.id,
			content = req.body;
		personamodel.update({'_id': id}, content, {'upsert': false}, req.eh.cb(res));
	};

	module.exports.newPersona = function (req, res) {
		const personamodel = req.metaenvironment.models.persona(),
			content = req.body,
			login = content.login;

		if (typeof login === 'string' && login.trim() !== ''){
			personamodel.findOne({'login': login.trim()}, function(err, user){
				if (err){
					req.eh.callbackErrorHelper(err);
				} else if (user){
					req.eh.notFoundHelper(res);
				} else {
					if (typeof content.contrasenya !== 'undefined'){
						if (typeof content.contrasenya === 'string'){
							const shasum = crypto.createHash('sha256');
							shasum.update(content.contrasenya.trim());
							content.contrasenya = shasum.digest('hex');
						} else {
							Reflect.deleteProperty(content, 'contrasenya');
						}
					}
					personamodel.create(content, req.eh.cbWithDefaultValue(res, content));
				}
			});
		} else {
			req.eh.missingParameterHelper(res, 'login');
		}
	};

	function registroPersonaWS(codplaza, models, cfg) {
		var deferRegistro = Q.defer();
		var personamodel = models.persona();
		personamodel.count({'codplaza': codplaza}, function (err, count) {
			if (err){
				deferRegistro.reject(err);
			} else if (count === 0) {
				infoByPlaza(codplaza, cfg).then(function (result) {
					if ((result !== null) && result.length > 0 && (typeof result[0].return !== 'undefined') && (result[0].return.length > 0) && (result[0].return[2].key === 'ERR_MSG')) {
						result = result[0];
						var msg = result.return[2].value;
						var valores = EXPRESSION_REGULAR_RESPUESTA_WS.exec(msg);
						if (Array.isArray(valores)) {
							if (valores[1] === '00') {

								const nuevaPersona = {
									'codplaza': codplaza,
									'login': result.return[0].value,
									'nombre': result.return[1].value, /* TODO: revisar incoherencia con infoByLogin */
									'apellidos': (result.return[6].value + ' ' + result.return[5].value).trim(),
									'telefono': result.return[7].value,
									'habilitado': false
								};
								const output = [{'login': nuevaPersona.login, 'codplaza': nuevaPersona.codplaza, 'nombre': nuevaPersona.nombre, 'apellidos': nuevaPersona.apellidos}];
										
								personamodel.create(nuevaPersona, function(erro) {
									if (erro) {
										deferRegistro.reject(erro);
									} else {
										deferRegistro.resolve(output);
									}
								});
							} else {
								deferRegistro.reject(valores);
							}
						} else {
							deferRegistro.reject({err: 'El mensaje de error no cumple el patrón esperado', 'details': valores});
						}
					} else {
						deferRegistro.reject({err: 'Error inespecificado del servicio web.', details: result[0].return});
					}
				}).fail(deferRegistro.reject);
			} else {
				deferRegistro.reject('Ya existe una persona registrada con ese codplaza.');
			}
		});

		return deferRegistro.promise;
	}

	module.exports.personasByRegex = function (req, res) {

		if (typeof req.params.regex === 'string'){
			const models = req.metaenvironment.models,
				cfg = req.metaenvironment.cfg,
				personamodel = models.persona();
			const defer = Q.defer();

			if (EXPRESSION_REGULAR_LOGIN_CARM.test(req.params.regex)){
				infoByLogin(req.params.regex, cfg).then(function(result) {
					
					if (result !== null && result.length > 0 &&  (typeof result[0].return !== 'undefined') && (result[0].return.length > 0) && (result[0].return[2].key === 'ERR_MSG')) {
						result = result[0];
						const msg = result.return[2].value;
						const valores = EXPRESSION_REGULAR_RESPUESTA_WS.exec(msg);
						if (valores !== null) {
							if (valores[1] !== '00') {
								logger.error(valores[2]);
								defer.resolve();

								return;
							}

							const nuevaPersona = {
								codplaza: result.return[1].value,
								login: req.params.regex,
								nombre: result.return[0].value,
								apellidos: result.return[6].value + ' ' + result.return[5].value,
								telefono: result.return[7].value,
								habilitado: false
							};
							personamodel.findOneAndUpdate({'login': nuevaPersona.login}, nuevaPersona, {'upsert': true, 'new': true}, function(){
								defer.resolve();
							});

						} else {
							defer.resolve();
						}
					}
				}).fail(defer.resolve);
			} else if (EXPRESSION_REGULAR_CODIGO_PLAZA2.test(req.params.regex)){
				registroPersonaWS(req.params.regex, models, cfg).then(defer.resolve).fail(defer.resolve);
			} else {
				defer.resolve();
			}

			const restriccion = {
				'$or': [
					{
						'login': {
							'$regex': '^' + req.params.regex,
							'$options': 'i'
						}
					},
					{
						'codplaza': {
							'$regex': '^' + req.params.regex,
							'$options': 'i'
						}
					},
					{
						'nombre': {
							'$regex': '^' + req.params.regex,
							'$options': 'i'
						}
					},
					{
						'apellidos': {
							'$regex': '^' + req.params.regex,
							'$options': 'i'
						}
					}
				]
			};

			defer.promise.then(function(){
				personamodel.find(restriccion, {'contrasenya': 0}).lean().exec().then(function(data){
					if (Array.isArray(data) && data.length > 0){
						res.json(data);
					} else {
						req.eh.notFoundHelper(res);
					}
				}).fail(req.eh.errorHelper(res));
			}).fail(req.eh.errorHelper(res));
		} else {
			req.eh.missingParameterHelper(res, 'regex');
		}
	};

	/* TODO: ESTE METODO DEBE REVISARSE, ES INCOHERENTE RESPECTO A FILA, FILAS */
	module.exports.updateCodPlazaByLogin = function (req, res) {
		const models = req.metaenvironment.models,
			cfg = req.metaenvironment.cfg,
			personamodel = models.persona();
		const filas = [];
		const promesasActualizacion = [];
		const restriccion = {habilitado: true};
		if (typeof req.params.login === 'string'){
			restriccion.login = req.params.login;
		}
		personamodel.find(restriccion).sort({'ultimoupdate': 1}).limit(1).exec().then(function(personas){
			if (personas.length === 0){
				req.eh.notFoundHelper(res);

				return;
			}
			const persona = personas.shift();
			const promesaUpdate = Q.defer();
			promesasActualizacion.push(promesaUpdate.promise);
			infoByLogin(persona.login, cfg).then(function(result){
				if (result === null || typeof result.return === 'undefined' || result.return.length === 0) {
					req.eh.notFoundHelper(res);

					return;
				}
			
				let actualizacion = false;
				let codplaza = '';
				const msg = result.return[2].value;
				const valores = EXPRESSION_REGULAR_RESPUESTA_WS.exec(msg);
				if (Array.isArray(valores)) {
					if (valores[1] === WS_USUARIO_EN_GESPER) {
						codplaza = result.return[1].value;
						const telefono = result.return[7].value;
						let mensaje = false;
						if (codplaza !== persona.codplaza){
							mensaje = 'Se modifica el código de plaza del usuario: ' + persona.login + ' pasa de [' + persona.codplaza + '] a [' + codplaza + ']';
							const fila = {'login': persona.login, 'codplaza prev': persona.codplaza, 'codplaza desp': codplaza};
							filas.push(fila);
							persona.codplaza = codplaza;
						}
						if (persona.telefono !== telefono){
							persona.telefono = telefono;
							if (mensaje){
								mensaje += ', y además se modifica su número de teléfono a: ' + telefono;
							} else {
								mensaje = 'Se modifica el teléfono del usuario: ' + persona.login;
							}
						}

						if (mensaje){
							actualizacion = {'fecha': new Date(), comentario: mensaje};
						}
						persona.telefono = telefono;

					} else if (valores[1] === WS_USUARIO_NO_EN_GESPER) {
						codplaza = persona.codplaza;
						if (EXPRESSION_REGULAR_CODIGO_PLAZA.test(persona.codplaza)) {
							actualizacion = {'fecha': new Date(), comentario: 'Usuario ' + persona.login + ' ya no está en gesper y eliminamos su código plaza ' + persona.codplaza};
							persona.codplaza = '';
						} else {
							actualizacion = {'fecha': new Date(), comentario: 'Usuario con código de plaza especial. No actualizado.'};
						}
					}
					if (actualizacion){
						persona.actualizaciones.push(actualizacion);
					}
				}
				
				persona.ultimoupdate = new Date();
				persona.save(function(err){
					if (err) {
						promesaUpdate.reject('NO se ha podido actualizar el usuario ' + persona.login + '. Error: ' + err);
					} else if (persona.codplaza === codplaza) {
							promesaUpdate.resolve();
					} else if (codplaza && codplaza !== ''){
						personamodel.count({'codplaza': codplaza}, function (erro, count) {
							if (erro) {
								promesaUpdate.reject(erro);
							} else if (count > 0) {
									promesaUpdate.resolve();
							} else {
								registroPersonaWS(codplaza, models, cfg).then(function(/*resultado*/) {
									//fila.nuevoUsuario = resultado.login;
									promesaUpdate.resolve();
								}, promesaUpdate.reject);
							}
						});
					} else {
						promesaUpdate.resolve();
					}
				});
			}, promesaUpdate.reject);
			
			Q.all(promesasActualizacion).then(function(){
				res.json(filas);
			}, req.eh.errorHelper(res));
		}, req.eh.errorHelper(res));
	};

	module.exports.infoByLogin = infoByLogin;
	module.exports.infoByLogin2 = infoByLogin2;
	module.exports.infoByPlaza = infoByPlaza;
	module.exports.infoByPlaza2 = infoByPlaza2;
	module.exports.registroPersonaWS = registroPersonaWS;

})(module, process, console);
