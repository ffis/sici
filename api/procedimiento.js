

exports.hasChildred = function (models) {
    return function (req, res) {
        var Procedimiento = models.procedimiento();
        var codigo = req.params.codigo;
		if (req.user.permisoscalculados &&
			(req.user.permisoscalculados.procedimientoslectura.indexOf(codigo)!==-1 || 			
			req.user.permisoscalculados.superuser)) {
			Procedimiento.count({"padre": codigo}, function (err, count) {
				if (err) {
					console.error(restriccion);
					console.error(err);
					res.status(500);
					res.end();
					return;
				}
				console.log('hasChildren :' + count);
				res.json({'count': count});
			});
		} else {
			console.error('No tiene permiso para consultar el número de hijos de este procedimiento');
			res.status(500);
			res.end();
			return;
		}
    };
};

exports.setPeriodosCerrados = function (models) {
    return function (req, res) {
        //espera recibir en el body el array de periodos cerrados
        if (req.user.permisoscalculados && req.user.permisoscalculados.superuser) {

            var anualidad = req.params.anualidad ? req.params.anualidad : new Date().getFullYear();

            var periodoscerrados = req.body,
                    field = 'periodos.a' + anualidad + '.periodoscerrados',
                    conditions = {},
                    update = {$set: {}},
            options = {multi: true},
            Procedimiento = models.procedimiento();

            update.$set[field ] = periodoscerrados;

            var callback = function (err, doc) {
                if (err) {
                    console.error(restriccion);
                    console.error(err);
                    res.status(500);
                    res.end();
                    return;
                }
                res.json(periodoscerrados);
            };
            res.json(periodoscerrados);
            //Procedimiento.update(conditions, update, options, callback);
        }
    };

}

