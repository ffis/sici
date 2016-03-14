(function(module, log){
	'use strict';

	var path = require('path'),
		fs = require('fs'),
		Q = require('q'),
		Docxtemplater = require('docxtemplater'),
		expressions = require('angular-expressions'),
		angularParser = function(tag){
			var expr = expressions.compile(tag);
			return {get: expr};
		};

	var indicadores = {};


	function pushIndicador(indicador){
		indicadores[indicador] = false;
	}

	var FILE = 'FILE',
		BUFFER = 'BUFFER';

	function generateDocx(app, params, outputtype, outputparams, cb){
		var content = fs.readFileSync( path.join(__dirname, '..', 'data', 'carta-template.docx'), 'binary'),
			doc = new Docxtemplater(content),
			buf, filename,
			pathdir = app.get('prefixtmp');
		//set the templateVariables
		doc.setOptions({parser: angularParser});
		doc.setData(params);

		try {
			doc.render();
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
				indicadores: formulas[i].indicadores
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

	function incluirIndicadores(objetivos, indicadorescargados, anualidad){
		for (var i = 0, j = objetivos.length; i < j; i++){
			for (var k = 0, l = objetivos[i].formulas.length; k < l; k++){
				for (var q = 0, w = objetivos[i].formulas[k].indicadores.length; q < w; q++){
					objetivos[i].formulas[k].indicadores[q] = getIndicador( objetivos[i].formulas[k].indicadores[q], indicadorescargados );
					objetivos[i].formulas[k].indicadores[q] = addMonthInfo(objetivos[i].formulas[k].indicadores[q],
							objetivos[i].formulas[k].indicadores[q].valores['a' + anualidad], '');
				}
			}
		}
		return objetivos;
	}

	module.exports.generate = function(app, cfg, md5, models, ObjectId){

		return function(req, res){
			var entidadobjetomodel = models.entidadobjeto(),
				objetivomodel = models.objetivo(),
				indicadormodel = models.indicador();

			var anualidad = req.params.anualidad ? parseInt(req.params.anualidad) : 2015;
			var restriccion = { eliminado: false, tipoentidad: 'CS' };
			if (typeof req.params.id !== 'undefined'){
				restriccion._id = ObjectId(req.params.id);
			}

			entidadobjetomodel.findOne(restriccion).exec().then(function(carta){
				objetivomodel.find({carta: carta._id }).sort({index: 1}).exec().then(function(objetivos){
					objetivos = transformarObjetivos(objetivos, anualidad);
					loadIndicadores(indicadormodel, ObjectId).then(function(indicadorescargados){
						var params = {
							'cartaservicio': carta,
							'anualidad': anualidad,
							'jerarquias': [],
							'objetivos': incluirIndicadores(objetivos, indicadorescargados, anualidad)
						};

						var time = new Date().getTime();
						generateDocx(app, params, FILE, time + '.docx', function(err){
							if (err){
								res.status(500).json({'error': 'An error has occurred', details: err});
							} else {
								res.json({'time': time, 'hash': md5(cfg.downloadhashprefix + time), 'extension': '.docx'});
							}
						});
					});
				}, function(err){
					res.status(500).json({'error': 'An error has occurred', details: err});
				});

			}, function(err){
				res.status(500).json({'error': 'An error has occurred', details: err});
			});
		};
	};

})(module, console);