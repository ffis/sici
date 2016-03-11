(function(log){
	'use strict';

	var fs = require('fs'),
		path = require('path'),
		mongoose = require('mongoose'),
		Docxtemplater = require('docxtemplater'),
		Q = require('q'),
		//carta = require('./data/carta.json'),
		jerarquias = require('./data/jerarquias.json'),
		config = require('./config.json'),
		models = require('./api/models'),
		expressions = require('angular-expressions'),
		angularParser = function(tag){
			var expr = expressions.compile(tag);
			return {get: expr};
		}, indicadores = {}, anualidad = 2015;


	var mongosrv = process.env.MONGOSVR || config.mongodb.connectionString;

	var db = mongoose.connect(mongosrv);
	models.init(mongoose);

	var entidadobjetomodel = models.entidadobjeto(),
		objetivomodel = models.objetivo(),
		indicadormodel = models.indicador(),
		ObjectId = mongoose.Types.ObjectId;



	function pushIndicador(indicador){
		indicadores[indicador] = false;
	}

	var FILE = 'FILE';

	function generateDocx(params, outputtype, filename){
		var content = fs.readFileSync( path.join(__dirname, 'data', 'carta-template.docx'), 'binary'),
			doc = new Docxtemplater(content);

		//set the templateVariables
		doc.setOptions({parser: angularParser});
		doc.setData(params);

		try{
			doc.render();
			var buf = doc.getZip().generate({type: 'nodebuffer'});
			if (outputtype === FILE){
				fs.writeFileSync(path.join(__dirname, 'data', filename), buf);
			}
		}catch (err){
			log.error(err);
		}
	}

	function toFixedIfNeeds2(n){
		if (n === +n && n !== (n|0) ){
			return n.toFixed(2);
		}
		return n;
	}

	function addMonthInfo(obj, arr, prefix){
		var months = ['enero', 'febrero', 'marzo',
			'abril', 'mayo', 'junio',
			'julio', 'agosto', 'septiembre',
			'octubre', 'noviembre', 'diciembre', 'total'];
		for(var i = 0, j = months.length; i < j; i++){
			if (!arr[i]){
				obj[ prefix + months[i] ] = '';
			}else if (arr[i] && typeof arr[i] === 'object'){
				obj[ prefix + months[i] ] = arr[i].resultado ? toFixedIfNeeds2(arr[i].resultado) : '';
			}else if (arr[i]){
				obj[ prefix + months[i] ] = toFixedIfNeeds2(arr[i]);
			}else{
				obj[ prefix + months[i] ] = '';
			}
		}
		return obj;
	}

	function transformarFormulas(formulas){
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

	function transformarObjetivos(objetivos){
		var o = [],
			i, j;
		for(i = 0, j = objetivos.length; i < j; i++){
			o.push({
				index: objetivos[i].index,
				denominacion: objetivos[i].denominacion,
				formulas: transformarFormulas(objetivos[i].formulas),
			});
		}
		return o;
	}

	function loadIndicador(_id){
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

	function loadIndicadores(){
		var promises = [];
		for(var ind in indicadores){
			promises.push(loadIndicador(ind));
		}
		return Q.all(promises);
	}

	function getIndicador(id, indicadorescargados){
		for(var i = 0, j = indicadorescargados.length; i < j; i++){
			if ((indicadorescargados[i]._id + '') == (id + '')){
				return indicadorescargados[i];
			}
		}
		log.error('no he encontrado:', id );
		return null;
	}

	function incluirIndicadores(objetivos, indicadorescargados){
		for(var i = 0, j = objetivos.length; i < j; i++){
			for(var k = 0, l = objetivos[i].formulas.length; k < l; k++){
				for(var q = 0, w = objetivos[i].formulas[k].indicadores.length; q < w; q++){
					objetivos[i].formulas[k].indicadores[q] = getIndicador( objetivos[i].formulas[k].indicadores[q], indicadorescargados );
					objetivos[i].formulas[k].indicadores[q] = addMonthInfo(objetivos[i].formulas[k].indicadores[q],
							objetivos[i].formulas[k].indicadores[q].valores['a' + anualidad], '');
				}
			}
		}
		return objetivos;
	}

	var restriccion = { eliminado: false, tipoentidad: 'CS' };
	if (typeof process.argv[2] !== 'undefined'){
		restriccion.idjerarquia = parseInt(process.argv[2]);
	}

	entidadobjetomodel.findOne(restriccion).exec().then(function(carta){
		objetivomodel.find({carta: carta._id }).exec().then(function(objetivos){
			objetivos = transformarObjetivos(objetivos);
			loadIndicadores().then(function(indicadorescargados){
				var params = {
					'cartaservicio': carta,
					'anualidad': anualidad,
					'jerarquias': jerarquias,
					'objetivos': incluirIndicadores(objetivos, indicadorescargados)
				};

				//log.log(params.objetivos[0].formulas[0]);

				db.disconnect();
				generateDocx(params, FILE, 'carta-output.docx');
			});
		}, function(error){
			log.error(error);
			db.disconnect();
		});

	}, function(err){
		log.error(err);
		db.disconnect();
	});

})(console);