exports.createProcedimiento = function (Q, models, recalculate) {
    return function (req, res) {
		if (!(req.user.permisoscalculados && req.user.permisoscalculados.superuser)) 
		{
			res.status(500).send('Error. Solo el administrador puede crear procedimientos');
            res.end();
            return;
		}
	
        if (req.body.idjerarquia && !isNaN(parseInt(req.body.idjerarquia)) &&
                req.body.denominacion &&
                req.body.codigo && req.body.cod_plaza && parseInt(req.body.idjerarquia) > 0)
        {
            var Procedimiento = models.procedimiento();
            var Jerarquia = models.jerarquia();
            var procedimiento = new Procedimiento();
            var idjerarquia = parseInt(req.body.idjerarquia);

            procedimiento.idjerarquia = idjerarquia;
            procedimiento.denominacion = req.body.denominacion;
            procedimiento.codigo = req.body.codigo;
            if (req.body.cod_plaza)
                procedimiento.cod_plaza = req.body.cod_plaza;
            if (req.body.padre)
                procedimiento.padre = "" + req.body.padre;

            //check jerarquia $exists
            Jerarquia.find({id: idjerarquia}, function (err, jerarquias) {
                if (jerarquias.length > 0)
                {
                    //check codigo $exists:0
                    Procedimiento.find({codigo: procedimiento.codigo}, function (err, procs) {
                        if (procs.length > 0) {
                            res.status(500).send('Error 55 guardando');
                            res.end();
                            return;
                        } else {
						
							var PlantillaAnualidad = models.plantillaanualidad();
							var Periodo = models.periodo();							
							var defer_periodos = Q.defer();
							var defer_plantilla = Q.defer();
							
							Periodo.findOne({},function(err,periodos){
								if (err) {
									console.error(err);
									res.status(500);
									res.end();
									defer_periodos.reject(err);
									return;
								} 			
								defer_periodos.resolve(periodos);
							});	
							
							PlantillaAnualidad.findOne({}, function(err, plantilla){
								if (err) {
									console.error(err);
									res.status(500);
									res.end();
									defer_plantilla.reject(err);
									return;
								} 
								defer_plantilla.resolve(plantilla);
							});
							
							
							Q.all([defer_periodos.promise, defer_plantilla.promise]).then(function(data){
								var periodos = JSON.parse(JSON.stringify(data[0]));
								var plantilla = JSON.parse(JSON.stringify(data[1]));
								delete plantilla._id;
								
								procedimiento.periodos = {};
								for (var anualidad in periodos) {
									if (isNaN(parseInt(anualidad.replace("a","")))) continue;	
									procedimiento.periodos[anualidad]=plantilla;
									procedimiento.periodos[anualidad].periodoscerrados=periodos[anualidad];
								}
								procedimiento.periodos['a2013'] = {
									"plazo_maximo_resolver" : 180,
									"plazo_maximo_responder" : null,
									"plazo_CS_ANS_naturales" : null,
									"pendientes_iniciales" : 0,
									"total_resueltos" : [ 
										0, 
										0, 
										0, 
										0, 
										0, 
										0, 
										0, 
										0, 
										0, 
										0, 
										0, 
										0
									],
									"periodoscerrados" : [ 
										0, 
										0, 
										0, 
										0, 
										0, 
										0, 
										0, 
										0, 
										0, 
										0, 
										0, 
										0
									]
								};
								
								procedimiento.save(function (err) {
									if (err) {
										console.error(err);
										res.status(500).send('Error 57 guardando');
										res.end();
										return;
									} else {										
										recalculate.softCalculateProcedimiento(Q, models, procedimiento).then(function (procedimiento) {
											recalculate.softCalculateProcedimientoCache(Q, models, procedimiento).then(function (procedimiento) {
												procedimiento.save(function (err) {
													if (err) {
														console.error(err);
														res.status(500).send('Error 133 guardando');
														res.end();
														return;
													} else {
														res.json(procedimiento);
													}
												});
											});
										});
									}
								});								
							}, function(err){
								console.error(err);
								res.status(500).send('Error 147 guardando');
								res.end();
								return;							
							});		
                        }
                    });
                } else {
                    res.status(500).send('Error 154 guardando');
                    res.end();
                    return;
                }
            });
        } else {
            console.error(JSON.stringify(req.body));
            res.status(500).send('Error 71 guardando');
            res.end();
            return;
        }
    };
};

exports.procedimiento = function (models) {
    return function (req, res) {
        var Procedimiento = models.procedimiento();
        var restriccion = {};
        if (typeof req.params.codigo !== 'undefined')
            //restriccion.codigo = parseInt(req.params.codigo);
            restriccion.codigo = req.params.codigo;
        restriccion.idjerarquia = {'$in': req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)};

        Procedimiento.findOne(restriccion, function (err, data) {
            if (err) {
                console.error(restriccion);
                console.error(err);
                res.status(500);
                res.end();
                return;
            }
            res.json(data);
        });

    };
};

exports.deleteProcedimiento = function (Q, models, recalculate) {
    return function (req, res) {
        var Procedimiento = models.procedimiento();
        var restriccion = {};
        if (typeof req.params.codigo !== 'undefined')
            //restriccion.codigo = parseInt(req.params.codigo);
            restriccion.codigo = req.params.codigo;
        //comprobar si tiene permiso el usuario actual
        restriccion.idjerarquia = {'$in': req.user.permisoscalculados.jerarquiaescritura};

        Procedimiento.findOne(restriccion, function (err, original) {
            if (err) {
                console.error(restriccion);
                console.error(err);
                res.status(500);
                res.end();
                return;
            }
//            var procedimiento = req.body;
            var puedeEscribirSiempre = req.user.permisoscalculados.superuser;
            if (puedeEscribirSiempre) {
                original.eliminado = true;
            }
            Procedimiento.count({"padre": original.codigo}, function (err, count) {
                if (err) {
                    res.status(500).end();
                    return;
                } else if (count > 0) {
                    res.status(500).end('No puede eliminar un procedimiento con hijos');
                    return;
                } else {
                    recalculate.softCalculateProcedimiento(Q, models, original).then(function (original) {
                        recalculate.softCalculateProcedimientoCache(Q, models, original).then(function (original) {
                            exports.saveVersion(models, Q, original).then(function () {
                                original.fecha_version = new Date();
                                Procedimiento.update({codigo: original.codigo}, JSON.parse(JSON.stringify(original)), {multi: false, upsert: false}, function (err, coincidencias, elemento) {
                                    if (err) {
                                        console.error(err);
                                        res.status(500).send(JSON.stringify(err));
                                        res.end();
                                        return;
                                    }
                                    else {
                                        recalculate.fullSyncjerarquia(Q, models).then(function (o) {
                                            res.json(original);
                                        }, function (err) {
                                            console.error(err);
                                            res.send(500, JSON.stringify(err));
                                        });
                                    }
                                });
                            });
                        });
                    });
                }
            });
        });
    };
};


