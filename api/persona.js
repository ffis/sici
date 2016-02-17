(function(module, process){
	'use strict';
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
	var XLSX = require('xlsx');
	var soap = require('../lib/soap');

/* mapping for using XY coordinates on excel */
	var mapping = [];

	function initMapping(){
		var i, j, prefixi, prefixj, prefix, prefixk;
		for (i = 'A'.charCodeAt(0), j = 'Z'.charCodeAt(0); i <= j; i++) {
			mapping.push(String.fromCharCode(i));
		}

		for (prefixi = 'A'.charCodeAt(0), prefixj = 'Z'.charCodeAt(0); prefixi <= prefixj; prefixi++) {
			for (i = 'A'.charCodeAt(0), j = 'Z'.charCodeAt(0); i <= j; i++) {
				mapping.push(String.fromCharCode(prefixi) + String.fromCharCode(i));
			}
		}
		for (prefix = 'A'.charCodeAt(0), prefixk = 'Z'.charCodeAt(0); prefix <= prefixk; prefix++) {
			for (prefixi = 'A'.charCodeAt(0), prefixj = 'Z'.charCodeAt(0); prefixi <= prefixj; prefixi++) {
				for (i = 'A'.charCodeAt(0), j = 'Z'.charCodeAt(0); i <= j; i++) {
					mapping.push(String.fromCharCode(prefix) + String.fromCharCode(prefixi) + String.fromCharCode(i));
				}
			}
		}
	}
	initMapping();

	function getColumn(x) {
		return mapping[x];
	}

	function parseStr2Int (str){
		var valor = parseInt(str);
		if (isNaN(valor)){
			valor = 0;
		}
		return valor;
	}

	module.exports.personasByPuesto = function (models) {
		return function (req, res) {
			var Persona = models.persona();
			var restriccion = {};
			if (typeof req.params.cod_plaza !== 'undefined'){
				restriccion.codplaza = req.params.cod_plaza;
			} else {
				res.status(400).json({error: 'Se esperaba parametro codplaza'});
				return;
			}
			Persona.find(restriccion, function (err, data) {
				if (err) {
					res.status(500).json({error: err, restriccion: restriccion});
				} else {
					res.json(data);
				}
			});
		};
	};

	module.exports.personasByLogin = function (models) {
		return function (req, res) {
			var Persona = models.persona();
			var restriccion = {};
			if (typeof req.params.login !== 'undefined'){
				restriccion.login = req.params.login;
			} else {
				res.status(400).json({error: 'Se esperaba parametro login'});
				return;
			}
			Persona.find(restriccion, function (err, data) {
				if (err) {
					res.status(500).json({error: err, restriccion: restriccion});
					return;
				} else {
					res.json(data);
				}
			});
		};
	};

	module.exports.setHabilitado = function(models){
		return function(req, res){
			var Persona = models.persona(),
				id = req.params.id,
				content = req.body,
				habilitado = content.habilitado ? content.habilitado === 'true' || content.habilitado === true : false;
			Persona.update({'_id': id}, {'$set': { habilitado: habilitado } }, function(e) {
				if (e){
					res.status(500).json({'error': 'An error has occurred during update', details: e});
				} else {
					res.json({habilitado: habilitado, id: id});
				}
			});
		};
	};

	module.exports.updatePersona = function (models) {
		return function (req, res) {
			var Persona = models.persona();
			var id = req.params.id;

			var content = req.body;
			Persona.update({'_id': id}, content, {upsert: true}, function (e) {
				if (e) {
					res.status(500).json({'error': 'An error has occurred', details: e});
				} else {
					res.send(content);
				}
			});
		};
	};

	module.exports.newPersona = function (models) {
		return function (req, res) {
			var Persona = models.persona();
			var content = req.body;
			new Persona(content).save(function (e) {
				if (e) {
					res.status(500).json({'error': 'An error has occurred', details: e});
				} else {
					res.send(content);
				}
			});
		};
	};

	module.exports.personasByRegex = function (models, Q, cfg) {
		return function (req, res) {
			var Persona = models.persona();
			var restriccion = {};
			if (typeof req.params.regex !== 'undefined') {
				restriccion = {
					'$or': [
						{
							'login': {
								'$regex': '^' + req.params.regex,
								'$options': 'i'
							}},
						{
							'codplaza': {
								'$regex': '^' + req.params.regex,
								'$options': 'i'
							}},
						{
							'nombre': {
								'$regex': '^' + req.params.regex,
								'$options': 'i'
							}},
						{
							'apellidos': {
								'$regex': '^' + req.params.regex,
								'$options': 'i'
							}}
					]
				};
				Persona.find(restriccion, function (err, data) {
					if (err) {
						res.status(500).json({'error': 'An error has occurred', details: err, restriccion: restriccion});
						return;
					}

					if (data.length === 0) {
						var regLogin = new RegExp(/[a-z]{3}\d{2}[a-z]{1}/);
						if (regLogin.test(req.params.regex)) {
							exports.infoByLogin(req.params.regex, Q, cfg).then(function (result) {
								if ((result !== null) && (typeof result.return !== 'undefined') && (result.return.length > 0) && (result.return[2].key === 'ERR_MSG')) {
									var msg = result.return[2].value;
									var valores = /(\d{2})\.-(.*)/g.exec(msg);
									if (valores !== null) {
										if (valores[1] !== '00') {
											console.error(valores[2]);
											res.json(data);
											return;
										} else {
											var nuevaPersona = new Persona();
											nuevaPersona.codplaza = result.return[1].value;
											nuevaPersona.login = req.params.regex;
											nuevaPersona.nombre = result.return[0].value;
											nuevaPersona.apellidos = result.return[6].value + ' ' + result.return[5].value;
											nuevaPersona.telefono = result.return[7].value;
											nuevaPersona.habilitado = false;
											nuevaPersona.save(function (error) {
												if (error) {
													res.status(500).json({error: 'Error guardando persona', details: error});
												} else {
													var output = [{'login': nuevaPersona.login, 'codplaza': nuevaPersona.codplaza, 'nombre': nuevaPersona.nombre, 'apellidos': nuevaPersona.apellidos}];
													res.json(output);
												}
											});
										}
									} else {
										console.log(err);
										if (result){
											res.json(data);
										} else {
											res.status(400).json({error: 'Not found'});
										}
									}
								}
							}, function (er) {
								res.status(500).json({'error': 'An error has occurred', details: er});
							});
						} else {
							var regPlaza = new RegExp(/[A-Z]{2}\d{5}/);
							if (regPlaza.test(req.params.regex)) {
								exports.registroPersonaWS(req.params.regex, models, Q).then(function (resultado) {
									res.json(resultado);
								}, function (erro) {
									console.error(erro);
									/* TODO revisar esto, debería devolver un 500? */
									res.json(data);
								});
							} else {
								res.json(data);
							}
						}
					} else {
						res.json(data);
					}
				});
			} else {
				res.status(400).json({error: 'Se esperaba parametro'});
			}
		};
	};

	module.exports.registroPersonaWS = function (codplaza, models, Q, cfg) {
		var deferRegistro = Q.defer();
		var Persona = models.persona();
		Persona.count({'codplaza': codplaza}, function (err, count) {
			if (count === 0) {
				exports.infoByPlaza(codplaza, Q, cfg).then(function (result) {
					if ((result !== null) && (typeof result.return !== 'undefined') && (result.return.length > 0) && (result.return[2].key === 'ERR_MSG')) {
						var msg = result.return[2].value;
						var valores = /(\d{2})\.-(.*)/g.exec(msg);
						if (valores !== null) {
							if (valores[1] !== '00') {
								deferRegistro.reject(valores);
								return;
							} else {
								var nuevaPersona = new Persona();
								nuevaPersona.codplaza = codplaza;
								nuevaPersona.login = result.return[0].value;
								nuevaPersona.nombre = result.return[1].value;
								nuevaPersona.apellidos = result.return[6].value + ' ' + result.return[5].value;
								nuevaPersona.telefono = result.return[7].value;
								nuevaPersona.habilitado = false;
								nuevaPersona.save(function (erro) {
									if (erro) {
										deferRegistro.reject(erro);
									} else {
										var output = [{'login': nuevaPersona.login, 'codplaza': nuevaPersona.codplaza, 'nombre': nuevaPersona.nombre, 'apellidos': nuevaPersona.apellidos}];
										deferRegistro.resolve(output);
									}
								});
							}
						} else {
							deferRegistro.reject(err);
						}
					} else {
						deferRegistro.reject('Error inespecificado del servicio web.');
					}
				});
			} else {
				deferRegistro.reject('Ya existe una persona registrada con ese codplaza.');
			}
		});
		return deferRegistro.promise;
	};


	function callWs(cfg, method, args, cb){
		var url = cfg.ws_url;
		soap.createClient(url, {}, function (err, client) {
			if (err) {
				cb(err);
			} else {
				client.setSecurity(new soap.WSSecurity(cfg.ws_user, cfg.ws_pwd, 'PasswordText'));
				client[method](args, function (erro, result) {
					if (erro) {
						cb(erro);
					} else {
						cb(null, result);
					}
				});
			}
		});
	}

	module.exports.infoByPlaza2 = function (cfg) {
		return function (req, res) {
			var args = { arg0: {key: 'P_PLAZA', value: req.params.codplaza }};
			callWs(cfg, 'SacaOcupante', args, function(err, result){
				if (err){
					res.status(500).json({error: 'Error buscando plaza en WS', details: err});
				} else {
					res.json(result);
				}
			});
		};
	};

	module.exports.infoByLogin2 = function (cfg) {
		return function (req, res) {
			var args = {arg0: {key: 'p_login', value: req.params.login}};
			callWs(cfg, 'SacaPlaza', args, function(err, result){
				if (err){
					res.status(500).json({error: 'Error buscando login en WS', details: err});
				} else {
					res.json(result);
				}
			});
		};
	};

	module.exports.infoByLogin = function (login, Q, cfg) {
		var def = Q.defer();
		var args = {arg0: {key: 'p_login', value: login}};
		callWs(cfg, 'SacaPlaza', args, function(err, result){
			if (err){
				def.reject(err);
			} else {
				def.resolve(result);
			}
		});
		return def.promise;
	};

	module.exports.infoByPlaza = function (codplaza, Q, cfg) {
		var def = Q.defer();
		var args = { arg0: {key: 'P_PLAZA', value: codplaza }};
		callWs(cfg, 'SacaOcupante', args, function(err, result){
			if (err){
				def.reject(err);
			} else {
				def.resolve(result);
			}
		});
		return def.promise;
	};

	module.exports.updateCodPlazaByLogin = function (models, Q, cfg) {
		return function (req, res) {
			var Persona = models.persona();
			var filas = [];
			var promesasActualizacion = [];
			var restriccion = {habilitado: true};
			if (typeof req.params.login !== 'undefined'){
				restriccion.login = req.params.login;
			}
			Persona.find(restriccion).sort({ultimoupdate: 1}).limit(1).exec(function (err, personas) {
				if (err) {
					res.status(500).json({error: err});
					return;
				} else {
					personas.forEach(function (persona) {
						var promesaUpdate = Q.defer();
						promesasActualizacion.push(promesaUpdate.promise);
						//console.log('exports.infoByLogin:'+persona.login);
						exports.infoByLogin(persona.login, Q, cfg).then(function (result) {
							var codplaza;
							if ((result !== null) && (typeof result.return !== 'undefined') && (result.return.length > 0)) {
								var msg = result.return[2].value;
								var valores = /(\d{2})\.-(.*)/g.exec(msg);
								if (valores !== null) {
									if (valores[1] === '00') {
										codplaza = result.return[1].value;
										if (codplaza !== persona.codplaza) {
											var fila = {'login': persona.login, 'codplaza prev': persona.codplaza, 'codplaza desp': codplaza};
											filas.push(fila);
											persona.codplaza = codplaza;
										} else {
											console.log('No se modifica el código de plaza del usuario: ', persona.login);
										}
										var telefono = result.return[7].value;
										persona.telefono = telefono;
									} else if (valores[1] === '01') {
										codplaza = persona.codplaza;
										var regCodPlaza = new RegExp(/X{3}\d{3}/i);
										if (!regCodPlaza.test(persona.codplaza)) {
											console.log('Usuario ' + persona.login + ' ya no está en gesper y eliminamos su código plaza ' + persona.codplaza);
											persona.codplaza = '';
										} else {
											console.log('Usuario con código de plaza especial. No actualizado.');
										}
									}
								}
							}
							persona.ultimoupdate = new Date();
							persona.save(function (err) {
								if (err) {
									promesaUpdate.reject('NO se ha podido actualizar el usuario ' + persona.login + '. Error: ' + err);
								} else {
									console.log('Se ha actualizado el usuario ' + persona.login + ': ' + persona.codplaza);
									if (persona.codplaza !== codplaza) {
										Persona.count({'codplaza': codplaza}, function (err, count) {
											if (err) {
												promesaUpdate.reject(err);
											} else {
												if (count > 0) {
													promesaUpdate.resolve(fila);
												} else {
													exports.registroPersonaWS(codplaza, models, Q, cfg).then(function (resultado) {
														fila.nuevoUsuario = resultado.login;
														promesaUpdate.resolve(fila);
													}, function (error) {
														promesaUpdate.reject(error);
													});
												}
											}
										});
									} else {
										promesaUpdate.resolve(fila);
									}
								}
							});
						}, function (erro) {
							promesaUpdate.reject(erro);
						});
					});
				}
				Q.all(promesasActualizacion).then(function () {
					res.json(filas);
				}, function (erro) {
					res.status(500).json({error: erro});
				});
			});

		};
	};

	function transformExcel2Persona(objeto, models, Q) {
		var Persona = models.persona();
		var persona = {
			'codplaza': objeto.puesto.trim(),
			'login': objeto.login.trim(),
			'nombre': objeto.nombre.trim(),
			'apellidos': objeto.apellido1 + ' ' + objeto.apellido2,
			'habilitado': false
		};

		var dpersonaresultado = Q.defer();
		var ppersonaresultado = dpersonaresultado.promise;

		var informeresultado = {
			actualizado: true,
			persona: ppersonaresultado
		};

		Persona.find({'login': persona.login}, function (err, personas) {
			if (err) {
				dpersonaresultado.reject(err);
			} else if (personas.length > 0) {
				informeresultado.actualizado = true;
				personas[0].login = persona.login;
				personas[0].codplaza = persona.codplaza;
				personas[0].nombre = persona.nombre;
				personas[0].apellidos = persona.apellidos;
				informeresultado.persona = personas[0];
				dpersonaresultado.resolve(informeresultado);
			} else {
				informeresultado.actualizado = false;
				var p = new Persona(persona);
				informeresultado.persona = p;
				dpersonaresultado.resolve(informeresultado);
			}
		});
		return informeresultado;
	}

	function parseExcelGesper(path, worksheetName, maxrows, models, Q) {
		var workbook = XLSX.readFile(path);
		var worksheet = workbook.Sheets[worksheetName];
		var fields = { lista: [], tipos: {} };
		var objetos = [];
		var procesados = 0, columna = 0, maxcolumna = 0;
		var n = '', idx;

		for (var fila = 1; fila < maxrows; fila++)
		{
			if (fila === 1)
			{
				//cabecera
				for (columna = 0, maxcolumna = 55550; columna < maxcolumna; columna++)
				{
					n = getColumn(columna);
					if (n === 'H'){
						break;
					}
					idx = getColumn(columna) + fila;
					var campo = typeof worksheet[idx] === 'undefined' ? '' : worksheet[idx].v.trim()
							.replace('.', '_').replace('.', '_').replace('.', '_')
							.replace('Ó', 'O').replace('ó', 'o')
							.replace('í', 'i').replace('Í', 'I')
							.replace('á', 'a').replace('á', 'a')
							.replace('á', 'a').replace('é', 'e')
							;

					if (campo === ''){
						break;
					}
					fields.lista.push(campo);
					fields.tipos[campo] = (typeof fields.tipos[campo] !== 'undefined') ? 'array' : 'object';
				}
			} else {

				var objeto = {};

				for (columna = 0, maxcolumna = fields.lista.length; columna < maxcolumna; columna++) {
					n = getColumn(columna);
					if (n === 'H'){
						break;
					}
					idx = getColumn(columna) + fila;
					var valor = typeof worksheet[idx] === 'undefined' ? {t: '', v: ''} : worksheet[idx];

					if (valor.t === 's') {
						valor.v = valor.v.replace("\\r\\n", '');
					}

					var campo = fields.lista[columna];
					var tipo = fields.tipos[campo];

					if (tipo === 'array') {
						valor.v = parseStr2Int(valor.v);
					}

					if (typeof objeto[campo] === 'undefined')
					{
						if (tipo === 'array' || tipo === 'object'){
							objeto[campo] = (tipo === 'array' ? [valor.v] : valor.v);
						}
					} else {
						if (!Array.isArray(objeto[campo])) {
							/* console.error(campo + ' deberia ser un array');*/
							continue;
						}
						objeto[campo].push(valor.v);
					}
				}

				if (objeto.login || objeto.puesto ) {
					procesados++;
					objeto = transformExcel2Persona(objeto, models, Q);
					if (!objeto){
						break;
					}
					objetos.push(objeto);
				}
			}
		}
		/*console.log(fields);*/
		return objetos;
	}

	module.exports.importarGesper = function (models, Q) {
		return function (req, res) {
			var i = 0;
			var path = '/tmp/universo.xlsx';
			var hoja = 'salida1';
			var maxrows = 10000;

			var operacionesGesper = parseExcelGesper(path, hoja, maxrows, models, Q);
			var promesas = [];
			var resultado = [];

			for (i = 0; i < operacionesGesper.length; i++) {
				promesas.push(operacionesGesper[i].persona);
			}

			var errorHandler = function(err){
				if (err){
					console.error('Error importando persona. Actualización fallida. ', err);
				}
			};
			var fnInforme = function (informeresultado) {
				resultado.push({'persona': informeresultado.persona, 'actualizada': informeresultado.actualizada});
				if (informeresultado.actualizada)
				{
					informeresultado.persona.update(errorHandler);
				} else {
					informeresultado.persona.save(errorHandler);
				}
			};
			for (i = 0; i < promesas.length; i++) {
				promesas[i].then(fnInforme, errorHandler);
			}
			Q.all(promesas).then(function () {
				res.json(resultado);
			}, function(err){
				res.status(500).json({error: err});
			});
		};
	};

	module.exports.personassearchlist = function (models, Q){
		return function (req, res){

			var Persona = models.persona(),
				Procedimiento = models.procedimiento();

			var deferPersona = Q.defer(),
				deferProcedimiento = Q.defer();


			/// 1. Buscamos personas en la tabla personas.
			Persona.find({}, {codplaza: true, login: true, nombre: true, apellidos: true}, function (err, data) {
				if (err) {
					deferPersona.reject(err);
				} else {
					deferPersona.resolve(data);
				}
			});

			/// 2. Buscamos personas como responsables de procedimientos ... ¡¡¡Y que no estén en el primer grupo¡¡¡
			Procedimiento.aggregate()
				.unwind('responsables')
				.group(
					{'_id': {
						'login': '$responsables.login',
						'codplaza': '$responsables.codplaza'
					},
					'nombre': {'$first': '$responsables.nombre'},
					'apellidos': {'$first': '$responsables.apellidos'}
				})
				.exec(function (err, data) {
					if (err) {
						deferProcedimiento.reject(err);
					} else {
						deferProcedimiento.resolve(data);
					}
				});

			Q.all([deferPersona.promise, deferProcedimiento.promise]).then(function (data) {
				var r = {};
				var response = [];
				var personasByPersona = data[0];
				var personasByResponsable = data[1];
				var idr = '';
				var persona;

				for (var i = 0; i < personasByPersona.length; i++) {
					persona = personasByPersona[i];
					idr = persona.login + '-' + persona.codplaza;
					r[idr] = persona;
					response.push({data: persona.login + ' ; ' + persona.codplaza + ' ; ' + persona.nombre + ' ' + persona.apellidos});
				}
				for (var i = 0; i < personasByResponsable.length; i++) {
					persona = personasByResponsable[i];
					idr = persona._id.login + '-' + persona._id.codplaza;
					if (typeof r[idr] === 'undefined') {
						console.log('Saltandose ' + idr);
						r[idr] = persona;
						response.push({data: persona._id.login + ' ; ' + persona._id.codplaza + ' ; ' + persona.nombre + ' ' + persona.apellidos});
					}
				}

				res.json(response);
			}, function(err){
				res.status(500).json({error: err});
			});
		};
	};

})(module, process);
