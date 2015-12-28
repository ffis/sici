(function(module){
'use strict';


function getPermisosByLoginPlaza(params, models, Q, login, codPlaza)
{
		var Permiso = models.permiso();
		var restriccion = {};

		if (!login && params.login && params.login !== '-'){
			login = params.login;
		}

		if (!codPlaza && params.cod_plaza && params.cod_plaza !== '-'){
			codPlaza = params.cod_plaza;
		}

		if (login && codPlaza){
			restriccion = { '$or': [
					{ 'login': login },
					{ 'codplaza': codPlaza }
				] };
		}
		else if (login){
			restriccion.login = login;
		}
		else if (codPlaza){
			restriccion.codplaza = codPlaza;
		}

		console.log(restriccion);

		var df = Q.defer();

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
			res.status(500).end();
			return;
		}

		var Permiso = models.permiso();
		var EntidadObjeto = models.entidadobjeto();		
		EntidadObjeto.findOne({'codigo': eo}, function(err, entidadobjeto){
			if (err){
				console.error('Imposible salvar nuevo permiso', err);
				res.status(500).end();
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
					console.error('Imposible salvar nuevo permiso (5)', err); res.status(500).end(); return;
				}
				var caducidad = new Date();
				caducidad.setFullYear(caducidad.getFullYear() + 2); ////////// PARCHE POR LAS CADUCIDADES A NULL
				for(var i = 0; i < procs.length; i++){
					var ptemp = procs[i];
					if (ptemp.caducidad && ptemp.caducidad.getTime() > caducidad.getTime()){
						caducidad = ptemp.caducidad;
					}
				}
				ep.caducidad = caducidad;

				var op = new Permiso(ep);
				console.log(op);
				op.save(function(erro){
					if (err) {
						console.error('Imposible salvar nuevo permiso (3)'); console.error(erro); res.status(500).end(); return;
					} else {
						res.json(op);
					}
				});
			});
			/*});*/
		});
	};	
};

