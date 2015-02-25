'use strict';

function parseStr2Int(str) {
    var valor = parseInt(str);
    if (isNaN(valor)){
        valor = 0;
    }
    return valor;
}


exports.softCalculatePermiso = function (Q, models, permiso) {
    var Jerarquia = models.jerarquia();
    var Procedimiento = models.procedimiento();
    var Persona = models.persona();
    /*
     origen de datos:
     'jerarquiadirectalectura' : [Number],
     'jerarquiadirectaescritura' : [Number],
     'procedimientosdirectalectura' : [Number],
     'procedimientosdirectaescritura' : [Number],
     */

    var deferred = Q.defer();
    var deferredProcedimiento = Q.defer();

    permiso.jerarquialectura = [];
    permiso.jerarquiaescritura = [];
    permiso.procedimientoslectura = [];
    permiso.procedimientosescritura = [];

    /**** PARCHE PARA HABILITAR A LAS PERSONAS CON ALGÚN PERMISO ***/
    var restriccion_persona = {};
    if (permiso.login)
        restriccion_persona.login = permiso.login;
    if (permiso.codplaza)
        restriccion_persona.codplaza = permiso.codplaza;

    if (permiso.login && permiso.codplaza)
    {
        Persona.update(restriccion_persona, {'$set' : {habilitado : true}}, {multi:1}, function (err, personas) {
            if (err) {
                console.log(err);
            }
        });
    }
    /**** FIN PARCHE ***/

    // comprobamos que cualquier permiso sobre procedimiento permite leer la jerarquia a que pertenece.
    var dprocs = [];
    var superarray = (Array.isArray(permiso.procedimientosdirectalectura) ? permiso.procedimientosdirectalectura : []);
    superarray = superarray.concat(Array.isArray(permiso.procedimientosdirectaescritura) ? permiso.procedimientosdirectaescritura : []);
    var restriccion_proc = null;
    if (superarray.length > 0)
        restriccion_proc = {
            '$or': [
                {'codigo': {'$in': superarray}}
            ]
        };

    // si el permiso es otorgado a un codigo de plaza...
    if (permiso.codplaza && permiso.codplaza != '') {
        if (restriccion_proc != null)
            restriccion_proc['$or'].push({cod_plaza: permiso.codplaza});
        else
            restriccion_proc = {cod_plaza: permiso.codplaza};
    }


    if (restriccion_proc)
    {
        //buscamos los procedimientos cuyo responsable sea el del permiso
        Procedimiento.find(restriccion_proc).select('idjerarquia cod_plaza codigo').exec(function (err, procedimientos) {
            if (err) {
                console.error(err);
                console.error(32);
                deferredProcedimiento.reject(err);
                return;
            }
            // para cada procedimiento cuyo responsable sea el del permiso dado, comprobamos que el permiso especifica tal relación, es decir, que 
            // existe permisos explícito, y de no ser así se incluye. Esto significa establecer como permiso calculado de lecutra y escritura.
            // siendo solo en el calculado, de cambiar el propietario del procedimiento, desaparecerá su permiso explícito en cuanto se alcancen las
            // labores de mantenimiento
            procedimientos.forEach(function (procedimiento) {
                if (permiso.jerarquialectura.indexOf(procedimiento.idjerarquia) < 0)
                    permiso.jerarquialectura.push(procedimiento.idjerarquia);

                if (procedimiento.cod_plaza == permiso.codplaza) {
                    if (permiso.procedimientoslectura.indexOf(procedimiento.codigo) === -1)
                        permiso.procedimientoslectura.push(procedimiento.codigo);
                    if (permiso.procedimientosescritura.indexOf(procedimiento.codigo) === -1)
                        permiso.procedimientosescritura.push(procedimiento.codigo);
                }
            });
            deferredProcedimiento.resolve();
        });
    } else {
        deferredProcedimiento.resolve();
    }

    deferredProcedimiento.promise.then(function () {

        var attrsOrigenjerarquia = ['jerarquiadirectalectura', 'jerarquiadirectaescritura'];
        var attrsjerarquia = ['jerarquialectura', 'jerarquiaescritura'];

        var defs = [];
        // para cada uno de los arrays de permisos calculados
        attrsjerarquia.forEach(function (attr, idx) {
            // obtenemos el array de permisos directos del mismo tipo
            var idsjerarquia = permiso[ attrsOrigenjerarquia[idx] ];
            // si no existe lo creamos			
            if (!idsjerarquia)
                permiso[ attrsOrigenjerarquia[idx] ] = [];
            if (idsjerarquia && idsjerarquia.length == 0)
                return;
            var def = Q.defer();
            // buscamos todas las jerarquías indicadas en el mismo
            Jerarquia.find({id: {'$in': idsjerarquia}},{id:true, descendientes:true}, function (err, jerarquias) {
                if (err) {
                    def.reject(err);
                    return;
                }
                // para cada una de las jerarquías indicadas en el permiso, obtenemos los descendientes ya
                // se tendrán permisos no explícitos sobre dichas jerarquías. Añadimos a los arrays de 
                // permisos calculados.
                jerarquias.forEach(function (jerarquia) {
                    if (permiso[ attr ].indexOf(parseInt(jerarquia.id)) < 0)
                        permiso[ attr ].push(parseInt(jerarquia.id));
                    jerarquia.descendientes.forEach(function (idjerarquia) {
                        if (permiso[ attr ].indexOf(parseInt(idjerarquia)) < 0)
                            permiso[ attr ].push(parseInt(idjerarquia));
                    });
                });

                def.resolve();
            });

            defs.push(def.promise);
        });

        var defs2 = [];
        Q.all(defs).then(function () {
            var attrsOrigenjerarquia = ['jerarquialectura', 'jerarquiaescritura'];
            var attrprocedimientos = ['procedimientoslectura', 'procedimientosescritura'];
            var attrprocedimientosDirecto = ['procedimientosdirectalectura', 'procedimientosdirectaescritura'];

            attrprocedimientos.forEach(function (attr, idx) {

                if (!permiso [ attrprocedimientosDirecto[idx] ])
                    permiso [ attrprocedimientosDirecto[idx] ] = [];

                permiso[ attr ] = permiso[ attr ].concat(permiso [ attrprocedimientosDirecto[idx] ]);

                permiso[ attr ] = permiso[ attr ].filter(function (value, index, self) {
                    return self.indexOf(value) === index;
                })

                var idsjerarquia = permiso[ attrsOrigenjerarquia[idx] ];
                if (idsjerarquia && idsjerarquia.length == 0)
                    return;

                var def = Q.defer();
                var f = function (def, attr) {
                    return function (err, procedimientos) {
                        if (err) {
                            console.error(err);
                            console.error(93);
                            def.reject(err);
                            return;
                        }

                        procedimientos.forEach(function (procedimiento) {
                            if (permiso[ attr ].indexOf("" + procedimiento.codigo) < 0)
                            {
                                permiso[ attr ].push("" + procedimiento.codigo);
                            }
                        });
                        def.resolve();
                    };
                };

                Procedimiento.find({idjerarquia: {'$in': idsjerarquia}},{codigo:true}, f(def, attr));
                defs2.push(def.promise);
            });


            Q.all(defs2).then(function () {
			attrprocedimientos.forEach(function (attr, idx) {
				permiso[ attr ] = permiso[ attr ].filter(function (value, index, self) {
                    return self.indexOf(value) === index;
                })});
                deferred.resolve(permiso);
            }, function (err) {
                console.error(110);
                deferred.reject(err);
            });

        });
    });
    return deferred.promise;
};

