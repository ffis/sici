(function(module, log){
	'use strict';

	var path = require('path'),
		fs = require('fs'),
		Q = require('q'),
		Docxtemplater = require('docxtemplater'),
		Imagedocx = require('docxtemplater-image-module'),
		expressions = require('angular-expressions'),
		angularParser = function(tag){
			var expr = expressions.compile(tag);
			return {get: expr};
		};

	var indicadores = {};

	// configuración generador gauges
	var  imgopts = {};
	imgopts.centered = false;
	imgopts.getImage = function(tagValue, tagName) {
		console.log('OBTENIENDO IMAGEN '+tagValue);
		// el tagName contendrá el id del objetivo y el id de la fórmula
		var result = fs.readFileSync(tagValue,'binary');

		console.log('OBTENIENDO IMAGEN 2');
		return result;
	};
	imgopts.getSize=function(img,tagValue, tagName) {
    	return [150,150];
	};
	var imagedocx = new Imagedocx(imgopts);
	// fin configuracion generador gauges


	function pushIndicador(indicador){
		indicadores[indicador] = false;
	}

	var FILE = 'FILE',
		BUFFER = 'BUFFER';

	function generateDocx(app, params, outputtype, outputparams, cb){
		var content = fs.readFileSync( path.join(__dirname, '..', 'data', 'carta-template.docx'), 'binary'),
			doc = new Docxtemplater(),
			buf, filename,
			pathdir = app.get('prefixtmp');
		//set the templateVariables
		//params.imagen  = './data/gauge.png';
		doc.attachModule(imagedocx)
			.load(content)
			.setOptions({parser: angularParser})
			.setData(params);
		try {
			console.log('PASO 5');
			doc.render();
			console.log('PASO 6');
			if (outputtype === FILE){

				buf = doc.getZip().generate({type: 'nodebuffer'});
				filename = path.join(pathdir, outputparams);
				log.log(filename);
				fs.writeFileSync(filename, buf);
				cb(null, 'ok');
			} else if (outputtype === BUFFER){

				buf = doc.getZip().generate({type: 'nodebuffer'});
				filename = path.join(pathdir, outputparams);
				log.log(filename);
				fs.writeFileSync(filename, buf);
				cb(null, filename);
			}else {
				cb('outputerror');
			}
		} catch (err) {
			log.error(err);
			cb(err);
		}
	}

	function toFixedIfNeeds2(n){
		if (n === +n && n !== (n | 0) ){
			return n.toFixed(2);
		}
		return n;
	}

	function addMonthInfo(obj, arr, prefix){
		var months = ['enero', 'febrero', 'marzo',
			'abril', 'mayo', 'junio',
			'julio', 'agosto', 'septiembre',
			'octubre', 'noviembre', 'diciembre', 'total'];
		for (var i = 0, j = months.length; i < j; i++){
			if (!arr[i]) {
				obj[ prefix + months[i] ] = '';
			} else if (arr[i] && typeof arr[i] === 'object') {
				obj[ prefix + months[i] ] = arr[i].resultado ? toFixedIfNeeds2(arr[i].resultado) : '';
			} else if (arr[i]) {
				obj[ prefix + months[i] ] = toFixedIfNeeds2(arr[i]);
			} else {
				obj[ prefix + months[i] ] = '';
			}
		}
		return obj;
	}

	function transformarFormulas(formulas, anualidad){
		var arr = [], i, j, k, l;
		for (i = 0, j = formulas.length; i < j; i++){
			var obj = {
				human: formulas[i].human,
				computer: formulas[i].computer,
				anualidad: anualidad,
				indicadores: formulas[i].indicadores,
				imagen: './data/gauge.png' //aquí compondré el nombre del gauge incluyendo las codobjetivo y el index de la formula
			};
			obj = addMonthInfo(obj, formulas[i].valores['a' + anualidad], 'v_');
			arr.push(obj);

			for (k = 0, l = formulas[i].indicadores.length; k < l; k++){
				pushIndicador(formulas[i].indicadores[k]);
			}

		}
		return arr;
	}

	function transformarObjetivos(objetivos, anualidad){
		var o = [],
			i, j;
		for (i = 0, j = objetivos.length; i < j; i++){
			o.push({
				index: objetivos[i].index,
				denominacion: objetivos[i].denominacion,
				formulas: transformarFormulas(objetivos[i].formulas, anualidad)
			});
		}
		return o;
	}

	function loadIndicador(_id, indicadormodel, ObjectId){
		var q = Q.defer();
		indicadormodel
			.findOne({_id: ObjectId(_id) })
			.exec().then(function(ind){
				q.resolve(ind);
			}, function(err){
				q.reject(err);
			});
		return q.promise;
	}

	function loadPlan(planmodel, accionmodel, personamodel, organicamodel, carta){
		var q = Q.defer();
		return planmodel.findOne({'carta': carta._id}).exec().then(function(plan){
			accionmodel.find({'plan':plan._id}).exec().then(function(acciones){
				var qacciones = [];
				// a todas las acciones les añadimos su equipo. Lo insertamos en el mismo sitio "equipo"
				acciones.forEach(function(accion, index){
					var qaccion = Q.defer();

					var qequi = Q.defer();
					var qres = Q.defer();
					var qpro = Q.defer();
					var qorg = Q.defer();

					qacciones.push(qaccion.promise());
					if (typeof accion.equipo !== 'undefined'){
						var pequipo = [];
						// para que id perteneciente a una persona del equipo, lo cargamos (añadimos a las promeasas)
						accion.equipo.forEach(function(persona, index){
							pequipo.push(loadPersona(personamodel, persona));
						});
						// cuando se carguen todas las personas del equipo, sustituimos el array viejo por el nuevo
						// que contiene un array de objetos de tipo persona
						Q.all(pequipo).then(function(personas){
							qequi.resolve(personas);
						/// ERROR CARGANDO PERSONAS
						}, function(err){
							qequi.reject(err);
						});

					} else {
						equi.resolve([]);
					}
					// cargamos el responsable
					if (typeof accion.responsable !== 'undefined'){
						loadPersona(personamodel,  accion.responsable).then(function(responsable){
							qres.resolve(responsable);
						},function(err){
							qres.reject(err);
						});
					}else {
						qres.resolve();
					}
					// cargamos el promotor
					if (typeof accion.promotor !== 'undefined'){
						loadPersona(personamodel,  accion.promotor).then(function(promotor){
							qpro.resolve(promotor);
						},function(err){
							qpro.reject(err);
						});
					}else {
						qpro.resolve();
					}
					// cargamos la organica
					if (typeof accion.organica !== 'undefined'){
						loadOrganica(organicamodel, accion.organica).then(function(organica){
							qorg.resolve(organica);
						}, function(err){
							qorg.reject(err);
						})
					}else{
						qorg.resolve();
					}
					// esperamos las subcargas y devolvemos la accion
					Q.all([qequi.promise, qres.promise, qpro.promise, qorg.promise]).then(function(data){
						if (data[0]) accion.equipo = data[0]
						if (data[1]) accion.responsable = data[1];
						if (data[2]) accion.promotor = data[2];
						if (data[3]) accion.organica = data[3];
						qaccion.resolve(accion);
					},function(err){
						qaccion.reject(err);
					});

				});
				// esperamos que se hayan calculado todas las acciones y sus equipos,y con ellos cargados
				// resolvemos, las acciones. Actualizamos el plan con ellas y ya lo tenemos listo para devolver
				Q.all(qacciones).then(function(acciones){
					plan.acciones = acciones;
					q.resolve(plan);
				/// ERRROR ESPERANDO ACCIONES
				}, function(err){
					q.reject(err);
				});
			//// ERROR CARGANDO ACCIONES
			}, function(err){
				q.reject(err);
			});
		//// ERROR CARGANDO EL PLAN
		}, function(err){
			q.reject(err);
		});

		return q.promise;
	}

	function loadPersona(personamodel, _id){
		var q = Q.defer();
		personamodel
		.findOne({'_id':id})
		.exec().then(function (persona){
			q.resolve(persona);
		}, function(err){
			q.reject(err);
		})
		return q.promise;
	}

	function loadOrganica(organicamodel, idjerarquia){
		var q = Q.defer();
		organicamodel.
		findOne({'id':idjerarquia})
		.exec().then(function (organica){
			q.resolve(organica);
		}, function(err){
			q.reject(err);
		})
		return q.promise;
	}

	function loadIndicadores(indicadormodel, ObjectId){
		var promises = [];
		for (var ind in indicadores){
			promises.push(loadIndicador(ind, indicadormodel, ObjectId));
		}
		return Q.all(promises);
	}

	function getIndicador(id, indicadorescargados){
		for (var i = 0, j = indicadorescargados.length; i < j; i++){
			if ((indicadorescargados[i]._id + '') === (id + '')){
				return indicadorescargados[i];
			}
		}
		log.error('no he encontrado:', id );
		return null;
	}

	function getObservaciones(indicador, anualidad){
		var months = ['enero', 'febrero', 'marzo',
			'abril', 'mayo', 'junio',
			'julio', 'agosto', 'septiembre',
			'octubre', 'noviembre', 'diciembre'];
		observaciones = [];
		if (typeof indicador.observaciones !== 'undefined' && typeof indicador.observaciones['a'+anualidad] !== 'undefined') {
			for(var i=0;i<12;i++){
				if (indicador.observaciones['a'+anualidad][i]!=='')
					observaciones.push();
			}
		}
	}

	function incluirIndicadores(objetivos, indicadorescargados, anualidad){
		for (var i = 0, j = objetivos.length; i < j; i++){
			for (var k = 0, l = objetivos[i].formulas.length; k < l; k++){
				objetivos[i].formulas[k].observaciones = [];
				for (var q = 0, w = objetivos[i].formulas[k].indicadores.length; q < w; q++){
					objetivos[i].formulas[k].indicadores[q] = getIndicador( objetivos[i].formulas[k].indicadores[q], indicadorescargados );
					objetivos[i].formulas[k].indicadores[q] = addMonthInfo(objetivos[i].formulas[k].indicadores[q],
							objetivos[i].formulas[k].indicadores[q].valores['a' + anualidad], '');
					var observaciones_indicador = getObservaciones(objetivos[i].formulas[k].indicadores[q]);
				}
			}
		}
		return objetivos;
	}

	module.exports.generate = function(app, cfg, md5, models, ObjectId){

		return function(req, res){
			var entidadobjetomodel = models.entidadobjeto(),
				objetivomodel = models.objetivo(),
				indicadormodel = models.indicador(),
				jerarquiasmodel = models.jerarquia(),
				planmodel = models.planmejora(),
				accionmodel = models.accionmejora(),
				personamodel = models.persona();

			var anualidad = req.params.anualidad ? parseInt(req.params.anualidad) : 2015;
			var restriccion = { eliminado: false, tipoentidad: 'CS' };
			if (typeof req.params.id !== 'undefined'){
				restriccion._id = ObjectId(req.params.id);
			}

			var ordenarJerarquias = function(jerarquia, jerarquias){
				var returnValue = [], i, l;
				console.log(jerarquias.length, jerarquia.ancestros)
				for (i = jerarquia.ancestros.length - 1; i >= 0; i--){
					for (l = 0; l < jerarquias.length; l++){
						if (jerarquias[l].id === jerarquia.ancestros[i]){
							returnValue.push(jerarquias[l]);
						}
					}
				}
				returnValue.push(jerarquia);
				console.log(returnValue);
				return returnValue;
			};


			entidadobjetomodel.findOne(restriccion).exec().then(function(carta){
				if (!carta){
					res.status(500).json({'error': 'An error has occurred', details: 'Carta no encontrada'});
				} else {
					jerarquiasmodel.findOne({id: carta.idjerarquia}).exec().then(function(jerarquia){
						var ancestrosids = jerarquia.ancestros;
						jerarquiasmodel.find({id: {$in: ancestrosids }}, {id: 1, nombrelargo: 1}).exec().then(function(jerarquiascargadas){

							var jerarquias = ordenarJerarquias(jerarquia, jerarquiascargadas);
							objetivomodel.find({carta: carta._id }).sort({index: 1}).exec().then(function(objetivos){
								objetivos = transformarObjetivos(objetivos, anualidad);
								var promises = [
									loadIndicadores(indicadormodel, ObjectId),
									loadPlan(planmodel, accionmodel, personamodel, jerarquiamodel, carta)
								];
								Q.all(promises).then(function(data){
									var indicadorescargados = data[0];
									var plancargado = data[1];

									var params = {
										'cartaservicio': carta,
										'anualidad': anualidad,
										'jerarquias': jerarquias,
										'objetivos': incluirIndicadores(objetivos, indicadorescargados, anualidad),
										'plan': incluirPlan(plancargado), /* este no existe ahora*/
										'imagen':'./data/gauge.png'
									};

									var time = new Date().getTime();
									generateDocx(app, params, FILE, time + '.docx', function(err){
										if (err){
											res.status(500).json({'error': 'An error has occurred', details: err});
										} else {
											res.json({'time': time, 'hash': md5(cfg.downloadhashprefix + time), 'extension': '.docx'});
										}
									});
								}, function(err){
									res.status(500).json({'error': 'An error has occurred', details: err});
								});
							}, function(err){
								res.status(500).json({'error': 'An error has occurred', details: err});
							});
						}, function(err){
							res.status(500).json({'error': 'An error has occurred', details: err});
						});
					});
				}
			}, function(err){
				res.status(500).json({'error': 'An error has occurred', details: err});
			});
		};
	};

})(module, console);