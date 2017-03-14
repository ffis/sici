(function(module, process, logger){
	'use strict';
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

	const Q = require('q'),
		soap = require('../lib/soap');

	const WS_USUARIO_EN_GESPER = '00';
	const WS_USUARIO_NO_EN_GESPER = '01';
	const EXPRESSION_REGULAR_CODIGO_PLAZA = new RegExp(/X{3}\d{3}/i);
	const EXPRESSION_REGULAR_CODIGO_PLAZA2 = new RegExp(/[A-Z]{2}\d{5}/);
	const EXPRESSION_REGULAR_LOGIN_CARM = new RegExp(/[a-z]{3}\d{2}[a-z]{1}/);
	const EXPRESSION_REGULAR_RESPUESTA_WS = new RegExp(/(\d{2})\.-(.*)/g);

	module.exports.get = function (req, res) {
		const personamodel = req.metaenvironment.models.persona(),
			id = req.params.id;
		if (typeof id === 'string' && id !== ''){
			personamodel.findOne({'_id': req.metaenvironment.models.ObjectId(id)}, req.eh.cbHelper(res));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	module.exports.personasByPuesto = function (req, res) {
		const personamodel = req.metaenvironment.models.persona();
		if (typeof req.params.cod_plaza === 'string' && req.params.cod_plaza !== ''){
			personamodel.find({codplaza: req.params.cod_plaza}, req.eh.cbHelper(res));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	module.exports.personasByLogin = function (req, res) {
		const personamodel = req.metaenvironment.models.persona();
		if (typeof req.params.login !== 'undefined' && req.params.cod_plaza !== ''){
			personamodel.find({login: req.params.login}, req.eh.cbHelper(res));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	module.exports.setHabilitado = function(req, res){
		const personamodel = req.metaenvironment.models.persona(),
			id = req.params.id,
			content = req.body,
			habilitado = content.habilitado ? content.habilitado === 'true' || content.habilitado === true : false;
		personamodel.update({'_id': id}, {'$set': {habilitado: habilitado}}, req.eh.cbWithDefaultValue(res, {habilitado: habilitado, id: id}));
	};

	module.exports.updatePersona = function (req, res) {
		const personamodel = req.metaenvironment.models.persona(),
			id = req.params.id,
			content = req.body;
		personamodel.update({'_id': id}, content, {upsert: true}, req.eh.cbHelper(res));
	};

	module.exports.newPersona = function (req, res) {
		const personamodel = req.metaenvironment.models.persona(),
			content = req.body;
		personamodel.create(content, req.eh.cbWithDefaultValue(res, content));
	};

	module.exports.personasByRegex = function (models, cfg) {
		return function (req, res) {
			var personamodel = models.persona();
			var restriccion = {};
			if (typeof req.params.regex === 'string'){
				restriccion = {
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
				personamodel.find(restriccion, function (err, data) {
					if (err) {
						req.eh.callbackErrorHelper(res, err);

						return;
					}

					if (data.length === 0) {
						if (EXPRESSION_REGULAR_LOGIN_CARM.test(req.params.regex)) {
							exports.infoByLogin(req.params.regex, cfg).then(function(result) {
								if ((result !== null) && (typeof result.return !== 'undefined') && (result.return.length > 0) && (result.return[2].key === 'ERR_MSG')) {
									var msg = result.return[2].value;

									var valores = /(\d{2})\.-(.*)/g.exec(msg);
									if (valores !== null) {
										if (valores[1] !== '00') {
											logger.error(valores[2]);
											res.json(data);

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
										const defaultOutput = [{'login': nuevaPersona.login, 'codplaza': nuevaPersona.codplaza, 'nombre': nuevaPersona.nombre, 'apellidos': nuevaPersona.apellidos}];
										personamodel.create(nuevaPersona, req.eh.cbWithDefaultValue(res, defaultOutput));

									} else if (result){
										res.json(data);
									} else {
										req.eh.notFoundHelper(res);
									}
								}
							}, req.eh.errorHelper(res));

							return;
						}
						var regPlaza = new RegExp(/[A-Z]{2}\d{5}/);
						if (regPlaza.test(req.params.regex)) {
							exports.registroPersonaWS(req.params.regex, models, cfg).then(res.json, function(erro) {
								logger.error(erro);
								/* TODO revisar esto, debería devolver un 500? */
								res.json(data);
							});
						} else {
							res.json(data);
						}
					} else {
						res.json(data);
					}
				});
			} else {
				req.eh.missingParameterHelper(res, 'regex');
			}
		};
	};

	module.exports.registroPersonaWS = function (codplaza, models, cfg) {
		var deferRegistro = Q.defer();
		var personamodel = models.persona();
		personamodel.count({'codplaza': codplaza}, function (err, count) {
			if (err){
				deferRegistro.reject(err);
			} else if (count === 0) {
				exports.infoByPlaza(codplaza, cfg).then(function (result) {
					if ((result !== null) && (typeof result.return !== 'undefined') && (result.return.length > 0) && (result.return[2].key === 'ERR_MSG')) {
						var msg = result.return[2].value;
						var valores = /(\d{2})\.-(.*)/g.exec(msg);
						if (Array.isArray(valores)) {
							if (valores[1] === '00') {

								const nuevaPersona = {
									codplaza: codplaza,
									login: result.return[0].value,
									nombre: result.return[1].value, /* TODO: revisar incoherencia con infoByLogin */
									apellidos: (result.return[6].value + ' ' + result.return[5].value).trim(),
									telefono: result.return[7].value,
									habilitado: false
								};
								const output = [{'login': nuevaPersona.login, 'codplaza': nuevaPersona.codplaza, 'nombre': nuevaPersona.nombre, 'apellidos': nuevaPersona.apellidos}];
										
								nuevaPersona.create(nuevaPersona, function(erro) {
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
							deferRegistro.reject(err);
						}
					} else {
						deferRegistro.reject('Error inespecificado del servicio web.');
					}
				}, deferRegistro.reject);
			} else {
				deferRegistro.reject('Ya existe una persona registrada con ese codplaza.');
			}
		});

		return deferRegistro.promise;
	};

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
			args = {arg0: {key: 'P_PLAZA', value: req.params.codplaza}};
		callWs(cfg, 'SacaOcupante', args, req.eh.cbHelper(res));
	}

	function infoByLogin2(req, res) {
		const cfg = req.metaenvironment.cfg,
			args = {arg0: {key: 'p_login', value: req.params.login}};
		callWs(cfg, 'SacaPlaza', args, req.eh.cbHelper(res));
	}

	function infoByLogin(login, cfg) {
		const def = Q.defer(),
			args = {arg0: {key: 'p_login', value: login}};
		callWs(cfg, 'SacaPlaza', args, def.makeNodeResolver());

		return def.promise;
	}

	function infoByPlaza(codplaza, cfg) {
		const def = Q.defer(),
			args = {arg0: {key: 'P_PLAZA', value: codplaza}};
		callWs(cfg, 'SacaOcupante', args, def.makeNodeResolver());

		return def.promise;
	}

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
		personamodel.find(restriccion).sort({ultimoupdate: 1}).limit(1).exec().then(function(personas){
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
				const msg = result.return[2].value;
				const valores = /(\d{2})\.-(.*)/g.exec(msg);
				if (Array.isArray(valores)) {
					if (valores[1] === WS_USUARIO_EN_GESPER) {
						const codplaza = result.return[1].value;
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
						const codplaza = persona.codplaza;
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
					} else {
						personamodel.count({'codplaza': codplaza}, function (erro, count) {
							if (erro) {
								promesaUpdate.reject(erro);
							} else if (count > 0) {
									promesaUpdate.resolve();
							} else {
								module.exports.registroPersonaWS(codplaza, models, cfg).then(function(/*resultado*/) {
									//fila.nuevoUsuario = resultado.login;
									promesaUpdate.resolve();
								}, function (error) {
									promesaUpdate.reject(error);
								});
							}
						});
					}
				});
			}, promesaUpdate.reject);
			
			Q.all(promesasActualizacion).then(function(){
				res.json(filas);
			}, req.eh.errorHelper(res));
		}, req.eh.errorHelper(res));
	};

	module.exports.personassearchlist = function (req, res){
		const models = req.metaenvironment.models,
			personamodel = models.persona(),
			procedimientomodel = models.procedimiento();

		const deferProcedimiento = Q.defer();

		/// 1. Buscamos personas en la tabla personas.
		const deferPersona = personamodel.find({}, {codplaza: true, login: true, nombre: true, apellidos: true}).exec();

		/// 2. Buscamos personas como responsables de procedimientos ... ¡¡¡Y que no estén en el primer grupo!!!
		procedimientomodel.aggregate().unwind('responsables').group(
				{
					'_id': {
						'login': '$responsables.login',
						'codplaza': '$responsables.codplaza'
					},
					'nombre': {'$first': '$responsables.nombre'},
					'apellidos': {'$first': '$responsables.apellidos'}
				}
			).exec(deferProcedimiento.makeNodeResolver());

		Q.all([deferPersona.promise, deferProcedimiento.promise]).then(function(data){
			const r = {};
			const response = [];
			const personasByPersona = data[0];
			const personasByResponsable = data[1];


			for (let i = 0; i < personasByPersona.length; i++) {
				const persona = personasByPersona[i];
				const idr = persona.login + '-' + persona.codplaza;
				r[idr] = persona;
				response.push();
			}
			for (let i = 0; i < personasByResponsable.length; i++) {
				const persona = personasByResponsable[i];
				const idr = persona._id.login + '-' + persona._id.codplaza;
				if (typeof r[idr] === 'undefined') {
					r[idr] = persona;
					response.push({data: persona._id.login + ' ; ' + persona._id.codplaza + ' ; ' + persona.nombre + ' ' + persona.apellidos});
				}
			}

			res.json(response);
		}, req.eh.errorHelper(res));
	};


	module.exports.infoByLogin = infoByLogin;
	module.exports.infoByLogin2 = infoByLogin2;
	module.exports.infoByPlaza = infoByPlaza;
	module.exports.infoByPlaza2 = infoByPlaza2;

})(module, process, console);