//comprobar si el periodo esta cerrado es cosa
//del crud

//'ancestros' : [ jerarquia],
//responsables : [persona]
exports.softCalculateProcedimientoCache = function (Q, models, procedimiento) {
    var deferred = Q.defer();
    var deferredJerarquia = Q.defer();
    var deferredPersona = Q.defer();

    procedimiento.ancestros = [];
    procedimiento.responsables = [];

    var idjerarquia = procedimiento.idjerarquia;
    var Jerarquia = models.jerarquia();
    var Persona = models.persona();
    if (!idjerarquia) {
        //parche inconsistencia
        procedimiento.idjerarquia = 1;
        idjerarquia = procedimiento.idjerarquia;
    }
    if (idjerarquia) {

        Jerarquia.findOne({id: idjerarquia}, function (err, jerarquia) {
            if (err) {
                deferred.reject(err);
                return;
            }
            if (!jerarquia) {
                deferred.resolve([]);
                return;
            }
            var ids = [idjerarquia].concat(jerarquia.ancestros);

            Jerarquia.find({id: {'$in': ids}}, function (id, jerarquias) {
                jerarquias.sort(function (j1, j2) {
                    return j2.ancestros.length - j1.ancestros.length;
                });
                deferredJerarquia.resolve(jerarquias);
            });
        });
    } else {
        deferredJerarquia.resolve([]);
    }
    if (procedimiento.cod_plaza) {
        Persona.find({codplaza: procedimiento.cod_plaza}, function (err, personas) {
            if (err) {
                deferred.reject(err);
                return;
            }
            deferredPersona.resolve(personas);
        });
    } else {
        deferredPersona.resolve([]);
    }

    Q.all([deferredJerarquia.promise, deferredPersona.promise]).then(function (datos) {
        procedimiento.ancestros = datos[0];//jerarquias;
        procedimiento.responsables = datos[1];//personas;
        if (typeof procedimiento.ancestros !== 'undefined') {
            for (var i = 1; i <= 4; i++) {
                var a = 'ancestro_'+i;
                var a_v = 'ancestro_v_'+i;
                procedimiento[a] = '';
                procedimiento[a_v] = '';
            }
            var tamanyo = procedimiento.ancestros.length;
            for (var i = 0; i < tamanyo; i++) {
                var a = 'ancestro_'+(i+1);
                var a_v = 'ancestro_v_'+(tamanyo-i);
                procedimiento[a] = procedimiento.ancestros[i].nombrelargo;
                procedimiento[a_v] = procedimiento.ancestros[i].nombrelargo;
            }
        }
        deferred.resolve(procedimiento);
    }, function (err) {
        deferred.reject(err);
    });

    return deferred.promise;
}


