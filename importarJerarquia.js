
(function(module, require){
	'use strict';

	var fs = require('fs'),
		path = require('path'),
		assert = require('assert'),
		csvparse = require('csv-parse'),
		parser = csvparse({delimiter: ','});

	var campos = [], registros = [];

	function checkRegistroNumerico(registro, campo){
		/* excepcion */
		if (campo === 'ancestrodirecto' && registro.id == "1"){
			return true;
		}

		if (!registro[campo]){
			return false;
		}
		return parseInt(registro[campo]) == registro[campo];
	}

	function checkRegistroString(registro, campo){
		if (!registro[campo]){
			return false;
		}
		return registro[campo] !== '';
	}

	function run_tests(){

		for(var i = 0, j = registros.length; i < j; i++){
			assert( checkRegistroNumerico(registros[i], 'id'), 'El campo ID debe existir y ser numérico. Línea:' + (i + 1));
			assert( checkRegistroNumerico(registros[i], 'ancestrodirecto'), 'El campo ancestrodirecto debe existir y ser numérico. Línea:' + (i + 1));
			assert( checkRegistroString(registros[i], 'nombre'), 'El campo nombre debe existir y ser texto. Línea:' + (i + 1));
			assert( checkRegistroString(registros[i], 'nombrelargo'), 'El campo nombre largo debe existir y ser texto. Línea:' + (i + 1));
			assert( checkRegistroString(registros[i], 'inicialestipo'), 'El campo inicialestipo debe existir y ser texto. Línea:' + (i + 1));
			assert( checkRegistroString(registros[i], 'tipo'), 'El campo tipo debe existir y ser texto. Línea:' + (i + 1));
		}

		//comprobar que existen todos
		var registrosXId = {};
		for(var i = 0, j = registros.length; i < j; i++){
			registrosXId[ registros[i].id ] = registros[i];
		}

		for(var i = 0, j = registros.length; i < j; i++){
			var ancestrodirecto = registros[i].ancestrodirecto;
			if (ancestrodirecto){
				assert(typeof registrosXId[ ancestrodirecto ] === 'object', 'El campo ancestrodirecto debe existir entre los importados. Línea:' + (i + 1));
			}
		}

		console.log('Tests OK');
		return true;
	}



	function transformar(){
		for(var i = 0, j = registros.length; i < j; i++){
			registros[i].id = parseInt(registros[i].id);
			registros[i].ancestrodirecto = registros[i].ancestrodirecto ? parseInt(registros[i].ancestrodirecto) : null;
			registros[i].numprocedimientos = 0;
			registros[i].descendientes = [];
			registros[i].ancestros = [];
			delete registros[i].nivelsici;
		}
	}

	function volcarJSON(){
		fs.writeFile(path.join(__dirname, 'data', 'output.json'), JSON.stringify(registros), function(){
			console.log(registros.length + ' registros');
			console.log('Fichero volcado con éxito en: ' + path.join(__dirname, 'data', 'output.json'));
			console.log('Pasos:');
			console.log("\tmongodump -h localhost --db test -c jerarquia");
			console.log("\tmongoimport --host localhost --db test --collection jerarquia --file data/output.json --jsonArray --drop");
			console.log('En caso de crisis:');
			console.log("\tmongorestore --db test -c jerarquia -h localhost --drop dump/sici/jerarquia.bson");
		});
	}

	parser.on('readable', function(){
		var record = parser.read();

		if (record && record.length > 0){
			if (campos.length === 0) //cabecera
			{
				for(var i = 0, j = record.length; i < j; i++){
					campos.push(record[i].trim());
				}
			}else{
				var registro = {};
				for(var i = 0, j = record.length; i < j; i++){
					registro[ campos[i] ] = record[i].trim();
				}
				registros.push(registro);
			}
		}
	});
	parser.on('error', function(err){
		console.error(err);

	});
	parser.on('finish', function(){
		console.log('Running tests');
		run_tests();
		transformar();
		volcarJSON();
	});

	var input = fs.createReadStream(path.join(__dirname, 'data', 'organica.csv'));
	input.pipe(parser);

})(module, require);