exports.updateProcedimiento = function (Q, models, recalculate, persona) {
    return function (req, res) {
        var Procedimiento = models.procedimiento();
        var Permiso = models.permiso();
		var Periodos = models.periodo();
        var restriccion = {};
        if (typeof req.params.codigo !== 'undefined')
            //restriccion.codigo = parseInt(req.params.codigo);
            restriccion.codigo = req.params.codigo;
        //comprobar si tiene permiso el usuario actual

		if (!req.user.permisoscalculados.procedimientosdirectaescritura)
			req.user.permisoscalculados.procedimientosdirectaescritura = [];
			
        var arrays = [
            'jerarquiaescritura',
            'jerarquialectura',
            'jerarquiadirectalectura',
            'jerarquiadirectaescritura',
            'procedimientosdirectalectura',
            'procedimientosdirectaescritura',
            'procedimientoslectura',
            'procedimientosdirectalectura'
        ];

        for (var i = 0; i < arrays.length; i++)
            if (!Array.isArray(req.user.permisoscalculados[arrays[i]]))
                req.user.permisoscalculados[arrays[i]] = [];

        restriccion['$or'] = [
            {
                'idjerarquia': {'$in': req.user.permisoscalculados.jerarquiaescritura.concat(req.user.permisoscalculados.jerarquiadirectaescritura)}
            },
            {
                'codigo': {'$in': req.user.permisoscalculados.procedimientosdirectaescritura.concat(req.user.permisoscalculados.procedimientosescritura)}
            }
        ];


		var defer_periodos = Q.defer();
		Periodos.findOne({},function(err,periodos){
            if (err) {
                console.error(err);
                res.status(500);
                res.end();
				defer_periodos.reject(err);
                return;
            } 						
			defer_periodos.resolve(periodos);
		});
		

        Procedimiento.findOne(restriccion, function (err, original) {
            if (err) {
                console.error(restriccion);
                console.error(err);
                res.status(500);
                res.end();
                return;
            }
			
            if (typeof original === 'undefined' || original == null) {
                res.status(500);
                res.end('ERROR. imposible actualizar procedimiento ');
                console.error('ERROR. imposible actualizar procedimiento ');
                console.error(req.params.filepath);

                console.error(restriccion);
                return;
            }

			original.markModified('periodos');
			
            var procedimiento = req.body;
            //TODO: comprobar qué puede cambiar y qué no

            //suponemos que es un usuario normal, con permisos de escritura, en ese caso sólo podra modificar
            //los atributos que estan dentro de periodo, que no son array, y aquellos que siendo array no
            //son periodos cerrados ni corresponden a un periodo cerrado

            var puedeEscribirSiempre = req.user.permisoscalculados.superuser;
            var hayCambiarOcultoHijos = false;
            if (puedeEscribirSiempre) {
                if (original.idjerarquia != procedimiento.idjerarquia) {
                    original.idjerarquia = procedimiento.idjerarquia;
                }
                original.padre = procedimiento.padre;
                // Actualiza estado oculto o eliminado
                if (original.oculto !== procedimiento.oculto) {
                    hayCambiarOcultoHijos = true;
                }
                original.oculto = procedimiento.oculto;
            }


            //TODO: IMPEDIR EDICION DE ANUALIDADES MUY PRETÉRITAS		
            var schema = models.getSchema('plantillaanualidad');
            var codplaza_changed = false;
			defer_periodos.promise.then(function(periodos){
				periodos = JSON.parse(JSON.stringify(periodos));								
				for (var anualidad in periodos) {
					if (isNaN(parseInt(anualidad.replace("a",""))) || parseInt(anualidad.replace("a",""))==2013) continue;					

					var periodoscerrados = original.periodos[anualidad].periodoscerrados;

					if (puedeEscribirSiempre) {
						/*
						 for(var attr in schema){
						 if (attr == 'codigo') continue;
						 if (attr == 'periodos') continue;
						 if (attr == 'idjerarquia') continue;
						 if (attr == 'cod_plaza') continue;
						 if (attr == 'fecha_creacion') continue;
						 if (attr == 'fecha_fin') continue;
						 if (attr == 'fecha_version') continue;
						 if (attr == 'etiquetas') continue;
						 if (attr == 'padre') continue;
						 }*/
						if (original.cod_plaza != procedimiento.cod_plaza) {
							original.cod_plaza = procedimiento.cod_plaza;
							codplaza_changed = true;
						}
						original.denominacion = procedimiento.denominacion;
					}


					for (var attr in schema) {
						if (attr == 'periodoscerrados')
							continue;
						if (typeof original.periodos[anualidad][attr] === 'object' && Array.isArray(original.periodos[anualidad][attr]))
						{
							for (var mes = 0, meses = periodoscerrados.length; mes < meses; mes++)
							{
								var val = periodoscerrados[mes];
								if (!val || puedeEscribirSiempre) {//el periodo no está cerrado y se puede realizar la asignacion									
									original.periodos[anualidad][attr][mes] =
											procedimiento.periodos[anualidad][attr][mes] != null ?
											parseInt(procedimiento.periodos[anualidad][attr][mes]) : null;
								}
							}
						} else {
							
							original.periodos[anualidad][attr] =
									procedimiento.periodos[anualidad][attr] != null ?
									parseInt(procedimiento.periodos[anualidad][attr]) : null;
						}
					}
				}
								
				original.periodos.a2013 = {
					"plazo_maximo_resolver" : procedimiento.periodos.a2013.plazo_maximo_resolver,
					"plazo_maximo_responder" : procedimiento.periodos.a2013.plazo_maximo_responder,
					"plazo_CS_ANS_naturales" : procedimiento.periodos.a2013.plazo_CS_ANS_naturales,
					"pendientes_iniciales" : procedimiento.periodos.a2013.pendientes_iniciales,
					"periodoscerrados" : procedimiento.periodos.a2013.periodoscerrados
				};				

				if (! (Array.isArray(original.periodos.a2013.total_resueltos) && original.periodos.a2013.total_resueltos.length>0))
					original.periodos.a2013.total_resueltos = [0,0,0,0,0,0,0,0,0,0,0,0];
				
				for(var mes = 0, meses = original.periodos.a2013.periodoscerrados.length; mes<meses; mes++) {
					original.periodos.a2013.total_resueltos[mes] = parseInt(procedimiento.periodos.a2013.total_resueltos[mes]);
				}
				
				recalculate.softCalculateProcedimiento(Q, models, original).then(function (original) {
					recalculate.softCalculateProcedimientoCache(Q, models, original).then(function (original) {				
						exports.saveVersion(models, Q, original).then(function () {
							original.fecha_version = new Date();	
							Procedimiento.update({codigo: original.codigo}, JSON.parse(JSON.stringify(original)), {multi: false, upsert: false}, function (err, coincidencias, elemento) {							
								if (err) {
									console.error(err);
									res.status(500).send(JSON.stringify(err));
									res.end();
									return;
								}
								else {		
									
									var promesa_proc = Q.defer();
									var promesa_per = Q.defer();

									if (codplaza_changed) {
										Permiso.findOne(
												{codplaza: original.cod_plaza},
										function (err, permiso) {
											if (err) {
												console.error(err);
												promesa_per.reject(err);
											}
											else if (permiso == null) {
												// si no existe permiso asociado creamos uno para el camoto este.
												var nuevopermiso = {
													'codplaza': original.cod_plaza,
													'login': null,
													'jerarquialectura': [],
													'jerarquiadirectalectura': [],
													'jerarquiaescritura': [],
													'jerarquiadirectaescritura': [],
													'procedimientoslectura': [],
													'procedimientosdirectalectura': [],
													'procedimientosescritura': [],
													'procedimientosdirectaescritura': [],
													'superuser': 0,
													'grantoption': 0,
													'descripcion': 'Permiso otorgado por ' + req.user.login,
													'caducidad': req.user.permisoscalculados.caducidad,
													'cod_plaza_grantt': req.user.login
												};
												var p = new Permiso(nuevopermiso);
												p.save(function (err) {
													if (err)
														promesa_per.reject(err);
													else
														promesa_proc.resolve();
												});
												persona.registroPersonaWS(original.cod_plaza,models, Q).then(function(data) {
													Persona.update({'codplaza':original.cod_plaza},{$set:{'habilitado':true}},{multi:false, upsert:false}, function(err){
														console.error('Error habilitando personas del codigo de plaza responsable');
													});
													console.log("El pavo no existía, lo ha buscado");
												}, function(err) {
													Persona.update({'codplaza':original.cod_plaza},{$set:{'habilitado':true}},{multi:false, upsert:false}, function(err){
														console.error('Error habilitando personas del codigo de plaza responsable');
													});
													console.log("El pavo existía u ocurrió un error molón");
													console.error(err);
												});
												
											} else
												promesa_per.resolve();
										}
										);

										promesa_per.promise.then(
												function () {
													recalculate.fullSyncpermiso(Q, models).then(function (data) {
														promesa_proc.resolve();
													});
												},
												function (err) {
													promesa_proc.reject(err);
												});
									} else {
										promesa_proc.resolve();
									}

									promesa_proc.promise.then(function () {
										if (hayCambiarOcultoHijos) {
											exports.ocultarHijos(original, models, Q).then(function () {
												recalculate.fullSyncjerarquia(Q, models).then(function () {
													res.json(original);
												}, function (err) {
													console.error(err);
													res.send(500, JSON.stringify(err));
												});
											});
										} else {
											res.json(original);
											console.log(JSON.stringify(elemento));
											console.log(coincidencias);
										}
									}, function (err) {
										console.error(err);
										res.status(500).send(JSON.stringify(err));
										res.end();
										return;
									});
								}
							});
						});
					});
				});
			
			},function(err){				
				console.error(err);
				res.status(500).send(JSON.stringify(err));
				res.end();
				return;
			});
			
        });
    };
};