module.exports.delegarpermisosProcedimiento = function(models){
	return function(req, res){
		var proc = req.params.procedimiento;
		if (!((req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser) 
                       && req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura).indexOf(proc)) ){
			res.status(500).end();
			return;
		}

		var Permiso = models.permiso();
		var Procedimiento = models.procedimiento();		
		Procedimiento.findOne({'codigo': proc}, function(err, procedimiento){
			if (err){
				console.error('Imposible salvar nuevo permiso', err);
				res.status(500).end();
				return;
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
				if (err) {
					console.error('Imposible salvar nuevo permiso (5)', err); res.status(500).end(); return;
				}
				var caducidad = new Date();
				caducidad.setFullYear(caducidad.getFullYear() + 2); ////////// PARCHE POR LAS CADUCIDADES A NULL
				for(var i = 0; i < procs.length; i++){
					var ptemp = procs[i];
					if (ptemp.caducidad && ptemp.caducidad.getTime() > caducidad.getTime()){
						caducidad = ptemp.caducidad;
					}
				}
				ep.caducidad = caducidad;

				var op = new Permiso(ep);
				console.log(op);
				op.save(function(erro){
					if (err) {
						console.error('Imposible salvar nuevo permiso (3)'); console.error(erro); res.status(500).end(); return;
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
			res.status(500).end();
			return;
		}
		var promesaPermisos = getPermisosByLoginPlaza(req.params, models, Q, req.user.login, req.user.codplaza);

		var fsave = function(op, defer) {
			return function(err, p)
			{
				if (err) {
					console.error('Imposible salvar nuevo permiso'); console.error(err); console.error(p); res.status(500).end();
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

				for(var i = 0; i < permisos.length; i++)
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
					minidefer.promise.then(function(p){
						p.save(function(error, pe){
							if (error) {
								console.error('Imposible salvar nuevo permiso', error);
								res.status(500).end();
								defer.reject(pe);
							}else{
								defer.resolve(pe);
							}
						});
					}, function(err) {
						defer.reject(err);
					});
				}


				Q.all(promesasPermisos).then(function(pms){
					res.json(pms);
				}, function(err){
					console.error('Problemas modificando permisos...');
					console.error(err); res.status(500).end();
				});
			},
			function(err){
				console.error(err); res.status(500).end(); return;
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
			function(err){
				console.error(err); res.status(500).end(); return;
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
					console.log(permiso);
					if (err) {
						console.error('Eliminando permiso sobre entidadobjeto'); console.error(err); res.status(500).end(); return;
					}
					if (permiso == null){
						console.error('Eliminando permiso sobre entidadobjeto'); console.error('No se encuentra el permiso ' + idpermiso); res.status(500).end(); return;
					}

					var index_r = permiso.entidadobjetolectura.indexOf(identidadobjeto);
					var index_w = permiso.entidadobjetodirectaescritura.indexOf(identidadobjeto);
					/*
					var index_rc = permiso.procedimientoslectura.indexOf(idprocedimiento);
					var index_wc = permiso.jerarquiadirectaescritura.indexOf(idprocedimiento);
					*/

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
							Permiso.remove({'_id': idpermiso}, function(err){
								if (err) {
									console.error('Eliminando permiso sobre entidadobjeto'); console.error(err); res.status(500).end(); return;
								} else {
									res.json({});
								}
							});
						} else {
							Permiso.update({'_id': idpermiso}, permiso, {upsert: false}, function(err) {
								if (err) {
									console.error('Eliminando permiso sobre entidadobjeto'); console.error(err); res.status(500).end(); return;
								} else {
									res.json(permiso);
								}
							});
						}
					}, function(err){
						console.error(err); res.status(500).end(); return;
					});
				});
			}else{
				res.status(500).send('No tiene permiso para realizar esta operación').end();
				return;
			}
		} else {
			console.error('Invocación inválida para la eliminación de un permiso'); res.status(400).end(); return;
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
					console.log(permiso);
					if (err) {
						console.error('Eliminando permiso sobre procedimiento'); console.error(err); res.status(500).end(); return;
					}
					if (permiso == null){
						console.error('Eliminando permiso sobre procedimiento'); console.error('No se encuentra el permiso ' + idpermiso); res.status(500).end(); return;
					}

					var index_r = permiso.procedimientoslectura.indexOf(idprocedimiento);
					var index_w = permiso.procedimientosdirectaescritura.indexOf(idprocedimiento);
					/*
					var index_rc = permiso.procedimientoslectura.indexOf(idprocedimiento);
					var index_wc = permiso.jerarquiadirectaescritura.indexOf(idprocedimiento);
					*/

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
									console.error('Eliminando permiso sobre procedimiento'); console.error(err); res.status(500).end(); return;
								} else {
									res.json({});
								}
							});
						} else {
							Permiso.update({'_id': idpermiso}, permiso, {upsert: false}, function(err) {
								if (err) {
									console.error('Eliminando permiso sobre procedimiento'); console.error(err); res.status(500).end(); return;
								} else {
									res.json(permiso);
								}
							});
						}
					}, function(err){
						console.error(err); res.status(500).end(); return;
					});
				});
			}else{
				res.status(500).send('No tiene permiso para realizar esta operación').end();
				return;
			}
		} else {
			console.error('Invocación inválida para la eliminación de un permiso'); res.status(400).end(); return;
		}
	};
};

