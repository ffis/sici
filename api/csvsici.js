var csvparse = require('csv-parse');
var fs = require('fs');



exports.parse = function(models){
	return function(req,res,next){

		var parser = csvparse({delimiter: ';'})
		var inputs = [], output=[];
		var errores = [];
		var avisos = [];
		var input = fs.createReadStream(req.files.file.path);
		var numlinea = 0;
		var login_importador = req.user.login;


		function getStatus(){
			return 'Línea '+numlinea+': ';
		}
		function esCabecera(row){
			return row.length ==6 &&
				row[0]=='C01_COD_INDICADOR' && row[1]=='C02_COD_PROCESO' &&
				row[2]=='C03_MES' && row[3]=='C04_VALOR' &&
				row[4]=='C05_FECHA_CARGA'&& row[5]=='C06_USUARIO';
		}
		function esIndicadorValido(indicador){
			var idx = [7,8,9,10,11,12,13,14,15,16,17,18,19,21,24,25].indexOf(indicador);
			//var idx = [5,6,7,8,9,10,11,12,13,14,15,16,17,19,23,24].indexOf(indicador);
			if (idx<0){
				 errores.push(getStatus()+'No se ha especificado un indicador válido.');
			}
			return idx>=0;
		}

		function esFechaValida(fecha){
			if (fecha.trim()=='') avisos.push(getStatus()+'No se ha especificado una fecha.');
			return true;
		}
		function esUsuarioValido(usuario){
			if (usuario.trim()=='') avisos.push(getStatus()+'No se ha especificado un usuario.');
			return true;
		}

		function esValorValido(valor){
			if (valor.trim()=='') avisos.push(getStatus()+'No se ha especificado valor, se interpretará como 0. Evalúe si es correcta esta interpretación.');
			return (valor.trim()=='' || parseInt(valor)>=0);
		}

		function esFilaValida(row){
			return row.length ==6 &&
				esIndicadorValido(parseInt(row[0])) &&
				row[1]!='' &&
				parseInt(row[2])>0 && parseInt(row[2])<13 &&
				esValorValido(row[3]) &&
				esFechaValida(row[4]) &&
				esUsuarioValido(row[5]);
		}
		
		parser.on('readable', function(){
		  while(record = parser.read()){
			numlinea++;
		  	for(var j=record.length-1;j>=0;j--){
		  		if (record[j].trim()!=''){ break;}
		  		record.splice(j,1);
		  	}

		  	if (esCabecera(record)){
			  	if (inputs.length==0){
			  		//comprobar si lleva cabecera
			  		avisos.push(getStatus()+'El sistema permite la carga de ficheros con cabecera, pero la teoría es que sobra. No hace falta que cambie nada.')
			  		continue;
			  	}else{
			  		errores.push(getStatus()+'Insertar más de una cabecera de datos no es la mejor manera de poner el sistema a prueba.')
			  	}
			}

			if (esFilaValida(record)){
				inputs.push(record);
			}else if(record.length>0){
				errores.push(getStatus()+'La línea aparenta no estar bien formada, no es acorde al protocolo propuesto.')
			}

		  }
		});

		parser.on('finish', function(){

			var equivalencias = [
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
			'recursos' ];  //25
			var output = [];
			if (inputs.length>0){
				for(var i=0,j=inputs.length;i<j;i++){
					var tipo = typeof equivalencias[inputs[i][0]] !='undefined' ? equivalencias[inputs[i][0]] : '';
					var valor = inputs[i][3].trim()=='' ? 0: parseInt(inputs[i][3]);
					var out = {
						indicador:tipo, proceso: inputs[i][1], mes: inputs[i][2], valor:valor,
						fecha: inputs[i][4], usuario:inputs[i][5]
					}
					output.push(out);
				}
			}
			var estado = errores.length>0 ? 'error' : (avisos.length > 0 ? 'warning' : 'default');

			var Importacion = models.importacionesprocedimiento();
			var response = {
				fichero : req.files.file.name,
				time : new Date(),
				input:inputs,
				output:output,
				avisos:avisos,
				errores: errores,
				login_importador : login_importador,
				estado : estado,
				mostrable : true,
			};
			var importacion = Importacion(response);
			importacion.save(function(){
				res.json(response);	
			},function(err){
				console.error(err);
				res.json(response);
			});
		});
		input.pipe(parser);
	}
}