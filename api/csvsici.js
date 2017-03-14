(function(module, logger){
	'use strict';

	const csvparse = require('csv-parse'),
		fs = require('fs');

	module.exports.parse = function(req, res){
		const models = req.metaenvironment.models;

		if (!req.files){
			req.eh.missingParameterHelper(res, 'files');

			return;
		}

		const parser = csvparse({delimiter: ';'});
		const inputs = [];
		const errores = [];
		const avisos = [];
		const inputfile = fs.createReadStream(req.files.file.path);
		let numlinea = 0;
		const loginImportador = req.user.login;
		const validIndicators = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 24, 25];

		function getStatus(){

			return 'Línea ' + numlinea + ': ';
		}

		function esCabecera(row){

			return row.length === 6 &&
				row[0] === 'C01_COD_INDICADOR' && row[1] === 'C02_COD_PROCESO' &&
				row[2] === 'C03_MES' && row[3] === 'C04_VALOR' &&
				row[4] === 'C05_FECHA_CARGA' && row[5] === 'C06_USUARIO';
		}

		function esIndicadorValido(indicador){
			const idx = validIndicators.indexOf(indicador);
			if (idx < 0){
				errores.push(getStatus() + 'No se ha especificado un indicador válido.');
			}

			return idx >= 0;
		}

		function esFechaValida(fecha){
			if (fecha.trim() === ''){
				avisos.push(getStatus() + 'No se ha especificado una fecha.');
			}

			return true;
		}

		function esUsuarioValido(usuario){
			if (usuario.trim() === ''){
				avisos.push(getStatus() + 'No se ha especificado un usuario.');
			}

			return true;
		}

		function esValorValido(valor){
			if (valor.trim() === ''){
				avisos.push(getStatus() + 'No se ha especificado valor, se interpretará como 0. Evalúe si es correcta esta interpretación.');
			}

			return (valor.trim() === '' || parseInt(valor, 10) >= 0);
		}

		function esFilaValida(row){
			return row.length === 6 &&
				esIndicadorValido(parseInt(row[0], 10)) &&
				row[1] !== '' &&
				parseInt(row[2], 10) > 0 && parseInt(row[2], 10) < 13 &&
				esValorValido(row[3]) &&
				esFechaValida(row[4]) &&
				esUsuarioValido(row[5]);
		}

		parser.on('error', req.eh.errorHelper(res));
		parser.on('readable', function(){
			let record = parser.read();
			while (record){
				numlinea += 1;
				for (let j = record.length - 1; j >= 0; j -= 1){
					if (record[j].trim() !== ''){

						break;
					}
					record.splice(j, 1);
				}

				if (esCabecera(record)){
					if (inputs.length === 0){
						//comprobar si lleva cabecera
						avisos.push(getStatus() + 'El sistema permite la carga de ficheros con cabecera, pero la teoría es que sobra. No hace falta que cambie nada.');
						record = parser.read();

						continue;
					} else {
						errores.push(getStatus() + 'Insertar más de una cabecera de datos no es la mejor manera de poner el sistema a prueba.');
					}
				}

				if (esFilaValida(record)){
					inputs.push(record);
				} else if (record.length > 0){
					errores.push(getStatus() + 'La línea aparenta no estar bien formada, no es acorde al protocolo propuesto.');
				}
				record = parser.read();
			}
		});
		parser.on('finish', function(){

			const equivalencias = [
				'', //0
				'', //1 RESUELTOS MISMO AÑO - CALCULADO??
				'', //2 PLAZO MÁXIMO LEGAL PARA RESOLVER (naturales)
				'', //3 PLAZO MAXIMO LEGAR PARA RESOLVER (habiles)
				'', //4 CARTA SERVICIO / ANS (naturales)
				'', //5 CARTA SERVICIO / ANS (habiles)
				'', //6 PENDIENTES MES ANTERIOR - CALCULADO
				'solicitados', //7
				'iniciados', //8
				'resueltos_1', //9
				'resueltos_5', //10
				'resueltos_10', //11
				'resueltos_15', //12
				'resueltos_30', //13
				'resueltos_45', //14
				'resueltos_mas_45', //15
				'resueltos_desistimiento_renuncia_caducidad',  //16
				'resueltos_prescripcion', //17
				't_medio_naturales', //18
				't_medio_habiles', //19
				'',  //20 RESUELTOS  - CALCULADO
				'en_plazo', //21
				'', //22 FUERZA DE PLAZO - CALCULADO
				'', //23 PENDIENTES - CALCULADO
				'quejas', //24
				'recursos']; //25
			const output = inputs.map(function(input){
				return {
					indicador: typeof equivalencias[input[0]] === 'undefined' ? '' : equivalencias[input[0]],
					proceso: input[1],
					mes: input[2],
					valor: input[3].trim() === '' ? 0 : parseInt(input[3], 10),
					fecha: input[4],
					usuario: input[5]
				};
			});

			const estado = errores.length > 0 ? 'error' : (avisos.length > 0 ? 'warning' : 'default');
			const importacion = models.importacionesprocedimiento();
			const response = {
				fichero: req.files.file.name,
				time: new Date(),
				input: inputs,
				output: output,
				avisos: avisos,
				errores: errores,
				login_importador: loginImportador,
				estado: estado,
				mostrable: true
			};
			importacion.create(response).then(function(){
				res.json(response);
			}, function(err){
				logger.error(err);
				res.json(response);
			});
		});
		inputfile.pipe(parser);
	};

})(module, console);