exports.softCalculateProcedimiento = function (Q, models, procedimiento) {
    var deferred = Q.defer();

	console.log("softCalculateProcedimiento "+procedimiento.codigo);
    //para cada periodo
    if (typeof procedimiento.periodos != "object") {
        console.error('Error en procedimiento ' + procedimiento.codigo);
        deferred.reject(procedimiento);

        return deferred.promise;
    }	
	
    for (var periodo in procedimiento.periodos)
    {
        if (typeof procedimiento.periodos[ periodo ] != 'object')
            continue;

        //comprobar si está inicilializados los campos de tipo array a 12 elementos
        var campos = models.getSchema('plantillaanualidad');
        for (var campo in campos) {
            if (Array.isArray(procedimiento.periodos[ periodo ][campo]) && procedimiento.periodos[ periodo ][campo].length != 12) {
                while (procedimiento.periodos[ periodo ][campo].length < 12)
                    procedimiento.periodos[ periodo ][campo].push(0);

                //procedimiento.periodos[ periodo ][campo] = [0,0,0,0,0,0,0,0,0,0,0,0];
            }
        }

        if (typeof procedimiento.periodos[ periodo ].resueltos_1 == 'undefined')
            continue;

        //nuevos campos, calculados
        procedimiento.periodos[ periodo ].actualizado = [];
        procedimiento.periodos[ periodo ].total_resueltos = [];
        procedimiento.periodos[ periodo ].fuera_plazo = [];
        procedimiento.periodos[ periodo ].pendientes = [];
        procedimiento.periodos[ periodo ].Incidencias = {
            'Se han resuelto expedientes fuera de Plazo': [],
            'Aumenta el N de expedientes pendientes': [],
            'Hay quejas presentadas': [],
            'Hay expedientes prescritos/caducados': [],
            'Las solicitudes aumentan al menos 20%': [],
        };

		if (parseInt(periodo.replace("a",""))>2014) {
			var iperiodo = parseInt(periodo.replace("a",""));
			var sant = "a"+(iperiodo-1);
			var pi = procedimiento.periodos[sant].totalsolicitudes + procedimiento.periodos[sant].pendientes_iniciales;
			for(var mes=0;mes<12;mes++)
				pi -= procedimiento.periodos[sant].total_resueltos[mes];
			procedimiento.periodos[ periodo ].pendientes_iniciales = pi;
		}

        var pendientes = parseStr2Int(procedimiento.periodos[ periodo ].pendientes_iniciales);
        var solicitudesprevias = parseStr2Int(procedimiento.periodos[ periodo ].solicitados);
        var totalsolicitudes = 0;	
        for (var mes = 0; mes < 12; mes++) if (parseInt(periodo.replace("a",""))>2013) {
            var pendientesprevios = pendientes;
            var totalresueltos =
                    procedimiento.periodos[ periodo ].resueltos_1[mes] +
                    procedimiento.periodos[ periodo ].resueltos_5[mes] +
                    procedimiento.periodos[ periodo ].resueltos_10[mes] +
                    procedimiento.periodos[ periodo ].resueltos_15[mes] +
                    procedimiento.periodos[ periodo ].resueltos_30[mes] +
                    procedimiento.periodos[ periodo ].resueltos_45[mes] +
                    procedimiento.periodos[ periodo ].resueltos_mas_45[mes] +
                    procedimiento.periodos[ periodo ].resueltos_desistimiento_renuncia_caducidad[mes] +
                    procedimiento.periodos[ periodo ].resueltos_prescripcion[mes];
            var fueradeplazo = totalresueltos - procedimiento.periodos[ periodo ].en_plazo[mes];
            var solicitudes = parseStr2Int(procedimiento.periodos[ periodo ].solicitados[mes]);

            totalsolicitudes += solicitudes;
            pendientes = pendientes + solicitudes - totalresueltos;

            procedimiento.periodos[ periodo ].actualizado.push( (solicitudes + totalresueltos) > 0 ? 1 :0 );

            procedimiento.periodos[ periodo ].total_resueltos.push(totalresueltos);
            procedimiento.periodos[ periodo ].fuera_plazo.push(fueradeplazo);
            procedimiento.periodos[ periodo ].pendientes.push(pendientes);

            procedimiento.periodos[ periodo ].Incidencias['Se han resuelto expedientes fuera de Plazo'].push(fueradeplazo);
            procedimiento.periodos[ periodo ].Incidencias['Aumenta el N de expedientes pendientes'].push(pendientes > pendientesprevios ? pendientes - pendientesprevios : 0);
            procedimiento.periodos[ periodo ].Incidencias['Hay quejas presentadas'].push(procedimiento.periodos[ periodo ].quejas[mes]);
            procedimiento.periodos[ periodo ].Incidencias['Hay expedientes prescritos/caducados'].push(procedimiento.periodos[ periodo ].resueltos_prescripcion[mes]);
            procedimiento.periodos[ periodo ].Incidencias['Las solicitudes aumentan al menos 20%'].push((solicitudes > solicitudesprevias * 1.2) ? solicitudes - solicitudesprevias : 0);
            solicitudesprevias = solicitudes;
        }
        procedimiento.periodos[ periodo ].totalsolicitudes = totalsolicitudes;
    }
    deferred.resolve(procedimiento);
    console.log('softCalculatedProcedimiento: ' + procedimiento.codigo);

    return deferred.promise;
};