exports.ocultarHijos = function (procedimiento, models, Q) {
    var defer = Q.defer();
	if (!(req.user.permisoscalculados && req.user.permisoscalculados.superuser))
	{
		return;
	}
	
    var Procedimiento = models.procedimiento();
    var promesas_procs = [];
    Procedimiento.find({padre: procedimiento.codigo}, function (err, procs) {
        procs.forEach(function (proc) {
            exports.saveVersion(models, Q, proc).then(function () {
                var deferProc = Q.defer();
                promesas_procs.push(deferProc.promise);
                procedimiento.fecha_version = new Date();
                Procedimiento.update({codigo: proc.codigo}, {'oculto': procedimiento.oculto}, {multi: false, upsert: false}, function (err, coincidencias, elemento) {
                    if (err) {
                        deferProc.reject(err);
                    } else {
                        exports.ocultarHijos(proc, models, Q).then(function () {
                            deferProc.resolve();
                        });
                    }
                });
            });
        });
        Q.all(promesas_procs).then(function (procs) {
            defer.resolve(procs);
        }, function (err) {
            defer.reject(err);
        });
    });
    return defer.promise;
};


exports.procedimientosByResponsable = function(models,Q)
{
	return function(req, res){
		if (!(req.user.permisoscalculados && req.user.permisoscalculados.superuser)) {
			var msg = 'Error de permisos.';
			console.error(msg);
			res.status(500).send(msg);
			res.end();
			return;
		}
		
		var Procedimiento = models.procedimiento();
		if (typeof req.params.codplaza !== 'undefined' && req.params.codplaza!="") {
			var cod_plaza = req.params.codplaza;
			var restriccion = { $and: [ {'cod_plaza' : cod_plaza},
								{'$or': [
                                        {'oculto': {$exists: false}},
                                        {'$and': [
                                                {'oculto': {$exists: true}},
                                                {'oculto': false}
                                            ]}
                                    ]
                                } ]
			};
			Procedimiento.find(restriccion, function(err,procedimientos){
				if (err) {
					console.error(restriccion);
					console.error(err);
					res.status(500);
					res.end();				
				} else res.json(procedimientos);
			});
		} else {
			console.error(restriccion);
			console.error(err);
			res.status(500);
			res.end();		
		}
	};
};

