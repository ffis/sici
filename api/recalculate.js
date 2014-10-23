
function parseStr2Int (str){
	var valor = parseInt(str);
	if(isNaN(valor)) valor=0;
	return valor;
}


//comprobar si el periodo esta cerrado es cosa
//del crud

exports.softCalculateProcedimiento = function(Q, procedimiento){
	var deferred = Q.defer();

	//para cada periodo
	for(var periodo in procedimiento.periodos)
	{
		if (typeof procedimiento.periodos[ periodo ].resueltos_1 == 'undefined') continue;

		//nuevos campos
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

		var pendientes = parseStr2Int( procedimiento.periodos[ periodo ].pendientes_iniciales );
		var solicitudesprevias = parseStr2Int( procedimiento.periodos[ periodo ].solicitados );
		var totalsolicitudes = 0;
		for(var mes = 0; mes<12;mes++){
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

			var fueradeplazo =  totalresueltos - procedimiento.periodos[ periodo ].en_plazo[mes];
			var solicitudes = parseStr2Int( procedimiento.periodos[ periodo ].solicitados[mes] );
			
			totalsolicitudes += solicitudes;
			pendientes = pendientes + solicitudes - totalresueltos ;

			procedimiento.periodos[ periodo ].total_resueltos.push(totalresueltos);
			procedimiento.periodos[ periodo ].fuera_plazo.push(fueradeplazo);
			procedimiento.periodos[ periodo ].pendientes.push(pendientes);

			procedimiento.periodos[ periodo ].Incidencias['Se han resuelto expedientes fuera de Plazo'].push(totalresueltos);
			procedimiento.periodos[ periodo ].Incidencias['Aumenta el N de expedientes pendientes'].push( pendientes > pendientesprevios ? pendientes - pendientesprevios : 0 );
			procedimiento.periodos[ periodo ].Incidencias['Hay quejas presentadas'].push( procedimiento.periodos[ periodo ].quejas[mes] );
			procedimiento.periodos[ periodo ].Incidencias['Hay expedientes prescritos/caducados'].push( procedimiento.periodos[ periodo ].resueltos_prescripcion[mes] );
			procedimiento.periodos[ periodo ].Incidencias['Las solicitudes aumentan al menos 20%'].push( (solicitudes > solicitudesprevias*1.2) ? solicitudes-solicitudesprevias : 0 );
			solicitudesprevias = solicitudes;
		}
		procedimiento.periodos[ periodo ].totalsolicitudes = totalsolicitudes;
	}
	deferred.resolve(procedimiento);

	return deferred.promise;
}


exports.fullSyncjerarquia = function( Q, models){
	//debe recalcular ancestros y descendientes a partir de ancestrodirecto
	var deferred = Q.defer();
	var Jerarquia = models.jerarquia();

	Jerarquia.find({}, function(err, jerarquias){
		if (err){ deferred.fail(err); return; }

		var ids  = [];
		var mapeado_array = [];

		jerarquias.forEach(function(jerarquia,i){
			mapeado_array[ jerarquia.id ] = jerarquia;
			ids.push(jerarquia.id);
		})

		//reset
		for(var i=0, j=ids.length; i<j; i++){
			var id = ids[i];
			mapeado_array[id].ancestros = (mapeado_array[id].ancestrodirecto) ? [ (mapeado_array[id].ancestrodirecto) ] : [];
			mapeado_array[id].descendientes = [];
		}

		var maxiteraciones = ids.length;
		var cambio = true;
		while(cambio && maxiteraciones--)
		{
			cambio = 0;
			for(var i=0, j=ids.length; i<j; i++){
				var cambiointerno = true;
				var id = ids[i];
				while (cambiointerno){
					cambiointerno = 0;
					//para todos mis ancestros
					for(var k=0; k < mapeado_array[id].ancestros.length; k++){
						var ancestroid = mapeado_array[id].ancestros[k];
						if (typeof mapeado_array[ancestroid] == 'undefined'){
							console.error(ancestroid+' no existe en 35');
							continue;
						}
						//busco si estoy entre sus descendientes
						if (mapeado_array[ancestroid].descendientes.indexOf(id)<0){
							cambio++;cambiointerno++;
							mapeado_array[ancestroid].descendientes.push(id);
						}

						//busco si mis descendientes están entre sus descendientes
						for(var l=0; l < mapeado_array[id].descendientes.length; l++){
							var descendienteid = mapeado_array[id].descendientes[l];
							if (mapeado_array[ancestroid].descendientes.indexOf(descendienteid)<0){
								cambio++;cambiointerno++;
								mapeado_array[ancestroid].descendientes.push(descendienteid);
							}
						}
					}

					//para todos mis descendientes
					for(var k=0; k < mapeado_array[id].descendientes.length; k++){
						var descendienteid = mapeado_array[id].descendientes[k];
						if (typeof mapeado_array[descendienteid] == 'undefined'){
							console.error(descendienteid+' no existe en 47');
							continue;
						}
						//busco si estoy entre sus ancestros
						if (!mapeado_array[descendienteid].ancestros.indexOf(id)<0){
							cambio++;cambiointerno++;
							mapeado_array[descendienteid].ancestros.push(id);
						}

						//busco si mis ancestros están entre sus ancestros
						for(var l=0; l < mapeado_array[id].ancestros.length; l++){
							var ancestroid = mapeado_array[id].ancestros[l];
							if (mapeado_array[descendienteid].ancestros.indexOf(ancestroid)<0){
								cambio++;cambiointerno++;
								mapeado_array[descendienteid].ancestros.push(ancestroid);
							}
						}
					}
				}
			}
		}

		Jerarquia.remove({}, function (){
			for(var i=0, j=ids.length; i<j; i++){
				var id = ids[i];
				var jer = new Jerarquia(mapeado_array[id]);
				jer.save(function(e){ if (e){ console.error(e);	} });
			}
		});

		deferred.resolve(mapeado_array);
	});

	return deferred.promise;
}


exports.test = function(Q,models){
	return function(req,res){
		exports.fullSyncjerarquia(Q,models).then(function(ress){ res.json(ress); });
	};
}