module.exports.removePermisoJerarquia = function(models, Q, recalculate) {
	return function(req, res) {
		console.log('Eliminando jerarquia de permiso. Idjerarquia y permiso:');
		console.log(req.params.idjerarquia);
		console.log(req.params.idpermiso);
		if (typeof req.params.idjerarquia !== 'undefined' &&
			!isNaN(parseInt(req.params.idjerarquia)) &&
			typeof req.params.idpermiso !== 'undefined' )
		{
			var Permiso = models.permiso();
			var idpermiso = req.params.idpermiso;
			var idjerarquia = parseInt(req.params.idjerarquia);

			if (!
				(req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser)
				&& req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura).indexOf(idjerarquia) !== -1
				)
			{
				console.error('El usuario ha intentado realizar una operación sobre permisos que no le está permitida');
				res.status(500).end();
				return;
			}

			Permiso.findById(idpermiso, function(err, permiso){
				if (err) {
					console.error(err);
					res.status(500).end();
					return;
				}
				if (permiso === null) {
					console.error('Eliminando permiso sobre jerarquia'); console.error('No se encuentra el permiso ', idpermiso); res.status(500).end(); return;
				}
				console.log(permiso._id + ' findById ');

				var index_r = permiso.jerarquiadirectalectura.indexOf(idjerarquia);
				var index_w = permiso.jerarquiadirectaescritura.indexOf(idjerarquia);
				var index_rc = permiso.jerarquialectura.indexOf(idjerarquia);
				var index_wc = permiso.jerarquiaescritura.indexOf(idjerarquia);

				if (index_r !== -1){
					permiso.jerarquiadirectalectura.splice(index_r, 1);
				}
				if (index_w !== -1){
					permiso.jerarquiadirectaescritura.splice(index_w, 1);
				}

				recalculate.softCalculatePermiso(Q, models, permiso).then(function(permiso){
					console.log(permiso._id + ' tras soft ');

					if (permiso.jerarquiadirectalectura.length === 0 &&
							(typeof permiso.procedimientosdirectalectura === 'undefined'
							||
							permiso.procedimientosdirectalectura.length === 0
					))
					{
						console.log(permiso._id + ' eliminando ');
						Permiso.remove({'_id': idpermiso}, function(err){
							if (err) {
								console.error('Eliminando permiso sobre jerarquia'); console.error(err); res.status(500).end(); return;
							} else {
								res.json({});
							}
						});
					} else {
						console.log(permiso._id + ' actualizando');
						permiso.save(function(e) {
							console.log(permiso._id + ' actualizado ' + e);
							if (e){
								console.error('Eliminando permiso sobre jerarquia'); console.error(e); res.status(500).end(); return;
							} else {
								res.json(permiso);
							}
						});
					}
				}, function(err){
					console.error(err);
					res.status(500).end();
					return;
				});
			});
		} else {
			console.error('Invocación inválida para la eliminación de un permiso');
			res.status(500).end();
			return;
		}
	};
};




//// Devuelve las instancias de permiso que tienen concedido permiso directo sobre el id de jerarquía
//// indicado o sobre alguno de sus descendientes (si el parámetro de petición "recursivo" es 1)  ,
//// así como los permisos directos sobre los procedimientos que cuelgan de tales jerarquías
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
			}
			else if (!heredado) {
				// obtenemos todos los permisos otorgados sobre esta jerarquía y sus descendientes.
				var idj = parseInt(req.params.idjerarquia);
				var Jerarquia = models.jerarquia();
				var d = Q.defer();
				var promise = d.promise;
				// buscamos la jerarquia indicada
				Jerarquia.findOne({ 'id': idj }, function(err, data){
					if (err){
						d.reject(err);
					} else{
						d.resolve(data);
					}
				});

				promise.then(function(jerarquia){
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
						}else{
							dprocedimiento.resolve(procedimientos);
						}
					});

					promise_procedimiento.then(function(procedimientos){
						var idsprocedimientos = [];
						procedimientos.forEach(function(value){
							idsprocedimientos.push(value.codigo);
						});
						console.log(idsprocedimientos.length);

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
				var idj = parseInt(req.params.idjerarquia);
				var restriccion = {'jerarquialectura': idj};

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
			console.error(restriccion); console.error(err); res.status(500).end(); return;
		});
	};
};