exports.procedimientoList = function (models, Q) {
    return function (req, res) {
        var Procedimiento = models.procedimiento();
        var restriccion = {};
        var fields = req.query.fields;
        var restriccion =
                (typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))) ?
                (typeof req.params.recursivo === 'undefined' || req.params.recursivo > 0 ?
                        {'$and': [
                                {'ancestros.id': {'$in': [parseInt(req.params.idjerarquia)]}},
                                {'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)}},
                                {'$or': [
                                        {'oculto': {$exists: false}},
                                        {'$and': [
                                                {'oculto': {$exists: true}},
                                                {'oculto': false},
                                            ]}
                                    ]
                                },
                                {'$or': [
                                        {'eliminado': {$exists: false}},
                                        {'$and': [
                                                {'eliminado': {$exists: true}},
                                                {'eliminado': false},
                                            ]}
                                    ]
                                }
                            ]} :
                        {'$and': [
                                {'idjerarquia': parseInt(req.params.idjerarquia)},
                                {'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)}},
                                {'$or': [
                                        {'oculto': {$exists: false}},
                                        {'$and': [
                                                {'oculto': {$exists: true}},
                                                {'oculto': false}
                                            ]}
                                    ]
                                },
                                {'$or': [
                                        {'eliminado': {$exists: false}},
                                        {'$and': [
                                                {'eliminado': {$exists: true}},
                                                {'eliminado': false}
                                            ]}
                                    ]
                                }
                            ]}
                )
                :
                {'$and': [
                        {'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)}},
                        {'$or': [
                                {'oculto': {$exists: false}},
                                {'$and': [
                                        {'oculto': {$exists: true}},
                                        {'oculto': false},
                                    ]}
                            ]
                        },
                        {'$or': [
                                {'eliminado': {$exists: false}},
                                {'$and': [
                                        {'eliminado': {$exists: true}},
                                        {'eliminado': false},
                                    ]}
                            ]
                        }
                    ]};

        var cb = function (err, data) {
            if (err) {
                console.error(restriccion);
                console.error(err);
                res.status(500);
                res.end();
                return;
            }
            res.json(data);
        };

        var query = Procedimiento.find(restriccion);
        if (typeof fields !== 'undefined') {
            query.select(fields);
        }
        query.exec(cb);
    };
}

exports.saveVersion = function (models, Q, procedimiento) {
    var defer = Q.defer();
    var Historico = models.historico();
    var v = JSON.parse(JSON.stringify(procedimiento));
    delete v._id;
    var version = new Historico(v);
    version.save(function (err) {
        if (err)
            defer.reject(err);
        else
            defer.resolve();
    });
    return defer.promise;
};

exports.totalProcedimientos = function (models) {
    return function (req, res) {
        var Procedimiento = models.procedimiento();
        Procedimiento.count({idjerarquia: {$in: req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)}}, function (err, count) {
            if (err) {
                console.error('Invocación inválida en la búsqueda del expediente');
                res.status(500).end();
                return;
            } else {
                console.log(count);
                res.json({count: count});
            }
        });
    };
};