exports.fullSyncprocedimiento = function (Q, models, fnprocedimiento) {
    var deferred = Q.defer(),
    Procedimiento = models.procedimiento(),
    informes = [];

    Procedimiento.find({}, function (err, procedimientos) {
        if (err) {
            deferred.reject(err);
            return;
        }

        var defs = [];
        procedimientos.forEach(function (procedimiento, i) {
            var promise = Q.defer();
            var f = function (promise, procedimiento) {
                var proccodigo = procedimiento.codigo;
                exports.softCalculateProcedimiento(Q, models, procedimiento).then(function (procedimiento) {
                    exports.softCalculateProcedimientoCache(Q, models, procedimiento).then(function (procedimiento) {
                        if (!procedimiento.codigo)
                        {
                            informes.push({codigo: proccodigo, status: 500});
                            promise.reject(procedimiento);
                        } else {
                            fnprocedimiento.saveVersion(models, Q, procedimiento).then(function () {
                                procedimiento.save(function (error) {
                                    if (error) {
                                        console.error(error);
                                        informes.push({codigo: procedimiento.codigo, status: 500});
                                        promise.reject(error);
                                    } else {
                                        informes.push({codigo: procedimiento.codigo, status: 200, procedimiento: procedimiento});
                                        promise.resolve();
                                    }
                                });
                            });
                        }
                    }, function (err) {
                        informes.push({codigo: proccodigo, status: 500});
                        promise.reject(err);
                    });
                }, function (err) {
                    informes.push({codigo: proccodigo, status: 500});
                    promise.reject(err);
                });
            }
            f(promise, procedimiento);
            defs.push(promise.promise);
        });

        Q.all(defs).then(function () {
            deferred.resolve(informes);
        }, function (err) {
            deferred.reject(err);
        });
    });
    return deferred.promise;
};

