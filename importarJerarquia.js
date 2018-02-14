
(function(module, require, logger){
	'use strict';

	const fs = require('fs'),
		path = require('path'),
		assert = require('assert'),
		csvparse = require('csv-parse'),
		parser = csvparse({delimiter: ';', columns: true, rtrim: true}),
		mongoose = require('mongoose'),
		Q = require('q'),
		config = require('./config.json'),
		models = require('./api/models');

	const registros = [];

	mongoose.set('debug', false);
	mongoose.Promise = require('q').Promise;
	mongoose.connect(config.mongodb.connectionString);
	models.init(mongoose);

	function checkRegistroNumerico(registro, campo){
		/* excepcion */
		if (campo === 'ancestrodirecto' && registro.id == '1'){

			return true;
		}

		return registro[campo] && parseInt(registro[campo], 10) == registro[campo];
	}

	function checkRegistroString(registro, campo){

		return registro[campo] && registro[campo] !== '';
	}

	function runTests(idsjerarquias){
		assert( registros.length > 0, 'Debe cargar algún registro.');
		registros.forEach(function(registro, i){
			assert( checkRegistroNumerico(registro, 'id'), 'El campo id debe existir y ser numérico. Línea:' + (i + 1) + ' ' + JSON.stringify(registro));
			assert( checkRegistroNumerico(registro, 'ancestrodirecto'), 'El campo ancestrodirecto debe existir y ser numérico. Línea:' + (i + 1) + ' ' + JSON.stringify(registro));
			assert( checkRegistroString(registro, 'nombre'), 'El campo nombre debe existir y ser texto. Línea:' + (i + 1) + ' ' + JSON.stringify(registro));
			assert( checkRegistroString(registro, 'nombrelargo'), 'El campo nombre largo debe existir y ser texto. Línea:' + (i + 1) + ' ' + JSON.stringify(registro));
			assert( checkRegistroString(registro, 'inicialestipo'), 'El campo inicialestipo debe existir y ser texto. Línea:' + (i + 1) + ' ' + JSON.stringify(registro));
			assert( checkRegistroString(registro, 'tipo'), 'El campo tipo debe existir y ser texto. Línea:' + (i + 1) + ' ' + JSON.stringify(registro));
		});

		const registrosXId = registros.reduce(function(prev, registro){
			prev[registro.id] = registro;

			return prev;
		}, {});

		registros.forEach(function(registro, i){
			const ancestrodirecto = registro.ancestrodirecto;
			if (ancestrodirecto){
				assert(typeof registrosXId[ancestrodirecto] === 'object', 'El campo ancestrodirecto debe existir entre los importados. Línea:' + (i + 1));
			}
		});

		for (let i = 0, j = idsjerarquias; i < j; i += 1){
			const jerarquiausadaEnProcedimiento = idsjerarquias[i];
			assert(typeof registrosXId[jerarquiausadaEnProcedimiento] === 'object', 'La jerarquia con id: ' + jerarquiausadaEnProcedimiento + ' no existe y es necesaria');
		}

		logger.log('Tests OK');

		return true;
	}

	function transformar(){
		for (let i = 0, j = registros.length; i < j; i += 1){
			registros[i].id = parseInt(registros[i].id, 10);
			registros[i].ancestrodirecto = registros[i].ancestrodirecto ? parseInt(registros[i].ancestrodirecto, 10) : null;
			registros[i].numprocedimientos = 0;
			registros[i].descendientes = [];
			registros[i].ancestros = [];
			Reflect.deleteProperty(registros[i], 'nivelsici');
		}
	}

	function volcarJSON(){
		fs.writeFile(path.join(__dirname, 'data', 'output.json'), JSON.stringify(registros), function(){
			logger.log('Fichero volcado con éxito en: ' + path.join(__dirname, 'data', 'output.json'));
			logger.log('Pasos:');
			logger.log("\tmongodump -h mongosvr --db sici -c jerarquia");
			logger.log("\tmongoimport --host mongosvr --db sici --collection jerarquia --file data/output.json --jsonArray --drop");
			logger.log("\tmongo mongosvr/sici --eval 'db.jerarquia.update({id:1}, {$set: {ancestrodirecto : null}});'");
			logger.log('En caso de crisis:');
			logger.log("\tmongorestore --db sici -c jerarquia -h mongosvr --drop dump/sici/jerarquia.bson");
		});
	}

	parser.on('readable', function(){
		const record = parser.read();
		if (record){
			registros.push(record);
		}
	});
	parser.on('error', function(err){
		logger.error(err);
	});
	parser.on('finish', function(){
		logger.log(registros.length + ' elementos leídos en el fichero origen de datos');
		const procedimientomodel = models.procedimiento();
		const entidadobjetomodel = models.entidadobjeto();

		Q.all([procedimientomodel.distinct('idjerarquia'), entidadobjetomodel.distinct('idjerarquia')]).then(function(arrIdsjerarquias){
			const idsjerarquias = require('uniq')(arrIdsjerarquias.reduce(function(p, c){ return p.concat(c); }, []));

			logger.log(idsjerarquias.length + ' jerarquias usadas en procedimientos y cartas');

			mongoose.disconnect();
			logger.log('Running tests');
			try {
				runTests(idsjerarquias);
				transformar();
				volcarJSON();
			} catch (excepcion) {
				logger.error(excepcion);
			}
		}, function(err){
			logger.error('Error al conectarse con la base de datos', err);
			mongoose.disconnect();
		});
	});

	const input = fs.createReadStream(path.join(__dirname, 'data', 'organica.csv'));
	input.pipe(parser);

})(module, require, console);