//// Devuelve las instancias de permiso que tienen concedido permiso directo sobre el id de jerarquía indicado
/* todo revisar el porqué no se usa */
module.exports.permisosDirectosList = function(models){

	return function(req, res){
		var Permiso = models.permiso();

		if (typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))) {
				var idj = parseInt(req.params.idjerarquia);

				if (!
					(req.user.permisoscalculados.grantoption ||
					req.user.permisoscalculados.superuser)
					&&
					req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura).indexOf(idj) !== -1
					)
				{
					console.error('El usuario ha intentado realizar una operacion (permisosDirectosList) que no le está permitida');
					res.status(500).send('No tiene permiso para operar sobre permisos');
					res.end();
					return;
				}

				var restriccion = {'jerarquiadirectalectura': idj};
				Permiso.find(restriccion, function(err, permisos){
					if (err) {
						console.error(restriccion); console.error(err); res.status(500).end(); return;
					}
					else{
						res.json(permisos);
					}
				});
		} else {
			var err = 'Error. Id de jerarquía no presente o inválido';
			console.error(restriccion); console.error(err); res.status(500).end(); return;
		}
	};
};

//// Devuelve las instancias de permiso que tienen concedido permiso directo sobre la entidadobjeto indicada
module.exports.permisosDirectosEntidadObjetoList = function(models){
	return function(req, res){
		var Permiso = models.permiso();

		if (typeof req.params.codigoentidadobjeto !== 'undefined') {
				var idp = req.params.codigoentidadobjeto;

				if (!
					(req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser) &&
					req.user.permisoscalculados.entidadobjetolectura.concat(req.user.permisoscalculados.entidadobjetoescritura).indexOf(idp) !== -1
					)
				{
					console.error('El usuario ha intentado realizar una operacion (permisosDirectosEntidadObjetoList) que no le está permitida');
					res.status(500).send('No tiene permiso para operar sobre permisos');
					res.end();
					return;
				}

				var restriccion = {'entidadobjetodirectalectura': idp};
				Permiso.find(restriccion, function(err, permisos){
					if (err){
						console.error(restriccion); console.error(err); res.status(500); res.end(); return;
					}else{
						res.json(permisos);
					}
				});
		} else {
			var err = 'Error. Código de entidadobjeto no presente o inválido';
			console.error(restriccion);
			console.error(err);
			res.status(500).end(err);
			return;
		}
	};
	
};
//// Devuelve las instancias de permiso que tienen concedido permiso directo sobre el procedimiento indicado
module.exports.permisosDirectosProcedimientoList = function(models){
	return function(req, res){
		var Permiso = models.permiso();

		if (typeof req.params.codigoprocedimiento !== 'undefined') {
				var idp = req.params.codigoprocedimiento;

				if (!
					(req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser) &&
					req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura).indexOf(idp) !== -1
					)
				{
					console.error('El usuario ha intentado realizar una operacion (permisosDirectosProcedimientoList) que no le está permitida');
					res.status(500).send('No tiene permiso para operar sobre permisos');
					res.end();
					return;
				}

				var restriccion = {'procedimientosdirectalectura': idp};
				Permiso.find(restriccion, function(err, permisos){
					if (err){
						console.error(restriccion); console.error(err); res.status(500); res.end(); return;
					}else{
						res.json(permisos);
					}
				});
		} else {
			var err = 'Error. Código de procedimiento no presente o inválido';
			console.error(restriccion);
			console.error(err);
			res.status(500).end(err);
			return;
		}
	};
};