exports.fullSyncpermiso = function (Q, models) {
    var deferred = Q.defer();
    var Permiso = models.permiso();
    var informes = [];

    Permiso.find({}, function (err, permisos) {
        if (err) {
            deferred.reject(err);
            return;
        }

        var defs = [];
        var pindex = 0;
        var plength = permisos.length;
		var f = function (promise, permiso) {
			exports.softCalculatePermiso(Q, models, permiso).then(function (permiso) {
				pindex++;
				permiso.save(function (error) {
					if (error) {
						console.error();
                        console.error(error+' softcalculate permiso concluido ' + permiso._id + " ; " + permiso.login + ";" + permiso.codplaza + " (" + pindex + " de " + plength + ")");
						informes.push({codigo: permiso._id, status: 500});
						promise.reject(err);
					} else {
                        console.log('softcalculate permiso concluido ' + permiso._id + " ; " + permiso.login + ";" + permiso.codplaza + " (" + pindex + " de " + plength + ")");
						informes.push({codigo: permiso._id, status: 200, permiso: permiso});
						promise.resolve();
					}
				});
			}, function (err) {
				informes.push({codigo: permiso._id, status: 500});
				promise.reject(err);
			})
		};
        permisos.forEach(function (permiso, i) {
            var promise = Q.defer();

            f(promise, permiso);
            defs.push(promise.promise);
        });

        Q.all(defs).then(function () {
            console.log('Terminado... saliendo');
            deferred.resolve(informes);
        }, function (err) {
            deferred.reject(err);
        });
    });
    return deferred.promise;
};