exports.totalTramites = function (settings, models) {
    return function (req, res) {
        var Procedimiento = models.procedimiento();
        Procedimiento.aggregate([
            {$unwind: "$periodos.a2014.solicitados"},
            {$match: {idjerarquia: {$in: req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)}}},
            {'$group': {_id: '',
                    suma: {$sum: '$periodos.a2014.solicitados'},
                }}
        ], function (err, result) {
            if (err) {
                console.error('Invocación inválida en el total de trámites');
                res.status(500).end();
                return;
            } else {
                res.json(result[0]);
            }
        });
    };
};

exports.ratioResueltos = function (models) {
    return function (req, res) {
        var Procedimiento = models.procedimiento();
        Procedimiento.aggregate([
            {'$match': {idjerarquia: {$in: req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)}}},
            {'$unwind': "$periodos.a2014.solicitados"},
            {'$group': {_id: '$_id',
                    suma: {$sum: '$periodos.a2014.solicitados'},
                    resueltos: {$first: '$periodos.a2014.total_resueltos'}}},
            {$unwind: '$resueltos'},
            {'$group': {_id: '$_id',
                    suma: {$first: '$suma'},
                    resueltos: {$sum: '$resueltos'}}},
            {'$group': {_id: '',
                    suma: {$sum: '$suma'},
                    resueltos: {$sum: '$resueltos'}
                }},
            {'$project': {
                    'ratio': {$divide: ['$resueltos', '$suma']}
                }}
        ], function (err, result) {
            if (err) {
                console.error('Invocación inválida en el ratio de expedientes resueltos');
                res.status(500).end();
                return;
            } else {
                console.log(result);
                if (result.length == 0) {
                    res.json({'ratio': 0});
                } else {
                    result[0].ratio = result[0].ratio.toFixed(2);
                    res.json(result[0]);
                }
            }
        });
    };
};

exports.procedimientosSinExpedientes = function (models) {
    return function (req, res) {
        var Procedimiento = models.procedimiento();
        Procedimiento.aggregate([
            {$match: {idjerarquia: {$in: req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)}}},
            {$unwind: "$periodos.a2014.solicitados"},
            {$group: {_id: '$_id',
                    suma: {$sum: '$periodos.a2014.solicitados'}}},
            {$match: {'suma': 0}},
            {$group: {_id: '',
                    total: {$sum: 1}}}
        ], function (err, result) {
            if (err) {
                console.error('Invocación inválida en procedimientos sin expediente ' + err);
                res.status(500).end();
                return;
            } else {
                console.log(result);
                res.json(result[0]);
            }
        });
    };
};

exports.mediaMesTramites = function (models) {
    return function (req, res) {
        var anualidad = settings.anyo;
        var Procedimiento = models.procedimiento();
        Procedimiento.aggregate([
            {$project: {name: {}}}
        ], function (err, count) {
            if (err) {
                console.error('Invocación inválida en la búsqueda del expediente');
                res.status(500).end();
                return;
            } else {
                console.log(count);
                res.json({count: count});
            }
        });
    };
};