//// Devuelve las instancias de permiso que tienen concedido permiso sobre la entidadobjeto indicada
module.exports.permisosEntidadObjetoList = function(models){
	return function(req, res){
		var Permiso = models.permiso();

		console.log('Buscando entidadobjeto ' + req.params.codigoentidadobjeto);
		if (typeof req.params.codigoentidadobjeto !== 'undefined') {
				var idp = req.params.codigoentidadobjeto;
				if (!
					(req.user.permisoscalculados.grantoption ||
					req.user.permisoscalculados.superuser)
					&&
					req.user.permisoscalculados.entidadobjetolectura.concat(req.user.permisoscalculados.entidadobjetoescritura).indexOf(idp) !== -1
					)
				{
					console.error('El usuario ha intentado realizar una operacion (permisosDirectosEntidadObjetoList) que no le está permitida');
					res.status(500).send('No tiene permiso para operar sobre permisos').end();
					return;
				}

				var restriccion = {'entidadobjetolectura': idp};
				Permiso.find(restriccion, function(erro, permisos){
					if (erro) {
						console.error(restriccion); console.error(erro); res.status(500).end(); return;
					} else {
						res.json(permisos);
					}
				});
		} else {
			var err = 'Error. Código de entidadobjeto no presente o inválido';
			console.error(restriccion); console.error(err); res.status(500); res.end(); return;
		}
	};	
}
//// Devuelve las instancias de permiso que tienen concedido permiso sobre el procedimiento indicado
module.exports.permisosProcedimientoList = function(models){
	return function(req, res){
		var Permiso = models.permiso();

		console.log('Buscando procedimiento ' + req.params.codigoprocedimiento);
		if (typeof req.params.codigoprocedimiento !== 'undefined') {
				var idp = req.params.codigoprocedimiento;
				if (!
					(req.user.permisoscalculados.grantoption ||
					req.user.permisoscalculados.superuser)
					&&
					req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura).indexOf(idp) !== -1
					)
				{
					console.error('El usuario ha intentado realizar una operacion (permisosDirectosProcedimientoList) que no le está permitida');
					res.status(500).send('No tiene permiso para operar sobre permisos').end();
					return;
				}

				var restriccion = {'procedimientoslectura': idp};
				Permiso.find(restriccion, function(erro, permisos){
					if (erro) {
						console.error(restriccion); console.error(erro); res.status(500).end(); return;
					} else {
						res.json(permisos);
					}
				});
		} else {
			var err = 'Error. Código de procedimiento no presente o inválido';
			console.error(restriccion); console.error(err); res.status(500); res.end(); return;
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
			Permiso.findById(idp , function(err, permiso){
				if (err) {
					console.error(err); res.status(500).end(); return;
				}
				//permiso = JSON.parse(JSON.stringify(permiso));
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
						if (err) {
							console.error(erro); res.status(500).end(); return;
						}else{
							res.json(actualizado);
						}
					});
				});

			});
		}
	};
};

module.exports.create = function(models, Q, recalculate){
	return function(req, res){
	var Permiso = models.permiso();
	var Persona = models.persona();
	var argPermiso = req.body;
	console.log(argPermiso);
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

	var dpersona = Q.defer();
	var ppersona = dpersona.promise;

	console.log('Buscando persona');
	if (permiso.codplaza) {
		Persona.findOne({'codplaza': permiso.codplaza}, function(err, usuario){
			if (err){
				dpersona.reject(err);
			} else {
				dpersona.resolve(usuario);
			}
		});
	} else {
		Persona.findOne({'login': permiso.login}, function(err, usuario){
			if (err){
				dpersona.reject(err);
			} else {
				dpersona.resolve(usuario);
			}
		});
	}

	ppersona.then(function(persona){
		console.log('Encontrada');
		if (!persona.habilitado){
			persona.habilitado = true;
			Persona.update({_id: persona._id}, persona, {'upsert': false, 'multi': false}, function(err){
				if (err){
					console.error(err);
				}else{
					console.log('Actualizada la persona (habilitado true)');
				}
			});
		}

		console.log('Prerecalculo ');console.log(permiso);
		recalculate.softCalculatePermiso(Q, models, permiso).then(
			function(permiso){
				var opermiso = new Permiso(permiso);
				console.log('Ok (in)'); console.log(opermiso);
				//opermiso = new Permiso(permiso);

				opermiso.save(function(err){
					if (err) {
						console.error(err); res.status(500).end(); return;
					} else {
						console.log('Escribiendo salida'); res.json(permiso);
					}
				});
			},
			function(err){
				console.error(err); res.status(500); res.end(); return;
			}
		);

	}, function(err){
		console.error(err); res.status(500); res.end(); return;
	});
	};
};

