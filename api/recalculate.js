(function(module, logger){
	'use strict';

	const Q = require('q');
	const attrsOrigenjerarquia = ['jerarquialectura', 'jerarquiaescritura'];

	function parseStr2Int(str){
		var valor = parseInt(str, 10);
		if (isNaN(valor)){

			return 0;
		}

		return valor;
	}

	function reportError(e){
		if (e) {
			logger.error(e);
		}
	}

	function habilitaPersonasConPermisos(personamodel, permiso){
		const restriccionPersona = {};
		if (permiso.login){
			restriccionPersona.login = permiso.login;
		}
		if (permiso.codplaza){
			restriccionPersona.codplaza = permiso.codplaza;
		}

		if (permiso.login && permiso.codplaza){
			personamodel.update(restriccionPersona, {'$set': {'habilitado': true}}, {'multi': 1}, function (err) {
				if (err) {
					console.log(err);
				}
			});
		}
	}

	function updatePermisoAttr(defer, attr, idprop, permiso) {
		return function (err, objetos) {
			if (err) {
				defer.reject(err);
			} else {

				objetos.forEach(function(objeto) {
					if (permiso[attr].indexOf(String(objeto[idprop])) < 0){
						permiso[attr].push(String(objeto[idprop]));
					}
				});
				defer.resolve();
			}
		};
	}

	function softCalculatePermiso(models, permiso) {
		const jerarquiamodel = models.jerarquia();
		const procedimientomodel = models.procedimiento();
		const entidadObjetomodel = models.entidadobjeto();
		const personamodel = models.persona();
		/*
		 origen de datos:
		'jerarquiadirectalectura' : [Number],
		'jerarquiadirectaescritura' : [Number],
		'procedimientosdirectalectura' : [Number],
		'procedimientosdirectaescritura' : [Number],
		 */

		const deferred = Q.defer();
		const deferredProcedimiento = Q.defer();
		const deferredEntidadObjeto = Q.defer();
		const defsPEO = [deferredProcedimiento.promise, deferredEntidadObjeto.promise];

		permiso.jerarquialectura = [];
		permiso.jerarquiaescritura = [];
		permiso.procedimientoslectura = [];
		permiso.procedimientosescritura = [];
		permiso.entidadobjetolectura = [];
		permiso.entidadobjetoescritura = [];

		/**** PARCHE PARA HABILITAR A LAS PERSONAS CON ALGÚN PERMISO ***/
		habilitaPersonasConPermisos(personamodel, permiso);
		/**** FIN PARCHE ***/

		// comprobamos que cualquier permiso sobre procedimiento permite leer la jerarquia a que pertenece.
		let superarray = (Array.isArray(permiso.procedimientosdirectalectura) ? permiso.procedimientosdirectalectura : []);
		superarray = superarray.concat(Array.isArray(permiso.procedimientosdirectaescritura) ? permiso.procedimientosdirectaescritura : []);
		let restriccionProc = null;
		if (superarray.length > 0){
			restriccionProc = {'$or': [{'codigo': {'$in': superarray}}]};
		}

		//idem para las entidadesobjeto
		superarray = (Array.isArray(permiso.entidadobjetodirectalectura) ? permiso.entidadobjetodirectalectura : []);
		superarray = superarray.concat(Array.isArray(permiso.entidadobjetodirectaescritura) ? permiso.entidadobjetodirectaescritura : []);
		let restriccionEo = null;
		if (superarray.length > 0){
			restriccionEo = {'$or': [{'_id': {'$in': superarray}}]};
		}

		// si el permiso es otorgado a un codigo de plaza...
		if (permiso.codplaza && permiso.codplaza !== '') {
			if (restriccionProc === null){
				restriccionProc = {cod_plaza: permiso.codplaza};
			} else {
				restriccionProc['$or'].push({cod_plaza: permiso.codplaza});
			}
			if (restriccionEo === null){
				restriccionEo = {cod_plaza: permiso.codplaza};

			} else {
				restriccionEo['$or'].push({cod_plaza: permiso.codplaza});
			}
		}


		if (restriccionProc){
			//buscamos los procedimientos cuyo responsable sea el del permiso
			procedimientomodel.find(restriccionProc).select('idjerarquia cod_plaza codigo').exec().then(function(procedimientos) {
				// para cada procedimiento cuyo responsable sea el del permiso dado, comprobamos que el permiso especifica tal relación, es decir, que
				// existe permisos explícito, y de no ser así se incluye. Esto significa establecer como permiso calculado de lecutra y escritura.
				// siendo solo en el calculado, de cambiar el propietario del procedimiento, desaparecerá su permiso explícito en cuanto se alcancen las
				// labores de mantenimiento
				procedimientos.forEach(function (procedimiento) {
					if (permiso.jerarquialectura.indexOf(procedimiento.idjerarquia) < 0){
						permiso.jerarquialectura.push(procedimiento.idjerarquia);
					}

					if (procedimiento.cod_plaza === permiso.codplaza) {
						if (permiso.procedimientoslectura.indexOf(String(procedimiento.codigo)) === -1){
							permiso.procedimientoslectura.push(String(procedimiento.codigo));
						}
						if (permiso.procedimientosescritura.indexOf(String(procedimiento.codigo)) === -1){
							permiso.procedimientosescritura.push(String(procedimiento.codigo));
						}
					}
				});

				deferredProcedimiento.resolve();
			}, deferredProcedimiento.reject);
		} else {
			deferredProcedimiento.resolve();
		}

		// idem para entidades objeto
		if (restriccionEo){
			//buscamos los procedimientos cuyo responsable sea el del permiso
			entidadObjetomodel.find(restriccionEo).select('idjerarquia responsable codigo').exec().then(function(entidadesobjeto){
				// para cada entidadobjeto cuyo responsable sea el del permiso dado, comprobamos que el permiso especifica tal relación, es decir, que
				// existe permisos explícito, y de no ser así se incluye. Esto significa establecer como permiso calculado de lecutra y escritura.
				// siendo solo en el calculado, de cambiar el propietario del procedimiento, desaparecerá su permiso explícito en cuanto se alcancen las
				// labores de mantenimiento
				entidadesobjeto.forEach(function(entidadobjeto) {
					if (permiso.jerarquialectura.indexOf(String(entidadobjeto.idjerarquia)) < 0){
						permiso.jerarquialectura.push(String(entidadobjeto.idjerarquia));
					}

					if (entidadobjeto.cod_plaza === permiso.codplaza) {
						if (permiso.entidadobjetolectura.indexOf(String(entidadobjeto._id)) === -1){
							permiso.entidadobjetolectura.push(String(entidadobjeto._id));
						}
						if (permiso.entidadobjetoescritura.indexOf(String(entidadobjeto._id)) === -1){
							permiso.entidadobjetoescritura.push(String(entidadobjeto._id));
						}
					}
				});
				deferredEntidadObjeto.resolve();
			}, deferredEntidadObjeto.reject);
		} else {
			deferredEntidadObjeto.resolve();
		}

		Q.all(defsPEO).then(function(){
			const attrsjerarquia = ['jerarquialectura', 'jerarquiaescritura'];
			const defs = [];

			// para cada uno de los arrays de permisos calculados
			attrsjerarquia.forEach(function (attr, idx) {
				// obtenemos el array de permisos directos del mismo tipo
				const idsjerarquia = permiso[attrsOrigenjerarquia[idx]];
				// si no existe lo creamos
				if (!idsjerarquia){
					permiso[attrsOrigenjerarquia[idx]] = [];
				}
				if (idsjerarquia && idsjerarquia.length === 0){
					return;
				}
				const def = Q.defer();
				// buscamos todas las jerarquías indicadas en el mismo

				// TODO: cachear esta ineficiente consulta, no es necesaria, puede obtenerse de una caché
				jerarquiamodel.find({id: {'$in': idsjerarquia}}, {id: true, descendientes: true}).exec().then(function (jerarquias) {

					// para cada una de las jerarquías indicadas en el permiso, obtenemos los descendientes ya
					// se tendrán permisos no explícitos sobre dichas jerarquías. Añadimos a los arrays de
					// permisos calculados.
					jerarquias.forEach(function(jerarquia){
						if (permiso[attr].indexOf(parseInt(jerarquia.id, 10)) < 0){
							permiso[attr].push(parseInt(jerarquia.id, 10));
						}
						jerarquia.descendientes.forEach(function(idjerarquia) {
							if (permiso[attr].indexOf(parseInt(idjerarquia, 10)) < 0){
								permiso[attr].push(parseInt(idjerarquia, 10));
							}
						});
					});

					def.resolve();
				}, def.reject);

				defs.push(def.promise);
			});

			const defs2 = [];
			Q.all(defs).then(function () {
				const attrprocedimientos = ['procedimientoslectura', 'procedimientosescritura'];
				const attrprocedimientosDirecto = ['procedimientosdirectalectura', 'procedimientosdirectaescritura'];
				const attrentidadesobjeto = ['entidadobjetolectura', 'entidadobjetoescritura'];
				const attrentidadesobjetoDirecto = ['entidadobjetodirectalectura', 'entidadobjetodirectaescritura'];

				attrprocedimientos.forEach(function (attr, idx) {
					// si no existe el atributo de permisos para procedimientos lo creamos. Creamos un array vacio
					if (!permiso[attrprocedimientosDirecto[idx]]){
						permiso[attrprocedimientosDirecto[idx]] = [];
					}
					// idem para entidades objetos
					if (!permiso[attrentidadesobjetoDirecto[idx]]){
						permiso[attrentidadesobjetoDirecto[idx]] = [];
					}

					// el calculado siempre incluye al directo
					permiso[attr] = permiso[attr].concat(permiso[attrprocedimientosDirecto[idx]]);
					require('uniq')(permiso[attr]);

					//idem para entidades objeto
					const attreo = attrentidadesobjeto[idx];
					permiso[attreo] = permiso[attreo].concat(permiso[attrentidadesobjetoDirecto[idx]]);
					require('uniq')(permiso[attreo]);

					const idsjerarquia = permiso[attrsOrigenjerarquia[idx]];
					if (idsjerarquia && idsjerarquia.length === 0){

						return;
					}

					const dP = Q.defer();
					const dE = Q.defer();

					procedimientomodel.find({idjerarquia: {'$in': idsjerarquia}}, {codigo: true}, updatePermisoAttr(dP, attr, 'codigo', permiso));
					entidadObjetomodel.find({idjerarquia: {'$in': idsjerarquia}}, {_id: true}, updatePermisoAttr(dE, attreo, '_id', permiso));
					defs2.push(dP.promise);
					defs2.push(dE.promise);
				});


				Q.all(defs2).then(function () {
					attrprocedimientos.forEach(function (attr) {
						require('uniq')(permiso[attr]);
					});
					attrentidadesobjeto.forEach(function(attreo){
						require('uniq')(permiso[attreo]);
					});

					deferred.resolve(permiso);
				}, deferred.reject);

			});
		});

		return deferred.promise;
	}


	//comprobar si el periodo esta cerrado es cosa del crud
	//'ancestros' : [ jerarquia],
	//responsables : [persona]

	function softCalculateProcedimientoCache(models, procedimiento, api){

		const deferred = Q.defer();
		const deferredJerarquia = Q.defer();
		const jerarquiamodel = models.jerarquia();
		const personamodel = models.persona();

		let deferredPersona = false;
		let idjerarquia = procedimiento.idjerarquia;

		procedimiento.ancestros = [];
		procedimiento.responsables = [];

		if (!idjerarquia) {
			//parche inconsistencia
			procedimiento.idjerarquia = 1;
			idjerarquia = procedimiento.idjerarquia;
		}

		if (idjerarquia){
			if (typeof api === 'object'){
				deferredJerarquia.resolve(api.getAncestros(idjerarquia));
			} else {
				jerarquiamodel.findOne({id: idjerarquia}).exec().then(function(jerarquia){
					if (!jerarquia) {
						deferred.resolve([]);

						return;
					}

					jerarquiamodel.find({id: {'$in': jerarquia.ancestros}}, function (id, js) {
						const jerarquias = [idjerarquia].concat(js);
						jerarquias.sort(function (j1, j2) {
							return j2.ancestros.length - j1.ancestros.length;
						});
						deferredJerarquia.resolve(jerarquias);
					});
				}, deferred.reject);
			}
		} else {
			deferredJerarquia.resolve([]);
		}
		if (procedimiento.cod_plaza) {
			deferredPersona = personamodel.find({codplaza: procedimiento.cod_plaza}).lean().exec();
		} else {
			deferredPersona = Q.all([]);
		}

		Q.all([deferredJerarquia.promise, deferredPersona.promise]).then(function(datos){

			procedimiento.ancestros = datos[0];//jerarquias;
			procedimiento.responsables = datos[1];//personas;
			for (let i = 1; i <= 4; i += 1) {
				procedimiento['ancestro_' + i] = '';
				procedimiento['ancestro_v_' + i] = '';
			}
			if (typeof procedimiento.ancestros === 'object') {
				const tamanyo = procedimiento.ancestros.length;
				for (let i = 0; i < tamanyo; i += 1) {
					procedimiento['ancestro_' + (i + 1)] = procedimiento.ancestros[i].nombrelargo;
					procedimiento['ancestro_v_' + (tamanyo - i)] = procedimiento.ancestros[i].nombrelargo;
				}
			}
			deferred.resolve(procedimiento);
		}, deferred.reject);

		return deferred.promise;
	}

	function softCalculateProcedimiento(models, procedimiento) {
		const deferred = Q.defer();

		//para cada periodo
		if (typeof procedimiento.periodos !== 'object') {
			deferred.reject({error: 'Error en procedimiento ' + procedimiento.codigo});

			return deferred.promise;
		}
		const campos = models.getSchema('plantillaanualidad');

		for (const periodo in procedimiento.periodos){
			if (typeof procedimiento.periodos[periodo] !== 'object'){
				continue;
			}
				
			//comprobar si está inicilializados los campos de tipo array a 12 elementos
			
			for (const campo in campos) {
				if (Array.isArray(procedimiento.periodos[periodo][campo]) && procedimiento.periodos[periodo][campo].length < 12){
					while (procedimiento.periodos[periodo][campo].length < 12){
						procedimiento.periodos[periodo][campo].push(0);
					}
				}
			}

			if (typeof procedimiento.periodos[periodo].resueltos_1 === 'undefined'){
				continue;
			}

			//nuevos campos, calculados
			procedimiento.periodos[periodo].actualizado = [];
			procedimiento.periodos[periodo].total_resueltos = [];
			procedimiento.periodos[periodo].fuera_plazo = [];
			procedimiento.periodos[periodo].pendientes = [];
			procedimiento.periodos[periodo].Incidencias = {
				'Se han resuelto expedientes fuera de Plazo': [],
				'Aumenta el N de expedientes pendientes': [],
				'Hay quejas presentadas': [],
				'Hay expedientes prescritos/caducados': [],
				'Las solicitudes aumentan al menos 20%': []
			};

			if (parseInt(periodo.replace('a', ''), 10) > 2014) {
				const iperiodo = parseInt(periodo.replace('a', ''), 10);
				const sant = 'a' + (iperiodo - 1);
				let pi = procedimiento.periodos[sant].totalsolicitudes + procedimiento.periodos[sant].pendientes_iniciales;
				for (let mes = 0; mes < 12; mes += 1){
					pi -= procedimiento.periodos[sant].total_resueltos[mes];
				}
				procedimiento.periodos[periodo].pendientes_iniciales = pi;
			}

			let pendientes = parseStr2Int(procedimiento.periodos[periodo].pendientes_iniciales);
			let solicitudesprevias = parseStr2Int(procedimiento.periodos[periodo].solicitados);
			let totalsolicitudes = 0;
			if (parseInt(periodo.replace('a', ''), 10) > 2013){
				for (let mes = 0; mes < 12; mes += 1){
					const pendientesprevios = pendientes;
					const totalresueltos = procedimiento.periodos[periodo].resueltos_1[mes] +
						procedimiento.periodos[periodo].resueltos_5[mes] +
						procedimiento.periodos[periodo].resueltos_10[mes] +
						procedimiento.periodos[periodo].resueltos_15[mes] +
						procedimiento.periodos[periodo].resueltos_30[mes] +
						procedimiento.periodos[periodo].resueltos_45[mes] +
						procedimiento.periodos[periodo].resueltos_mas_45[mes] +
						procedimiento.periodos[periodo].resueltos_desistimiento_renuncia_caducidad[mes] +
						procedimiento.periodos[periodo].resueltos_prescripcion[mes];
					const fueradeplazo = totalresueltos - procedimiento.periodos[periodo].en_plazo[mes];
					const solicitudes = parseStr2Int(procedimiento.periodos[periodo].solicitados[mes]);

					totalsolicitudes += solicitudes;
					pendientes = pendientes + solicitudes - totalresueltos;

					procedimiento.periodos[periodo].actualizado.push((solicitudes + totalresueltos) > 0 ? 1 : 0);

					procedimiento.periodos[periodo].total_resueltos.push(totalresueltos);
					procedimiento.periodos[periodo].fuera_plazo.push(fueradeplazo);
					procedimiento.periodos[periodo].pendientes.push(pendientes);

					procedimiento.periodos[periodo].Incidencias['Se han resuelto expedientes fuera de Plazo'].push(fueradeplazo);
					procedimiento.periodos[periodo].Incidencias['Aumenta el N de expedientes pendientes'].push(pendientes > pendientesprevios ? pendientes - pendientesprevios : 0);
					procedimiento.periodos[periodo].Incidencias['Hay quejas presentadas'].push(procedimiento.periodos[periodo].quejas[mes]);
					procedimiento.periodos[periodo].Incidencias['Hay expedientes prescritos/caducados'].push(procedimiento.periodos[periodo].resueltos_prescripcion[mes]);
					procedimiento.periodos[periodo].Incidencias['Las solicitudes aumentan al menos 20%'].push((solicitudes > solicitudesprevias * 1.2) ? solicitudes - solicitudesprevias : 0);
					solicitudesprevias = solicitudes;
				}
				procedimiento.periodos[periodo].totalsolicitudes = totalsolicitudes;
			}
		}
		deferred.resolve(procedimiento);

		return deferred.promise;
	}

	function recalculateProcedimiento(models, procedimientolib, api, informes, versionsToSave) {
		return function(procedimiento){
			const promise = Q.defer();
			const proccodigo = procedimiento.codigo;
			softCalculateProcedimiento(models, procedimiento).then(function(proc) {
				softCalculateProcedimientoCache(models, proc, api).then(function(proced) {
					if (!proced.codigo){
						informes.push({codigo: proced, status: 500});
						promise.reject(proced);
					} else {
						versionsToSave.push(proced);
						proced.markModified('periodos');
						proced.save(function(error){
							if (error) {
								informes.push({codigo: proced.codigo, status: 500});
								promise.reject(error);
							} else {
								informes.push({codigo: proced.codigo, status: 200, procedimiento: proced});
								promise.resolve();
							}
						});
					
					}
				}, function (err) {
					informes.push({codigo: proc, status: 500});
					promise.reject(err);
				});
			}, function (err) {
				informes.push({codigo: proccodigo, status: 500});
				promise.reject(err);
			});

			return promise.promise;
		};
	}

	function fullSyncprocedimiento(models, procedimientolib, api) {
		const procedimientomodel = models.procedimiento(),
			deferred = Q.defer();

		procedimientomodel.find({}).exec().then(function(procedimientos) {
			const versionsToSave = [],
				informes = [],
				fnRecalculate = recalculateProcedimiento(models, procedimientolib, api, informes, versionsToSave),
				defs = procedimientos.map(fnRecalculate);

			Q.all(defs).then(function(){
				procedimientolib.saveVersion(models, versionsToSave).then(function(){
					deferred.resolve(informes);
				}, function (erro) {
					erro.informes = informes;
					deferred.reject(erro);
				});
			}, function (err) {
				err.informes = informes;
				deferred.reject(err);
			});
		}, deferred.reject);

		return deferred.promise;
	}

	function recalculatePermiso(models){
		return function(permiso){
			const deferred = Q.defer();
			softCalculatePermiso(models, permiso).then(function(perm){
				perm.save(function(error) {
					if (error){
						deferred.reject(error);
					} else {
						deferred.resolve({codigo: perm._id, status: 200, permiso: perm});
					}
				});
			}, deferred.reject);

			return deferred.promise;
		};
	}

	function fullSyncpermiso(models) {
		const deferred = Q.defer(),
			permisomodel = models.permiso();

		permisomodel.find({}).then(function(permisos){
			const recPermisoFn = recalculatePermiso(models);
			Q.all(permisos.map(recPermisoFn)).then(deferred.resolve, deferred.reject);
		}, deferred.reject);

		return deferred.promise;
	}

	function fnActualizacion(campo, promise, actualizarancestros, mapeadoArray){
		return function(erro, agrupaciones){
			if (erro){
				logger.error(erro);
				promise.reject(erro);

				return;
			}

			//tercero recorrer el listado de agrupaciones calculada, incrementando el valor de las jerarquias:
			for (let i = 0, j = agrupaciones.length; i < j; i += 1){
				const idjerarquia = agrupaciones[i]._id,
					count = agrupaciones[i].count;

				if (typeof mapeadoArray[String(idjerarquia)] === 'object'){
					mapeadoArray[String(idjerarquia)][campo] += count;
					//actualizar sus ancestros también
					if (!actualizarancestros){
						continue;
					}
					for (let k = 0, l = mapeadoArray[String(idjerarquia)].ancestros.length; k < l; k++){
						const idancestro = mapeadoArray[String(idjerarquia)].ancestros[k];
						mapeadoArray[String(idancestro)][campo] += count;
					}
				}
			}
			promise.resolve();
		};
	}


	function fullSyncjerarquia(models) {
		//debe recalcular ancestros y descendientes a partir de ancestrodirecto
		const deferred = Q.defer();
		const jerarquiamodel = models.jerarquia();
		const cartamodel = models.entidadobjeto();
		const procedimientomodel = models.procedimiento();

		jerarquiamodel.find({}).exec().then(function(jerarquias) {

			const ids = [];
			const mapeadoArray = [];

			jerarquias.forEach(function(jerarquia) {
				mapeadoArray[String(jerarquia.id)] = jerarquia;
				ids.push(jerarquia.id);
			});

			//reset
			for (let i = 0, j = ids.length; i < j; i += 1) {
				const id = ids[i];
				mapeadoArray[String(id)].ancestros = (mapeadoArray[String(id)].ancestrodirecto) ? [(mapeadoArray[String(id)].ancestrodirecto)] : [];
				mapeadoArray[String(id)].descendientes = [];
			}


			let maxiteraciones = ids.length;
			let cambio = 1;
			while (cambio && maxiteraciones--){
				cambio = 0;
				for (let i = 0, j = ids.length; i < j; i += 1) {
					let cambiointerno = 1;
					const id = ids[i];
					while (cambiointerno) {
						cambiointerno = 0;
						//para todos mis ancestros
						for (let k = 0; k < mapeadoArray[String(id)].ancestros.length; k += 1) {
							const ancestroid = mapeadoArray[String(id)].ancestros[k];
							if (typeof mapeadoArray[String(ancestroid)] === 'undefined') {
								logger.error(ancestroid + ' no existe en 35');
								continue;
							}
							//busco si estoy entre sus descendientes
							if (mapeadoArray[String(ancestroid)].descendientes.indexOf(id) < 0) {
								cambio++;
								cambiointerno++;
								mapeadoArray[String(ancestroid)].descendientes.push(id);
							}

							//busco si mis descendientes están entre sus descendientes
							for (let l = 0; l < mapeadoArray[String(id)].descendientes.length; l += 1) {
								const descendienteid = mapeadoArray[String(id)].descendientes[l];
								if (mapeadoArray[String(ancestroid)].descendientes.indexOf(descendienteid) < 0) {
									cambio += 1;
									cambiointerno += 1;
									mapeadoArray[String(ancestroid)].descendientes.push(descendienteid);
								}
							}
						}

						//para todos mis descendientes
						for (let k = 0; k < mapeadoArray[String(id)].descendientes.length; k += 1) {
							const descendienteid = mapeadoArray[String(id)].descendientes[k];
							if (typeof mapeadoArray[String(descendienteid)] === 'undefined') {
								console.error(descendienteid + ' no existe en 47');
								continue;
							}
							//busco si estoy entre sus ancestros
							if (!mapeadoArray[String(descendienteid)].ancestros.indexOf(id) < 0) {
								cambio += 1;
								cambiointerno += 1;
								mapeadoArray[String(descendienteid)].ancestros.push(id);
							}

							//busco si mis ancestros están entre sus ancestros
							for (let l = 0; l < mapeadoArray[String(id)].ancestros.length; l += 1) {
								const ancestroid = mapeadoArray[String(id)].ancestros[l];
								if (mapeadoArray[String(descendienteid)].ancestros.indexOf(ancestroid) < 0) {
									cambio += 1;
									cambiointerno += 1;
									mapeadoArray[String(descendienteid)].ancestros.push(ancestroid);
								}
							}
						}
					}
				}
			}


			//primero recorrer el listado de jerarquías que ya existía, asignando el valor 0 a los dos atributos:
			for (const id in mapeadoArray){
				if (typeof mapeadoArray[String(id)] === 'object' && typeof mapeadoArray[String(id)].numprocedimientos === 'number' ){
					mapeadoArray[String(id)].numprocedimientos = 0;
					mapeadoArray[String(id)].numcartas = 0;
				}
			}

			//segundo definir función genérica, que sirva tanto para numprocedimientos como para numcartas
			//campo: ['numprocedimientos', 'numcartas']
			
			const deferNumProcedimientos = Q.defer(),
				deferNumCartas = Q.defer();

			//cuarto lanzar el cálculo del número de procedimientos y cartas asignado/as directamente a cada jerarquia:
			const matchProcedimiento = {
				'$and': [
					{
						'$or': [
							{'oculto': {$exists: false}},
							{
								'$and': [
									{'oculto': {$exists: true}},
									{'oculto': false}
								]
							}
						]
					},
					{
						'$or': [
							{'eliminado': {$exists: false}},
							{
								'$and': [
									{'eliminado': {$exists: true}},
									{'eliminado': false}
								]
							}
						]
					}
				]
			};


			procedimientomodel.aggregate([{$match: matchProcedimiento}, {$group: {_id: '$idjerarquia', count: {$sum: 1}}}, {$sort: {'_id': 1}}], fnActualizacion('numprocedimientos', deferNumProcedimientos, true, mapeadoArray));
			cartamodel.aggregate([{$match: {tipoentidad: 'CS'}}, {$group: {_id: '$idjerarquia', count: {$sum: 1}}}, {$sort: {'_id': 1}}], fnActualizacion('numcartas', deferNumCartas, false, mapeadoArray));

			//quinto esperar resultados y devolverlos
			Q.all([deferNumProcedimientos.promise, deferNumCartas.promise]).then(function(){

				for (const id in mapeadoArray){
					if (typeof mapeadoArray[String(id)] === 'object'){
						mapeadoArray[String(id)].save(reportError); /* posible condición de carrera por no esperar */
					}
				}
				deferred.resolve({});
			}, deferred.reject);
		}, deferred.reject);

		return deferred.promise;
	}


	module.exports.fprocedimiento = function (req, res) {
		const models = req.metaenvironment.models,
			procedimientolib = req.metaenvironment.procedimiento,
			api = req.metaenvironment.api;

		if (req.user.permisoscalculados.superuser) {
			api.resetCache();
			api.calculateArbol(models).then(function(){
				fullSyncprocedimiento(models, procedimientolib, api).then(function(){
					res.json({});
				}, req.eh.errorHelper(res));
			}, req.eh.errorHelper(res));
			
		} else {
			req.eh.unauthorizedHelper(res);
		}
	};

	module.exports.fjerarquia = function (req, res){
		const models = req.metaenvironment.models,
			api = req.metaenvironment.api;

		if (req.user.permisoscalculados.superuser) {
			api.resetCache();
			fullSyncjerarquia(models).then(req.eh.okHelper(res), req.eh.errorHelper(res));
		} else {
			req.eh.unauthorizedHelper(res);
		}
	};

	module.exports.fpermiso = function(req, res) {
		const models = req.metaenvironment.models,
			api = req.metaenvironment.api;
		if (req.user.permisoscalculados.superuser) {
			api.resetCache();
			fullSyncpermiso(models).then(function(){
				res.json({});
			}, req.eh.errorHelper(res));
		} else {
			req.eh.unauthorizedHelper(res);
		}
	};

	module.exports.fullSyncpermiso = fullSyncpermiso;
	module.exports.fullSyncjerarquia = fullSyncjerarquia;
	module.exports.fullSyncprocedimiento = fullSyncprocedimiento;
	module.exports.softCalculatePermiso = softCalculatePermiso;
	module.exports.softCalculateProcedimiento = softCalculateProcedimiento;
	module.exports.softCalculateProcedimientoCache = softCalculateProcedimientoCache;
	

})(module, console);
