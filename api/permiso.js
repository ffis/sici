(function(module){
	'use strict';

	function getPermisosByLoginPlaza(params, models, Q, login, codPlaza){
		var Permiso = models.permiso(),
			restriccion = {},
			df = Q.defer();

		if (!login && params.login && params.login !== '-'){
			login = params.login;
		}

		if (!codPlaza && params.cod_plaza && params.cod_plaza !== '-'){
			codPlaza = params.cod_plaza;
		}

		if (login && codPlaza){
			restriccion =
				{ '$or': [
						{ 'login': login },
						{ 'codplaza': codPlaza }
				]
			};
		} else if (login){
			restriccion.login = login;
		} else if (codPlaza){
			restriccion.codplaza = codPlaza;
		}

		if (login !== '-' || codPlaza !== '-'){
			Permiso.find(restriccion, function(err, permisos){
				if (err){
					df.reject(err);
				} else {
					df.resolve(permisos);
				}
			});
		} else {
			df.resolve([]);
		}

		return df.promise;
	}

	module.exports.delegarpermisosEntidadObjeto = function(models){
		return function(req, res){
			var eo = req.params.entidadobjeto;
			if (!((req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser)
						&& req.user.permisoscalculados.entidadobjetolectura.concat(req.user.permisoscalculados.entidadobjetoescritura).indexOf(eo)) ){
				res.status(403).json({'error': 'Not allowed'});
				return;
			}

			var Permiso = models.permiso();
			var EntidadObjeto = models.entidadobjeto();
			EntidadObjeto.findOne({'codigo': eo}, function(err, entidadobjeto){
				if (err){
					res.status(500).json({'error': 'Imposible salvar nuevo permiso', details: err});
					return;
				}
				var idjerarquia = entidadobjeto.idjerarquia;
				var ep = {};
				if (req.params.cod_plaza && req.params.cod_plaza !== '-' && req.params.cod_plaza !== ''){
					ep.codplaza = req.params.cod_plaza;
				}
				if (req.params.login && req.params.login !== '-' && req.params.login !== ''){
					ep.login = req.params.login;
				}
				ep.jerarquialectura = [idjerarquia];
				ep.jerarquiaescritura = [];
				ep.jerarquiadirectalectura = [idjerarquia];
				ep.jerarquiadirectaescritura = [];
				ep.procedimientosescritura = [];
				ep.procedimientoslectura = [];
				ep.procedimientosdirectalectura = [];
				ep.procedimientosdirectaescritura = [];
				ep.entidadobjetolectura = [entidadobjeto.codigo];
				ep.entidadobjetoescritura = [entidadobjeto.codigo];
				ep.entidadobjetodirectalectura = [entidadobjeto.codigo];
				ep.entidadobjetodirectaescritura = [entidadobjeto.codigo];
				ep.superuser = 0;
				ep.cod_plaza_grantt = req.user.login;
				ep.descripcion = 'Permisos delegados por ' + ep.cod_plaza_grantt;
				ep.grantoption = false;

				Permiso.find({'$or': [{'entidadobjetoescritura': entidadobjeto.codigo}, {'entidadobjetodirectaescritura': entidadobjeto.codigo}]}, function(err, procs){
					if (err) {
						res.status(500).json({'error': 'Imposible salvar nuevo permiso (5)', details: err});
					}
					var caducidad = new Date();
					caducidad.setFullYear(caducidad.getFullYear() + 2); ////////// PARCHE POR LAS CADUCIDADES A NULL
					for (var i = 0; i < procs.length; i++){
						var ptemp = procs[i];
						if (ptemp.caducidad && ptemp.caducidad.getTime() > caducidad.getTime()){
							caducidad = ptemp.caducidad;
						}
					}
					ep.caducidad = caducidad;

					var op = new Permiso(ep);
					op.save(function(erro){
						if (err) {
							res.status(500).json({'error': 'Imposible salvar nuevo permiso (3)', details: erro});
							return;
						} else {
							res.json(op);
						}
					});
				});
			});
		};
	};

	module.exports.delegarpermisosProcedimiento = function(models){
		return function(req, res){
			var proc = req.params.procedimiento;
			if (!((req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser)
						&& req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura).indexOf(proc)) ){
				res.status(403).json({'error': 'Not allowed'});
				return;
			}

			var Permiso = models.permiso();
			var Procedimiento = models.procedimiento();
			Procedimiento.findOne({'codigo': proc}, function(err, procedimiento){
				if (err){
					res.status(500).json({'error':'Imposible salvar nuevo permiso (1)', details: err});
					return;
				}else if (!procedimiento){
					res.status(404).json({'error':'Imposible salvar nuevo permiso (2)', details: 'Not found'});
				}
				var idjerarquia = procedimiento.idjerarquia;
				var ep = {};
				if (req.params.cod_plaza && req.params.cod_plaza !== '-' && req.params.cod_plaza !== ''){
					ep.codplaza = req.params.cod_plaza;
				}
				if (req.params.login && req.params.login !== '-' && req.params.login !== ''){
					ep.login = req.params.login;
				}
				ep.jerarquialectura = [idjerarquia];
				ep.jerarquiaescritura = [];
				ep.jerarquiadirectalectura = [idjerarquia];
				ep.jerarquiadirectaescritura = [];
				ep.procedimientosescritura = [procedimiento.codigo];
				ep.procedimientoslectura = [procedimiento.codigo];
				ep.procedimientosdirectalectura = [procedimiento.codigo];
				ep.procedimientosdirectaescritura = [procedimiento.codigo];
				ep.entidadobjetolectura = [];
				ep.entidadobjetoescritura = [];
				ep.entidadobjetodirectalectura = [];
				ep.entidadobjetodirectaescritura = [];
				ep.superuser = 0;
				ep.cod_plaza_grantt = req.user.login;
				ep.descripcion = 'Permisos delegados por ' + ep.cod_plaza_grantt;
				ep.grantoption = false;

				Permiso.find({'$or': [{'procedimientosescritura': procedimiento.codigo}, {'procedimientosdirectaescritura': procedimiento.codigo}]}, function(err, procs){
					if (err){
						res.status(500).json({'error':'Imposible salvar nuevo permiso (5)', details: err});
						return;
					}
					var caducidad = new Date();
					caducidad.setFullYear(caducidad.getFullYear() + 2); ////////// PARCHE POR LAS CADUCIDADES A NULL
					for (var i = 0; i < procs.length; i++){
						var ptemp = procs[i];
						if (ptemp.caducidad && ptemp.caducidad.getTime() > caducidad.getTime()){
							caducidad = ptemp.caducidad;
						}
					}
					ep.caducidad = caducidad;

					var op = new Permiso(ep);
					//console.log(op);
					op.save(function(erro){
						if (err){
							res.status(500).json({'error':'Imposible salvar nuevo permiso (3)', details: erro});
						} else {
							res.json(op);
						}
					});
				});
			});
		};
	};

	module.exports.delegarpermisos = function(models, Q, recalculate)
	{
		return function(req, res) {
			var Permiso = models.permiso();
			if (!(req.user.permisoscalculados.grantoption ||
				req.user.permisoscalculados.superuser))
			{
				res.status(403).json({'error': 'Not allowed'});
				return;
			}
			var promesaPermisos = getPermisosByLoginPlaza(req.params, models, Q, req.user.login, req.user.codplaza);

			var fsave = function(op, defer) {
				return function(err, p)
				{
					if (err) {
						defer.reject(err);
					} else {
						recalculate.softCalculatePermiso(Q, models, p).then(function(pe){
							defer.resolve(pe);
						}, function(erro){
							defer.reject(erro);
						});
					}
				};
			};

			promesaPermisos.then(
				function(permisos){
					var paux = [];
					var promesasPermisos = [];
					var rejectDefer = function(defer){
						return function(err) {
							defer.reject(err);
						};
					};
					var resolveDeferIfNoErr = function(defer){
						return function(error, pe){
							if (error) {
								defer.reject(pe);
							} else {
								defer.resolve(pe);
							}
						};
					};
					var saveP = function(defer){
						return function(p){
							p.save( resolveDeferIfNoErr(defer) );
						};
					};
					for (var i = 0; i < permisos.length; i++)
					{
						var p = JSON.parse(JSON.stringify(permisos[i]));

						if (paux.indexOf(p._id) !== -1){ continue; }
						else { paux.push(p._id); }

						var defer = Q.defer();

						promesasPermisos.push(defer.promise);

						delete p._id;

						if (req.params.login && req.params.login !== '-'){
							p.login = req.params.login;
						}
						if (req.params.cod_plaza && req.params.cod_plaza !== '-'){
							p.codplaza = req.params.cod_plaza;
						}
						p.cod_plaza_grantt = (permisos[i].codplaza ? permisos[i].codplaza : permisos[i].login);
						p.grantoption = false;
						var minidefer = Q.defer();

						var op = new Permiso(p);
						op.save(fsave(op, minidefer));
						minidefer.promise.then(saveP(defer), rejectDefer(defer));
					}

					Q.all(promesasPermisos).then(function(pms){
						res.json(pms);
					}, function(err){
						res.status(500).json({'error': 'Problemas modificando permisos...', details: err});
					});
				},
				function(err){
					res.status(500).json({'error': 'Error during delegarpermisos', details: err});
				}
			);
		};
	};

	module.exports.permisosByLoginPlaza = function(models, Q) {
		return function(req, res) {
			var promesaPermisos = getPermisosByLoginPlaza(req.params, models, Q);
			promesaPermisos.then(
				function(permisos){
					res.json(permisos);
				},
				function(error){
					res.status(500).json({'error': 'Error during permisosByLoginPlaza', details: error});
				}
			);
		};
	};

	module.exports.removePermisoCarta = function(models, Q, recalculate){
		return function(req, res) {
			if (typeof req.params.identidadobjeto !== 'undefined' && !isNaN(parseInt(req.params.identidadobjeto)) &&
				typeof req.params.idpermiso !== 'undefined' )
			{
				var Permiso = models.permiso();
				var idpermiso = req.params.idpermiso;
				var identidadobjeto = req.params.identidadobjeto;

				if (req.user.permisoscalculados.superuser ||
					(req.user.permisoscalculados.grantoption && req.user.permisoscalculados.entidadobjetolectura.concat(req.user.permisoscalculados.entidadobjetoescritura).indexOf(identidadobjeto) !== -1)
					)
				{

					Permiso.findById(idpermiso, function(err, permiso){
						//console.log(permiso);
						if (err) {
							res.status(500).json({'error': 'Error during removePermisoCarta', details: err});
							return;
						}
						if (permiso === null){
							res.status(500).json({'error': 'Error during removePermisoCarta. ', details: 'No se encuentra el permiso'});
							return;
						}

						var index_r = permiso.entidadobjetolectura.indexOf(identidadobjeto);
						var index_w = permiso.entidadobjetodirectaescritura.indexOf(identidadobjeto);

						if (index_r !== -1){
							permiso.entidadobjetolectura.splice(index_r, 1);
						}
						if (index_w !== -1){
							permiso.entidadobjetodirectaescritura.splice(index_w, 1);
						}

						recalculate.softCalculatePermiso(Q, models, permiso).then(function(permiso){
							if (permiso.entidadobjetodirectalectura.length === 0 &&
									(typeof permiso.jerarquiadirectalectura === 'undefined'
									||
									permiso.jerarquiadirectalectura.length === 0
							))
							{
								Permiso.remove({'_id': idpermiso}, function(erro){
									if (erro) {
										res.status(500).json({'error': 'Error during removePermisoCarta', details: erro});
									} else {
										res.json({});
									}
								});
							} else {
								Permiso.update({'_id': idpermiso}, permiso, {upsert: false}, function(erro) {
									if (erro) {
										res.status(500).json({'error': 'Error during removePermisoCarta', details: erro});
									} else {
										res.json(permiso);
									}
								});
							}
						}, function(erro){
							res.status(500).json({'error': 'Error during removePermisoCarta', details: erro});
						});
					});
				} else {
					res.status(403).json({'error': 'Not allowed'});
					return;
				}
			} else {
				res.status(400).json({'error': 'Invocación inválida para la eliminación de un permiso'});
			}
		};
	};

	module.exports.removePermisoProcedimiento = function(models, Q, recalculate) {
		return function(req, res) {
			if (typeof req.params.idprocedimiento !== 'undefined' && !isNaN(parseInt(req.params.idprocedimiento)) &&
				typeof req.params.idpermiso !== 'undefined' )
			{
				var Permiso = models.permiso();
				var idpermiso = req.params.idpermiso;
				var idprocedimiento = req.params.idprocedimiento;

				if (req.user.permisoscalculados.superuser ||
					(req.user.permisoscalculados.grantoption && req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura).indexOf(idprocedimiento) !== -1)
					)
				{
					Permiso.findById(idpermiso, function(err, permiso){
						if (err){
							res.status(500).json({'error': 'Eliminando permiso sobre procedimiento', details: err});
						} else if (permiso === null){
							res.status(500).json({'error': 'Error eliminando permiso sobre procedimiento. ', details: 'No se encuentra el permiso'});
						} else {

							var index_r = permiso.procedimientoslectura.indexOf(idprocedimiento);
							var index_w = permiso.procedimientosdirectaescritura.indexOf(idprocedimiento);

							if (index_r !== -1){
								permiso.procedimientosdirectalectura.splice(index_r, 1);
							}
							if (index_w !== -1){
								permiso.procedimientosdirectaescritura.splice(index_w, 1);
							}

							recalculate.softCalculatePermiso(Q, models, permiso).then(function(permiso){
								if (permiso.procedimientosdirectalectura.length === 0 &&
										(typeof permiso.jerarquiadirectalectura === 'undefined'
										||
										permiso.jerarquiadirectalectura.length === 0
								))
								{
									Permiso.remove({'_id': idpermiso}, function(err){
										if (err) {
											res.status(500).json({'error': 'Error eliminando permiso sobre procedimiento', details: err});
										} else {
											res.json({});
										}
									});
								} else {
									Permiso.update({'_id': idpermiso}, permiso, {upsert: false}, function(err) {
										if (err) {
											res.status(500).json({'error': 'Error eliminando permiso sobre procedimiento', details: err});
										} else {
											res.json(permiso);
										}
									});
								}
							}, function(err){
								res.status(500).json({'error': 'Error eliminando permiso sobre procedimiento', details: err});
							});
						}
					});
				} else {
					res.status(403).json({'error': 'No tiene permiso para realizar esta operación'});
					return;
				}
			} else {
				res.status(400).json({'error': 'Invocación inválida para la eliminación de un permiso'});
			}
		};
	};

	module.exports.removePermisoJerarquia = function(models, Q, recalculate) {
		return function(req, res) {
			if (typeof req.params.idjerarquia !== 'undefined' &&
				!isNaN(parseInt(req.params.idjerarquia)) &&
				typeof req.params.idpermiso !== 'undefined' )
			{
				var Permiso = models.permiso();
				var idpermiso = req.params.idpermiso;
				var idjerarquia = parseInt(req.params.idjerarquia);

				if (!(req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser)
					&& req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura).indexOf(idjerarquia) !== -1
					)
				{
					res.status(403).json({'error': 'El usuario ha intentado realizar una operación sobre permisos que no le está permitida'});
					return;
				}

				Permiso.findById(idpermiso, function(err, permiso){
					if (err) {
						res.status(500).json({'error': 'Error eliminando permiso sobre jerarquia', details: err});
						return;
					}
					if (permiso === null) {
						res.status(404).json({'error': 'Eliminando permiso sobre jerarquia. No se encuentra el permiso ' + idpermiso});
						return;
					}

					var index_r = permiso.jerarquiadirectalectura.indexOf(idjerarquia);
					var index_w = permiso.jerarquiadirectaescritura.indexOf(idjerarquia);

					if (index_r !== -1){
						permiso.jerarquiadirectalectura.splice(index_r, 1);
					}
					if (index_w !== -1){
						permiso.jerarquiadirectaescritura.splice(index_w, 1);
					}

					recalculate.softCalculatePermiso(Q, models, permiso).then(function(permiso){
						if (permiso.jerarquiadirectalectura.length === 0 &&
							(typeof permiso.procedimientosdirectalectura === 'undefined'
							||
							permiso.procedimientosdirectalectura.length === 0
						))
						{
							Permiso.remove({'_id': idpermiso}, function(err){
								if (err) {
									res.status(500).json({'error': 'Error permiso sobre jerarquia (5)', details: err});
								} else {
									res.json({});
								}
							});
						} else {
							permiso.save(function(e) {
								if (e){
									res.status(500).json({'error': 'Error permiso sobre jerarquia (4)', details: e});
								} else {
									res.json(permiso);
								}
							});
						}
					}, function(err){
						res.status(500).json({'error': 'Error permiso sobre jerarquia (3)', details: err});
						return;
					});
				});
			} else {
				res.status(404).json({'error': 'Invocación inválida para la eliminación de un permiso'});
				return;
			}
		};
	};


	/**
	* Devuelve las instancias de permiso que tienen concedido permiso directo sobre el id de jerarquía
	* indicado o sobre alguno de sus descendientes (si el parámetro de petición "recursivo" es 1),
	* así como los permisos directos sobre los procedimientos que cuelgan de tales jerarquías
	*/
	module.exports.permisosList = function(models, Q){
		return function(req, res){
			var Permiso = models.permiso();
			var dpermisos = Q.defer();
			var promise_permisos = dpermisos.promise;
			var recursivo = (typeof req.params.recursivo !== 'undefined' && parseInt(req.params.recursivo) === 1 ? true : false);
			var heredado = (typeof req.params.recursivo !== 'undefined' && parseInt(req.params.recursivo) === 2 ? true : false);

			if (typeof req.params.idjerarquia !== 'undefined') {
				if (isNaN(parseInt(req.params.idjerarquia)) ||
					(req.user.permisoscalculados.jerarquialectura.indexOf(parseInt(req.params.idjerarquia)) === -1 &&
					req.user.permisoscalculados.jerarquiaescritura.indexOf(parseInt(req.params.idjerarquia)) === -1)
					){
					dpermisos.reject('Error. Id jerarquía no válido');
				} else if (!heredado) {
					// obtenemos todos los permisos otorgados sobre esta jerarquía y sus descendientes.
					var idj = parseInt(req.params.idjerarquia);
					var Jerarquia = models.jerarquia();
					var d = Q.defer();
					// buscamos la jerarquia indicada
					Jerarquia.findOne({ 'id': idj }, function(err, data){
						if (err){
							d.reject(err);
						} else {
							d.resolve(data);
						}
					});

					d.promise.then(function(jerarquia){
						// configuramos una búsqueda de la jerarquía actual más los descendientes

						var jerarquias_buscadas = recursivo ? jerarquia.descendientes : [];

						if (!Array.isArray(jerarquias_buscadas)){
							jerarquias_buscadas = [];
						}
						jerarquias_buscadas.push(idj);

						var Procedimiento = models.procedimiento();
						var dprocedimiento = Q.defer();
						var promise_procedimiento = dprocedimiento.promise;
						var query = Procedimiento.find({'idjerarquia':{'$in': jerarquias_buscadas}});
						query.select({cod_plaza: 1, codigo: 1, responsables: 1, idjerarquia: 1, denominacion: 1});
						query.exec(function(err, procedimientos){
							if (err) {
								dprocedimiento.reject(err);
							} else {
								dprocedimiento.resolve(procedimientos);
							}
						});

						promise_procedimiento.then(function(procedimientos){
							var idsprocedimientos = [];
							procedimientos.forEach(function(value){
								idsprocedimientos.push(value.codigo);
							});
							//console.log(idsprocedimientos.length);

							var restriccion = {
								'$or': [
									{'jerarquiadirectalectura':{'$in': jerarquias_buscadas}},
									{'procedimientosdirectalectura':{'$in': idsprocedimientos}}
								]
							};

							var respuesta = {
								'procedimientos': procedimientos
							};

							//console.log(JSON.stringify(restriccion));
							Permiso.find(restriccion).sort({'codplaza': 1, 'login': 1}).exec(function(err, permisos){
								if (err) { dpermisos.reject(err); }
								else {
									//for(var i=0;i<permisos.length;i++) console.log(permisos[i].login+" "+permisos[i].codplaza);
									respuesta.permisos = permisos;
									respuesta.totallength = procedimientos.length + permisos.length;
									dpermisos.resolve(respuesta);
								}
							});
						}, function(err){
							dpermisos.reject(err);
						});

					}, function(error){
						dpermisos.reject(error);
					});
				} else if (heredado) {
					var restriccion = {'jerarquialectura': parseInt(req.params.idjerarquia) };

					Permiso.find(restriccion, function(err, permisos){
						if (err){
							dpermisos.reject(err);
						} else {
							dpermisos.resolve({ procedimientos: [], permisos: permisos, totallength: permisos.length });
						}
					});
				}
			} else {
				Permiso.find({}, function(err, permisos){
					dpermisos.resolve(permisos);
				});
			}
			promise_permisos.then(function(permisos){ // permisos ok
				res.json(permisos);
			}, function(err){ // error recuperando permisos
				res.status(500).json({'error': 'Error recuperando permisos', details: err, restriccion: restriccion});
			});
		};
	};

	//// Devuelve las instancias de permiso que tienen concedido permiso directo sobre el id de jerarquía indicado
	/* TODO revisar el porqué no se usa */
	module.exports.permisosDirectosList = function(models){
		return function(req, res){
			var Permiso = models.permiso();
			if (typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))) {
				var idj = parseInt(req.params.idjerarquia);

				if (!(req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser)
					&&
					req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura).indexOf(idj) !== -1
					)
				{
					res.status(403).json({'error': 'El usuario ha intentado realizar una operación sobre permisos que no le está permitida'});
					return;
				}

				var restriccion = {'jerarquiadirectalectura': idj};
				Permiso.find(restriccion, function(err, permisos){
					if (err) {
						res.status(500).json({'error': 'Error during permisosDirectosList', details: err, restriccion: restriccion});
					} else {
						res.json(permisos);
					}
				});
			} else {
				res.status(500).json({'error':  'Error. Id de jerarquía no presente o inválido'});
			}
		};
	};

	/** Devuelve las instancias de permiso que tienen concedido permiso directo sobre la entidadobjeto indicada */
	module.exports.permisosDirectosEntidadObjetoList = function(models){
		return function(req, res){
			if (typeof req.params.codigoentidadobjeto !== 'undefined') {
				var idp = req.params.codigoentidadobjeto;
				if (!(req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser) &&
					req.user.permisoscalculados.entidadobjetolectura.concat(req.user.permisoscalculados.entidadobjetoescritura).indexOf(idp) !== -1
					)
				{
					res.status(403).json({'error': 'El usuario ha intentado realizar una operación sobre permisos que no le está permitida'});
					return;
				}
				var Permiso = models.permiso();
				Permiso.find({'entidadobjetodirectalectura': idp}, function(err, permisos){
					if (err){
						res.status(500).json({'error': 'Error recuperando permisos directos EntidadObjeto', details: err});
					} else {
						res.json(permisos);
					}
				});
			} else {
				res.status(404).json({'error': 'Error. Código de entidadobjeto no presente o inválido'});
			}
		};
	};

	/** Devuelve las instancias de permiso que tienen concedido permiso directo sobre el procedimiento indicado */
	module.exports.permisosDirectosProcedimientoList = function(models){
		return function(req, res){
			var Permiso = models.permiso();

			if (typeof req.params.codigoprocedimiento !== 'undefined') {
				var idp = req.params.codigoprocedimiento;

				if (!(req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser) &&
					req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura).indexOf(idp) !== -1
					)
				{
					res.status(403).json({'error': 'El usuario ha intentado realizar una operación sobre permisos que no le está permitida'});
				} else {
					Permiso.find({'procedimientosdirectalectura': idp}, function(err, permisos){
						if (err){
							res.status(500).json({'error': 'Error recuperando permisos directos lectura procedimientosdirectalectura', details: err});
						} else {
							res.json(permisos);
						}
					});
				}
			} else {
				res.status(404).json({'error': 'Error. Código de procedimiento no presente o inválido'});
			}
		};
	};


	/** Devuelve las instancias de permiso que tienen concedido permiso sobre la entidadobjeto indicada */
	module.exports.permisosEntidadObjetoList = function(models){
		return function(req, res){
			var Permiso = models.permiso();
			if (typeof req.params.codigoentidadobjeto !== 'undefined') {
				var idp = req.params.codigoentidadobjeto;
				if (!(req.user.permisoscalculados.grantoption ||
					req.user.permisoscalculados.superuser)
					&&
					req.user.permisoscalculados.entidadobjetolectura.concat(req.user.permisoscalculados.entidadobjetoescritura).indexOf(idp) !== -1
					)
				{
					res.status(403).json({'error': 'El usuario ha intentado realizar una operación sobre permisos que no le está permitida'});
				} else {
					var restriccion = {'entidadobjetolectura': idp};
					Permiso.find(restriccion, function(err, permisos){
						if (err) {
							res.status(500).json({'error': 'Error recuperando permisos de lectura permisosEntidadObjetoList', details: err});
						} else {
							res.json(permisos);
						}
					});
				}
			} else {
				res.status(404).json({'error': 'Error. Código de entidadobjeto no presente o inválido'});
			}
		};
	};
	//// Devuelve las instancias de permiso que tienen concedido permiso sobre el procedimiento indicado
	module.exports.permisosProcedimientoList = function(models){
		return function(req, res){
			var Permiso = models.permiso();

			if (typeof req.params.codigoprocedimiento !== 'undefined') {
				var idp = req.params.codigoprocedimiento;
				if (!(req.user.permisoscalculados.grantoption ||
					req.user.permisoscalculados.superuser)
					&&
					req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura).indexOf(idp) !== -1
					)
				{
					res.status(403).json({'error': 'El usuario ha intentado realizar una operación sobre permisos que no le está permitida'});
				} else {
					Permiso.find({'procedimientoslectura': idp}, function(err, permisos){
						if (err) {
							res.status(500).json({'error': 'Error recuperando permisos de lectura procedimientoslectura', details: err});
						} else {
							res.json(permisos);
						}
					});
				}
			} else {
				res.status(404).json({'error': 'Error. Código de procedimiento no presente o inválido'});
			}
		};
	};


	module.exports.update = function(models, recalculate, Q) {
		return function(req, res) {
			var Permiso = models.permiso();
			var idp = req.params.id;
			if (typeof req.params.id !== 'undefined')
			{
				var newpermiso = req.body;
				Permiso.findById(idp, function(err, permiso){
					if (err) {
						res.status(404).json({'error': 'Error actualizando permisos', details: err});
						return;
					}else if (!permiso){
						res.status(404).json({'error': 'Error. Código de permiso no presente o inválido'});
					} else {
						permiso.codplaza = newpermiso.codplaza;
						permiso.descripcion = newpermiso.descripcion;
						permiso.jerarquiaescritura = newpermiso.jerarquiaescritura;
						permiso.jerarquialectura = newpermiso.jerarquialectura;
						permiso.jerarquiadirectaescritura = newpermiso.jerarquiadirectaescritura;
						permiso.jerarquiadirectalectura = newpermiso.jerarquiadirectalectura;
						permiso.procedimientoslectura = newpermiso.procedimientoslectura;
						permiso.procedimientosescritura = newpermiso.procedimientosescritura;
						permiso.procedimientosdirectalectura = newpermiso.procedimientosdirectalectura;
						permiso.procedimientosdirectaescritura = newpermiso.procedimientosdirectaescritura;
						permiso.login = newpermiso.login;
						permiso.caducidad = newpermiso.caducidad;
						permiso.grantoption = newpermiso.grantoption;
						permiso.superuser = newpermiso.superuser;

						recalculate.softCalculatePermiso(Q, models, permiso).then(function (p) {
							p.save(function(erro, actualizado){
								if (erro) {
									res.status(500).json({'error': 'Error actualizando permisos', details: erro});
								} else {
									res.json(actualizado);
								}
							});
						}, function(err){
							res.status(500).json({'error': 'Error actualizando/recalculando permisos', details: err});
						});
					}
				});
			} else {
				res.status(404).json({'error': 'Error. Código de permiso no presente o inválido'});
			}
		};
	};

	module.exports.create = function(models, Q, recalculate){
		return function(req, res){
			var Permiso = models.permiso();
			var Persona = models.persona();
			var argPermiso = req.body;
			var permiso = {
				login: argPermiso.login,
				codplaza: argPermiso.codplaza,
				jerarquialectura: (typeof argPermiso.jerarquialectura !== 'undefined' ? argPermiso.jerarquialectura : []),
				jerarquiaescritura: (typeof argPermiso.jerarquiaescritura !== 'undefined' ? argPermiso.jerarquiaescritura : []),
				jerarquiadirectalectura: (typeof argPermiso.jerarquiadirectalectura !== 'undefined' ? argPermiso.jerarquiadirectalectura : []),
				jerarquiadirectaescritura: (typeof argPermiso.jerarquiadirectaescritura !== 'undefined' ? argPermiso.jerarquiadirectaescritura : []),
				procedimientoslectura: (typeof argPermiso.procedimientoslectura !== 'undefined' ? argPermiso.procedimientoslectura : []),
				procedimientosescritura: (typeof argPermiso.procedimientosescritura !== 'undefined' ? argPermiso.procedimientosescritura : []),
				procedimientosdirectalectura: (typeof argPermiso.procedimientosdirectalectura !== 'undefined' ? argPermiso.procedimientosdirectalectura : []),
				procedimientosdirectaescritura: (typeof argPermiso.procedimientosdirectaescritura !== 'undefined' ? argPermiso.procedimientosdirectaescritura : []),
				entidadobjetolectura: (typeof argPermiso.entidadobjetolectura !== 'undefined' ? argPermiso.entidadobjetolectura : []),
				entidadobjetoescritura: (typeof argPermiso.entidadobjetoescritura !== 'undefined' ? argPermiso.entidadobjetoescritura : []),
				entidadobjetodirectalectura: (typeof argPermiso.entidadobjetodirectalectura !== 'undefined' ? argPermiso.entidadobjetodirectalectura : []),
				entidadobjetodirectaescritura: (typeof argPermiso.entidadobjetodirectaescritura !== 'undefined' ? argPermiso.entidadobjetodirectaescritura : []),
				caducidad: req.user.permisoscalculados.caducidad,
				descripcion: 'Permisos concedidos por ' + req.user.login,
				grantoption: !!argPermiso.grantoption,
				superuser: argPermiso.superuser ? 1 : 0,
				cod_plaza_grantt: req.user.login
			};

			var restriccion = {};
			if (permiso.codplaza) {
				restriccion.codplaza = permiso.codplaza;
			} else {
				restriccion.login = permiso.login;
			}

			Persona.findOne(restriccion).then(function(persona){
				if (!persona){
					res.status(404).json({'error': 'Error persona no existente.'});
					return;
				}
				var fn = function(){
					recalculate.softCalculatePermiso(Q, models, permiso).then(
						function(permiso){
							var opermiso = new Permiso(permiso);
							opermiso.save(function(err){
								if (err) {
									res.status(500).json({'error': 'Error create permiso', details: err});
								} else {
									res.json(permiso);
								}
							});
						},
						function(err){
							res.status(500).json({'error': 'Error create permiso', details: err});
						}
					);
				};
				if (!persona.habilitado){
					persona.habilitado = true;
					Persona.update({_id: persona._id}, persona, {'upsert': false, 'multi': false}, function(err){
						if (err){
							res.status(500).json({'error': 'Error habilitando persona', details: err});
						} else {
							fn();
						}
					});
				} else {
					fn();
				}
			}, function(err){
				res.status(500).json({'error': 'Error create permiso', details: err});
			});
		};
	};

	module.exports.get = function(models){
		return function(req, res) {
			var id = req.params.id;
			var Permiso = models.permiso();
			Permiso.findById(id, function(err, permiso){
				if (err) {
					res.status(500).json({'error': 'Error eliminando permiso sobre procedimiento', details: err});
				} else {
					if (Array.isArray(permiso)){
						res.json(permiso[0]);
					} else {
						res.json(permiso);
					}
				}
			});
		};
	};

	module.exports.removePermiso = function(models, Q, recalculate, ObjectId) {
		return function(req, res) {
			var Permiso = models.permiso();
			var id = new ObjectId(req.params.id);
			Permiso.remove({'_id': id}, function(err){
				if (err) {
					res.status(500).json({'error': 'Error eliminando permiso', details: err});
				} else {
					res.end();
				}
			});
		};
	};
})(module);