module.exports.get = function(models){
	return function(req, res) {
		var id = req.params.id;
		var Permiso = models.permiso();
		Permiso.findById(id, function(err, permiso){
			if (err) {console.error('Eliminando permiso sobre procedimiento'); console.error(err); res.status(500).end(); return; }
			else {
				if (Array.isArray(permiso)){
					res.json(permiso[0]);
				} else {
					res.json(permiso);
				}
			}
		});
	};
};


module.exports.removePermiso = function(models, Q, recalculate, ObjectId)
{
	return function(req, res)
	{
		var Permiso = models.permiso();
		console.log('Eliminando....');
		var id = new ObjectId(req.params.id);
		Permiso.remove({'_id': id}, function(err){
			if (err) {
				console.error('Eliminando permiso sobre permiso...'); console.error(err); res.status(500).end(); return;
			} else {
				console.log('Eliminado permiso ' + id); res.end();
			}
		});
	};
};



/*
exports.create = function(models) {
	return function(req,res) {
		var Permiso = models.permiso();
		var Persona = models.persona();
		var tipoobjpermiso = req.body.tiposeleccion;

		var dpersona = Q.defer();
		var ppersona = dpersona.promise;

		Persona.findOne({'login': req.user.login},function(err,usuario){
				if (err) dpersona.reject(err);
				else dpersona.resolve(usuario);
		});

		Permiso.save(permiso,function(err,nuevopermiso){
				res.json(nuevopermiso);
				if (req.body.nombre && req.body.apellidos) {
					var persona = {
						'nombre': req.body.nombre,
						'apellidos': req.body.apellidos,
						'genero': req.body.genero,
						'telefono': req.body.telefono,
						'habilitado': 1
					};
					Persona.create(persona, function(err,nuevapersona){
						console.log("Creada nueva persona");
						console.log(nuevapersona);
					});
				}
			});

		ppersona.then(function(usuarioactual){
			var permiso = {
				jerarquialectura : [],
				jerarquiaescritura : [],
				jerarquiadirectalectura : [],
				jerarquiadirectaescritura : [],
				procedimientoslectura : [],
				procedimientosescritura : [],
				procedimientosdirectalectura : [],
				procedimientosdirectaescritura : [],
				caducidad : usuarioactual.caducidad,
				descripcion : '',
				grantoption  : req.body.grantoption,
				superuser : 0
			};

			var err="";
			if (tiposeleccion == 'jerarquia') {
				if (!isNaN(parseInt(req.body.nodojerarquia))) {
					var id = parseInt(req.body.nodojerarquia);
					permiso.jerarquiadirectalectura.push(id);
					if (req.body.w_option)
						permiso.jerarquiadirectaescritura.push(id);
				} else {
					err = "Error. Indentificador de jerarquía incorrecto";
				}
			} else if ( tiposeleccion == "procedimiento") {
				if (req.body.procedimiento && req.body.procedimiento!="") {
					permiso.procedimientosdirectalectura.push(req.body.procedimiento);
					if (req.body.w_option)
						permiso.procedimientosdirectaescritura.push(req.body.procedimiento);
				}else {
					err = "Error. Identificador de procedimiento incorrecto";
				}
			}

			if (err!="") {
				console.error(err); res.status(500); res.end(); return;
			}

			Permiso.create(permiso,function(err,nuevopermiso){
				res.json(nuevopermiso);
				if (req.body.nombre && req.body.apellidos) {
					var persona = {
						'nombre': req.body.nombre,
						'apellidos': req.body.apellidos,
						'genero': req.body.genero,
						'telefono': req.body.telefono,
						'habilitado': 1
					};
					Persona.create(persona, function(err,nuevapersona){
						console.log("Creada nueva persona");
						console.log(nuevapersona);
					});
				}
			});


		}, function(err){
			console.error(err); res.status(500); res.end(); return;
		});
	}
}*/

})(module);
