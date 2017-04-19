(function(module, logger){
	'use strict';

	const Q = require('q');
	const attrprocedimientos = ['procedimientoslectura', 'procedimientosescritura'];
	const attrprocedimientosDirecto = ['procedimientosdirectalectura', 'procedimientosdirectaescritura'];
	const attrentidadesobjeto = ['entidadobjetolectura', 'entidadobjetoescritura'];
	const attrentidadesobjetoDirecto = ['entidadobjetodirectalectura', 'entidadobjetodirectaescritura'];
	const attrsjerarquia = ['jerarquialectura', 'jerarquiaescritura'];
	const attrsjerarquiaDirecto = ['jerarquiadirectalectura', 'jerarquiadirectaescritura'];

	function parseStr2Int(str){
		const valor = parseInt(str, 10);

		return isNaN(valor) ? 0 : valor;
	}

	function reportError(e){
		if (e) {
			logger.error(e);
		}
	}
/*
	function habilitaPersonasConPermisos(personamodel, permiso){
		// TODO: there's a better way to do this

		const restriccionPersona = {};
		if (permiso.login){
			restriccionPersona.login = permiso.login;
		}
		if (permiso.codplaza){
			restriccionPersona.codplaza = permiso.codplaza;
		}

		if (permiso.login || permiso.codplaza){
			personamodel.update(restriccionPersona, {'$set': {'habilitado': true}}, {'multi': 1}, reportError);
		}
		
	}
*/
	function updatePermisoAttr(defer, attr, idprop, permiso){
		return function (err, objetos) {
			if (err) {
				defer.reject(err);
			} else {
				objetos.forEach(function(objeto){
					permiso[attr].push(String(objeto[idprop]));
				});
				defer.resolve();
			}
		};
	}

	function restauraModeloPermiso(models, permiso){
		const schemapermiso = models.getSchema('permiso');
		for (const attr in schemapermiso){
			if (Array.isArray(schemapermiso[attr])){
				if (!Array.isArray(permiso[attr])){
					permiso[attr] = [];
				}

				/* TODO: GARANTIZAR QUE PARA TODO PERMISO DE ESCRITURA ESTÁ CONTENIDO EN LECTURA */
				/* parche */
				if (attr.endsWith('escritura')){
					const attrlectura = attr.replace('escritura', 'lectura');
					if (!Array.isArray(permiso[attrlectura])){
						permiso[attrlectura] = [];
					}
					if (permiso[attr].length > 0){
						permiso[attrlectura] = permiso[attrlectura].concat(permiso[attr]);
						require('uniq')(permiso[attrlectura]);
					}
				}
				/* fin parche */

				if (permiso[attr].length > 0){
					require('uniq')(permiso[attr]);
				}
			}
		}
	}

	/*
	 origen de datos:
	'jerarquiadirectalectura' : [Number],
	'jerarquiadirectaescritura' : [Number],
	'procedimientosdirectalectura' : [Number],
	'procedimientosdirectaescritura' : [Number],
	'entidadobjetodirectalectura' : [Number],
	'entidadobjetodirectaescritura' : [Number],
	 */
	function softCalculatePermiso(models, permiso) {
		const jerarquiamodel = models.jerarquia();
		const procedimientomodel = models.procedimiento();
		const entidadObjetomodel = models.entidadobjeto();

		const deferred = Q.defer();
		const recalculosPendientes = [];

		restauraModeloPermiso(models, permiso);

		permiso.jerarquialectura = [];
		permiso.jerarquiaescritura = [];
		permiso.procedimientoslectura = [];
		permiso.procedimientosescritura = [];
		permiso.entidadobjetolectura = [];
		permiso.entidadobjetoescritura = [];

		// comprobamos que cualquier permiso sobre procedimiento permite leer la jerarquia a que pertenece.
		const procedimientospermitidos = [].concat(permiso.procedimientosdirectalectura, permiso.procedimientosdirectaescritura);
		const entidadesobjetopermitidas = [].concat(permiso.entidadobjetodirectalectura, permiso.entidadobjetodirectaescritura);
		
		let restriccionProc = false;
		let restriccionEo = false;

		if (procedimientospermitidos.length > 0){
			restriccionProc = {'$or': [{'codigo': {'$in': procedimientospermitidos}}]};
		}

		if (entidadesobjetopermitidas.length > 0){
			restriccionEo = {'$or': [{'_id': {'$in': entidadesobjetopermitidas}}]};
		}

		// si el permiso es otorgado a un codigo de plaza...
		if (permiso.codplaza && permiso.codplaza !== '') {
			if (restriccionProc){
				restriccionProc.$or.push({'cod_plaza': permiso.codplaza});
			} else {
				restriccionProc = {'cod_plaza': permiso.codplaza};
			}
			if (restriccionEo){
				restriccionEo.$or.push({'responsable': permiso.codplaza});
			} else {
				restriccionEo = {'responsable': permiso.codplaza};
			}
		}

		if (restriccionProc){
			//buscamos los procedimientos cuyo responsable sea el del permiso
			const deferredProcedimiento = Q.defer();
			recalculosPendientes.push(deferredProcedimiento.promise);
			procedimientomodel.find(restriccionProc).select('idjerarquia cod_plaza codigo').lean().exec().then(function(procedimientos) {
				// para cada procedimiento cuyo responsable sea el del permiso dado, comprobamos que el permiso especifica tal relación, es decir, que
				// existe permisos explícito, y de no ser así se incluye. Esto significa establecer como permiso calculado de lectura y escritura.
				// siendo solo en el calculado, de cambiar el propietario del procedimiento, desaparecerá su permiso explícito en cuanto se alcancen las
				// labores de mantenimiento
				procedimientos.forEach(function (procedimiento) {
					permiso.jerarquialectura.push(procedimiento.idjerarquia);
					permiso.procedimientoslectura.push(String(procedimiento.codigo));
					
					if (permiso.procedimientosdirectaescritura.indexOf(String(procedimiento.codigo)) >= 0){
						permiso.procedimientosescritura.push(String(procedimiento.codigo));
					}
				});

				deferredProcedimiento.resolve();
			}, deferredProcedimiento.reject);
		}

		// idem para entidades objeto
		if (restriccionEo){
			const deferredEntidadObjeto = Q.defer();
			recalculosPendientes.push(deferredEntidadObjeto.promise);
			//buscamos los procedimientos cuyo responsable sea el del permiso
			entidadObjetomodel.find(restriccionEo).select('idjerarquia responsable _id').lean().exec().then(function(entidadesobjeto){
				// para cada entidadobjeto cuyo responsable sea el del permiso dado, comprobamos que el permiso especifica tal relación, es decir, que
				// existe permisos explícito, y de no ser así se incluye. Esto significa establecer como permiso calculado de lecutra y escritura.
				// siendo solo en el calculado, de cambiar el propietario del procedimiento, desaparecerá su permiso explícito en cuanto se alcancen las
				// labores de mantenimiento
				entidadesobjeto.forEach(function(entidadobjeto){
					permiso.jerarquialectura.push(entidadobjeto.idjerarquia);
					permiso.entidadobjetolectura.push(String(entidadobjeto._id));

					if (permiso.entidadobjetodirectaescritura.indexOf(String(entidadobjeto._id)) >= 0){
						permiso.entidadobjetoescritura.push(String(entidadobjeto._id));
					}
				});

				deferredEntidadObjeto.resolve();
			}, deferredEntidadObjeto.reject);
		}

		// para cada uno de los arrays de permisos calculados
		attrsjerarquia.forEach(function(attr, idx){
			// obtenemos el array de permisos directos del mismo tipo
			const idsjerarquia = permiso[attrsjerarquiaDirecto[idx]];
//console.log(idsjerarquia, attrsjerarquiaDirecto[idx])
			if (idsjerarquia && idsjerarquia.length === 0){

				return;
			}

			const def = Q.defer();
			// buscamos todas las jerarquías indicadas en el mismo
			// TODO: cachear esta ineficiente consulta, no es necesaria, puede obtenerse de una caché
			jerarquiamodel.find({'id': {'$in': idsjerarquia}}, {'id': true, 'descendientes': true}).lean().exec().then(function(jerarquias) {

				// para cada una de las jerarquías indicadas en el permiso, obtenemos los descendientes ya
				// se tendrán permisos no explícitos sobre dichas jerarquías. Añadimos a los arrays de
				// permisos calculados.
				jerarquias.forEach(function(jerarquia){
					permiso[attr].push(jerarquia.id);
					jerarquia.descendientes.forEach(function(idjerarquia) {
						permiso[attr].push(idjerarquia);
					});
				});

				def.resolve();
			}, def.reject);

			recalculosPendientes.push(def.promise);
		});

		Q.all(recalculosPendientes).then(function(){
			const defs2 = [];
			attrsjerarquia.forEach(function (attr, idx){
				const idsjerarquia = permiso[attrsjerarquia[idx]];
				const attrProcedimiento = attrprocedimientos[idx];
				const attrEo = attrentidadesobjeto[idx];
				if (idsjerarquia && idsjerarquia.length === 0){

					return;
				}

				const dP = Q.defer();
				const dE = Q.defer();

				require('uniq')(idsjerarquia);

				/* TODO: cachear esto */
				procedimientomodel.find({'idjerarquia': {'$in': idsjerarquia}}, {'codigo': true}, updatePermisoAttr(dP, attrProcedimiento, 'codigo', permiso));
				entidadObjetomodel.find({'idjerarquia': {'$in': idsjerarquia}}, {'_id': true}, updatePermisoAttr(dE, attrEo, '_id', permiso));

				defs2.push(dP.promise);
				defs2.push(dE.promise);
			});

			Q.all(defs2).then(function(){
				restauraModeloPermiso(models, permiso);
				deferred.resolve(permiso);
			}).fail(deferred.reject);

		}).fail(deferred.reject);

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
				const jerarquias = api.getAncestros(idjerarquia);
				jerarquias.unshift(api.getJerarquiaById(idjerarquia));
				jerarquias.sort(function (j1, j2) {
					return j2.ancestros.length - j1.ancestros.length;
				});
				deferredJerarquia.resolve(jerarquias);
			} else {
				jerarquiamodel.findOne({'id': idjerarquia}).exec().then(function(jerarquia){
					if (!jerarquia) {
						deferred.resolve([]);

						return;
					}

					jerarquiamodel.find({'id': {'$in': jerarquia.ancestros}}, function (id, js) {
						let jerarquias = [jerarquia];
						if (js.length > 0){
							jerarquias = jerarquias.concat(js);
						}
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
			deferredPersona = personamodel.find({'codplaza': procedimiento.cod_plaza}).lean().exec();
		} else {
			deferredPersona = Q.all([]);
		}

		Q.all([deferredJerarquia.promise, deferredPersona]).then(function(datos){

			procedimiento.ancestros = datos[0];//jerarquias;
			procedimiento.responsables = datos[1];//personas;
			for (let i = 1; i <= 5; i += 1) {
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
		}).fail(deferred.reject);

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
			if (typeof procedimiento.periodos[periodo] !== 'object' || typeof procedimiento.periodos[periodo].resueltos_1 === 'undefined'){
				continue;
			}
			

			for (const campo in campos) {
				if (Array.isArray(procedimiento.periodos[periodo][campo]) && procedimiento.periodos[periodo][campo].length < 12){
					while (procedimiento.periodos[periodo][campo].length < 12){
						procedimiento.periodos[periodo][campo].push(0);
					}
				}
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
					if (proced.codigo){
						versionsToSave.push(proced);
						proced.markModified('periodos');
						proced.save(function(error){
							if (error) {
								informes.push({'codigo': proced.codigo, 'status': 500});
								promise.reject(error);
							} else {
								informes.push({'codigo': proced.codigo, 'status': 200});
								promise.resolve();
							}
						});
					} else {
						informes.push({'codigo': proced, 'status': 500});
						promise.reject(proced);
					}
				}).fail(function(err){
					informes.push({'codigo': proc, 'status': 500});
					promise.reject(err);
				});
			}).fail(function(err){
				informes.push({'codigo': proccodigo, 'status': 500});
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
				}).fail(function(erro){
					erro.informes = informes;
					deferred.reject(erro);
				});
			}).fail(function(err){
				err.informes = informes;
				deferred.reject(err);
			});
		}, deferred.reject);

		return deferred.promise;
	}

	function recalculatePermiso(models){
		return function(permiso){
			const deferred = Q.defer();

			if (typeof permiso.login === 'string' && permiso.login === '' && typeof permiso.codplaza === 'string' && permiso.codplaza === ''){
				permiso.remove(deferred.makeNodeResolver());
			} else {
				softCalculatePermiso(models, permiso).then(function(perm){
					perm.save(function(error) {
						if (error){
							deferred.reject(error);
						} else {
							deferred.resolve({'codigo': perm._id, 'status': 200, 'permiso': perm});
						}
					});
				}).fail(deferred.reject);
			}

			return deferred.promise;
		};
	}

	function fullSyncpermiso(models) {
		const deferred = Q.defer(),
			permisomodel = models.permiso();
		/**** PARCHE PARA HABILITAR A LAS PERSONAS CON ALGÚN PERMISO ***/
		//habilitaPersonasConPermisos(personamodel, permiso);
		/**** FIN PARCHE ***/
		permisomodel.find({}).exec().then(function(permisos){
			const recPermisoFn = recalculatePermiso(models);
			Q.all(permisos.map(recPermisoFn)).then(deferred.resolve).fail(deferred.reject);
		}).fail(deferred.reject);

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

					for (let k = 0, l = mapeadoArray[String(idjerarquia)].ancestros.length; k < l; k += 1){
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

		jerarquiamodel.find({}).exec().then(function(jerarquias){

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

				if (typeof mapeadoArray[String(id)] === 'object' && typeof mapeadoArray[String(id)].numprocedimientos === 'number' ){
					mapeadoArray[String(id)].numprocedimientos = 0;
					mapeadoArray[String(id)].numcartas = 0;
				}
			}


			let maxiteraciones = ids.length;
			let cambio = 1;
			while (cambio && maxiteraciones--){
				cambio = 0;
				for (let i = 0, j = ids.length; i < j; i += 1) {
					let cambiointerno = 1;
					const id = ids[i],
						nodo = mapeadoArray[String(id)];
					while (cambiointerno) {
						cambiointerno = 0;
						//para todos mis ancestros
						for (let k = 0; k < nodo.ancestros.length; k += 1) {
							const ancestroid = nodo.ancestros[k];
							if (typeof mapeadoArray[String(ancestroid)] === 'undefined') {
								logger.error(ancestroid + ' no existe en 35');
								continue;
							}
							//busco si estoy entre sus descendientes
							if (mapeadoArray[String(ancestroid)].descendientes.indexOf(id) < 0) {
								cambio += 1;
								cambiointerno += 1;
								mapeadoArray[String(ancestroid)].descendientes.push(id);
							}

							//busco si mis descendientes están entre sus descendientes
							for (let l = 0; l < nodo.descendientes.length; l += 1) {
								const descendienteid = nodo.descendientes[l];
								if (mapeadoArray[String(ancestroid)].descendientes.indexOf(descendienteid) < 0) {
									cambio += 1;
									cambiointerno += 1;
									mapeadoArray[String(ancestroid)].descendientes.push(descendienteid);
								}
							}
						}

						//para todos mis descendientes
						for (let k = 0; k < nodo.descendientes.length; k += 1) {
							const descendienteid = nodo.descendientes[k];
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
							for (let l = 0; l < nodo.ancestros.length; l += 1) {
								const ancestroid = nodo.ancestros[l];
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


			//definir función genérica, que sirva tanto para numprocedimientos como para numcartas
			//campo: ['numprocedimientos', 'numcartas']
			
			const deferNumProcedimientos = Q.defer(),
				deferNumCartas = Q.defer();

			//cuarto lanzar el cálculo del número de procedimientos y cartas asignado/as directamente a cada jerarquia:
			const matchProcedimiento = {
				'$and': [
					{
						'$or': [
							{'oculto': {'$exists': false}},
							{
								'$and': [
									{'oculto': {'$exists': true}},
									{'oculto': false}
								]
							}
						]
					},
					{
						'$or': [
							{'eliminado': {'$exists': false}},
							{
								'$and': [
									{'eliminado': {'$exists': true}},
									{'eliminado': false}
								]
							}
						]
					}
				]
			};


			procedimientomodel.aggregate([{'$match': matchProcedimiento}, {'$group': {'_id': '$idjerarquia', 'count': {'$sum': 1}}}, {'$sort': {'_id': 1}}], fnActualizacion('numprocedimientos', deferNumProcedimientos, true, mapeadoArray));
			cartamodel.aggregate([{'$match': {'tipoentidad': 'CS'}}, {'$group': {'_id': '$idjerarquia', 'count': {'$sum': 1}}}, {'$sort': {'_id': 1}}], fnActualizacion('numcartas', deferNumCartas, false, mapeadoArray));

			//quinto esperar resultados y devolverlos
			Q.all([deferNumProcedimientos.promise, deferNumCartas.promise]).then(function(){

				for (const id in mapeadoArray){
					if (typeof mapeadoArray[String(id)] === 'object'){
						mapeadoArray[String(id)].save(reportError); /* posible condición de carrera por no esperar */
					}
				}
				deferred.resolve(mapeadoArray);
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
	module.exports.restauraModeloPermiso = restauraModeloPermiso;
	module.exports.softCalculatePermiso = softCalculatePermiso;
	module.exports.softCalculateProcedimiento = softCalculateProcedimiento;
	module.exports.softCalculateProcedimientoCache = softCalculateProcedimientoCache;
	
})(module, console);