exports.fullSyncjerarquia = function (Q, models) {
    //debe recalcular ancestros y descendientes a partir de ancestrodirecto
    var deferred = Q.defer();
    var Jerarquia = models.jerarquia();
    var Procedimiento = models.procedimiento();

    Jerarquia.find({}, function (err, jerarquias) {
        if (err) {
            deferred.reject(err);
            return;
        }

        var ids = [];
        var mapeado_array = [];

        jerarquias.forEach(function (jerarquia, i) {
            mapeado_array[ jerarquia.id ] = jerarquia;
            ids.push(jerarquia.id);
        })

        //reset
        for (var i = 0, j = ids.length; i < j; i++) {
            var id = ids[i];
            mapeado_array[id].ancestros = (mapeado_array[id].ancestrodirecto) ? [(mapeado_array[id].ancestrodirecto)] : [];
            mapeado_array[id].descendientes = [];
        }

        var maxiteraciones = ids.length;
        var cambio = true;
        while (cambio && maxiteraciones--)
        {
            cambio = 0;
            for (var i = 0, j = ids.length; i < j; i++) {
                var cambiointerno = true;
                var id = ids[i];
                while (cambiointerno) {
                    cambiointerno = 0;
                    //para todos mis ancestros
                    for (var k = 0; k < mapeado_array[id].ancestros.length; k++) {
                        var ancestroid = mapeado_array[id].ancestros[k];
                        if (typeof mapeado_array[ancestroid] == 'undefined') {
                            console.error(ancestroid + ' no existe en 35');
                            continue;
                        }
                        //busco si estoy entre sus descendientes
                        if (mapeado_array[ancestroid].descendientes.indexOf(id) < 0) {
                            cambio++;
                            cambiointerno++;
                            mapeado_array[ancestroid].descendientes.push(id);
                        }

                        //busco si mis descendientes están entre sus descendientes
                        for (var l = 0; l < mapeado_array[id].descendientes.length; l++) {
                            var descendienteid = mapeado_array[id].descendientes[l];
                            if (mapeado_array[ancestroid].descendientes.indexOf(descendienteid) < 0) {
                                cambio++;
                                cambiointerno++;
                                mapeado_array[ancestroid].descendientes.push(descendienteid);
                            }
                        }
                    }

                    //para todos mis descendientes
                    for (var k = 0; k < mapeado_array[id].descendientes.length; k++) {
                        var descendienteid = mapeado_array[id].descendientes[k];
                        if (typeof mapeado_array[descendienteid] == 'undefined') {
                            console.error(descendienteid + ' no existe en 47');
                            continue;
                        }
                        //busco si estoy entre sus ancestros
                        if (!mapeado_array[descendienteid].ancestros.indexOf(id) < 0) {
                            cambio++;
                            cambiointerno++;
                            mapeado_array[descendienteid].ancestros.push(id);
                        }

                        //busco si mis ancestros están entre sus ancestros
                        for (var l = 0; l < mapeado_array[id].ancestros.length; l++) {
                            var ancestroid = mapeado_array[id].ancestros[l];
                            if (mapeado_array[descendienteid].ancestros.indexOf(ancestroid) < 0) {
                                cambio++;
                                cambiointerno++;
                                mapeado_array[descendienteid].ancestros.push(ancestroid);
                            }
                        }
                    }
                }
            }
        }

        var defs = [];
        var contador = 0;
        for (var i = 0, j = ids.length; i < j; i++)
        {
            var id = ids[i];
            var defer = Q.defer();
            var f = function (defer, id) {
                return function (err, count) {
                    mapeado_array[id].numprocedimientos = count;
                    mapeado_array[id].save(function (e) {
                        if (e) {
                            console.error(e);
                            defer.reject(e);
                        }
                        else {
                            defer.resolve();
                        }
                    });
                }
            };

            Procedimiento.count({'$and': [
                    {'idjerarquia': {'$in': [mapeado_array[id].id].concat(mapeado_array[id].descendientes)}},
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
                ]},
            f(defer, id));
            defs.push(defer.promise);
        }
        Q.all(defs).then(function () {
            deferred.resolve(mapeado_array.filter(function (o) {
                return o;
            }));
        }, function (e) {
            console.error(e);
            deferred.reject(e);
        })

    });

    return deferred.promise;
}

exports.fprocedimiento = function (Q, models, fnprocedimiento) {
    return function (req, res) {


        if (req.user.permisoscalculados.superuser) {
            exports.fullSyncprocedimiento(Q, models, fnprocedimiento).then(function (o) {

                res.json(o);
            }, function (e) {
                console.error(e);
                res.send(500, JSON.stringify(e));
            });
        } else {
            res.send(401, 'Carece de permisos');
        }
    };
};

exports.fjerarquia = function (Q, models) {
    return function (req, res) {

        if (req.user.permisoscalculados.superuser) {
            exports.fullSyncjerarquia(Q, models).then(function (o) {
                res.json(o);
            }, function (e) {
                console.error(e);
                res.send(500, JSON.stringify(e));
            });
        } else {
            res.send(401, 'Carece de permisos');
        }
    };
};

exports.fpermiso = function (Q, models) {
    return function (req, res) {


        if (req.user.permisoscalculados.superuser) {
            exports.fullSyncpermiso(Q, models).then(function (o) {
                console.log('Terminado... escribiendo informe');
                res.json({});
            }, function (e) {
                console.error(e);
                res.send(500, JSON.stringify(e));
            });
        } else {
            res.send(401, 'Carece de permisos');
        }
    };
};
