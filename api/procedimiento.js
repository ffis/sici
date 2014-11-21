
exports.setPeriodosCerrados = function(models){
	return function(req,res){
		//espera recibir en el body el array de periodos cerrados
		if (req.user.permisoscalculados && req.user.permisoscalculados.superuser){

			var anualidad = req.params.anualidad ? req.params.anualidad : new Date().getFullYear();

			var periodoscerrados = req.body,
				field = 'periodos.a'+anualidad+'.periodoscerrados',
				conditions = {  },
				update = { $set : {} },
				options = { multi: true },
				Procedimiento = models.procedimiento() ;

				update.$set[field ] = periodoscerrados;

			var callback = function(err,doc){
				if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }
				res.json(periodoscerrados);
			};
			res.json(periodoscerrados);
			//Procedimiento.update(conditions, update, options, callback);
		}
	}
}

exports.createProcedimiento = function(Q, models, recalculate) {
	return function(req,res){
		if (req.body.idjerarquia && !isNaN(parseInt(req.body.idjerarquia)) &&
			req.body.denominacion && 
			req.body.codigo && req.body.cod_plaza && parseInt(req.body.idjerarquia)>0)
		{
			var Procedimiento = models.procedimiento();
			var Jerarquia = models.jerarquia();
			var procedimiento = new Procedimiento();
			var idjerarquia = parseInt(req.body.idjerarquia);
			
			procedimiento.idjerarquia = idjerarquia;
			procedimiento.denominacion = req.body.denominacion;
			procedimiento.codigo = req.body.codigo;
			if (req.body.cod_plaza)
				procedimiento.cod_plaza = req.body.cod_plaza;
			if (req.body.padre)
				procedimiento.padre = ""+req.body.padre;

			//check jerarquia $exists
			Jerarquia.find({id:idjerarquia}, function(err,jerarquias){
				if (jerarquias.length>0)
				{
					//check codigo $exists:0
					Procedimiento.find({codigo:procedimiento.codigo}, function(err, procs){
						if (procs.length>0){
							res.status(500).send('Error 55 guardando'); res.end(); return ;
						}else{
							procedimiento.save(function(err){
								if (err){
									console.error(err);	res.status(500).send('Error 57 guardando'); res.end(); return ;
								}else{
									recalculate.softCalculateProcedimiento(Q, models, procedimiento).then(function(procedimiento){
										recalculate.softCalculateProcedimientoCache(Q, models, procedimiento).then(function(procedimiento){
											procedimiento.save(function(err){
												if (err){
													console.error(err);	res.status(500).send('Error 67 guardando'); res.end(); return ;
												}else{
													res.json(procedimiento);
												}
											});
										});
									});
								}
							});
						}
					})
				}else{
					res.status(500).send('Error 67 guardando'); res.end(); return ;
				}
			})
		}else{
			console.error(JSON.stringify(req.body)); res.status(500).send('Error 71 guardando'); res.end(); return ;
		}
	}
}

exports.procedimiento = function(models){
	return function(req,res){
		var Procedimiento = models.procedimiento();
		var restriccion = {};
		if (typeof req.params.codigo !== 'undefined')
			restriccion.codigo = parseInt(req.params.codigo);
		restriccion.idjerarquia = { '$in': req.user.permisoscalculados.jerarquialectura.concat( req.user.permisoscalculados.jerarquiaescritura) };
			
		Procedimiento.findOne(restriccion,function(err,data){
			if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }
			res.json (data);
		});
									   
	};
}


exports.updateProcedimiento = function(Q, models, recalculate){
	return function(req,res){
		var Procedimiento= models.procedimiento();
		var restriccion = {};
		if (typeof req.params.codigo !== 'undefined')
			restriccion.codigo = parseInt(req.params.codigo);
		//comprobar si tiene permiso el usuario actual
		restriccion.idjerarquia = { '$in': req.user.permisoscalculados.jerarquiaescritura };
			
		Procedimiento.findOne(restriccion,function(err,original){
			if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }

	    	var procedimiento = req.body;
			//TODO: comprobar qué puede cambiar y qué no

			//suponemos que es un usuario normal, con permisos de escritura, en ese caso sólo podra modificar
			//los atributos que estan dentro de periodo, que no son array, y aquellos que siendo array no
			//son periodos cerrados ni corresponden a un periodo cerrado

			var puedeEscribirSiempre = req.user.permisoscalculados.superuser;

			
			//TODO: IMPEDIR EDICION DE ANUALIDADES MUY PRETÉRITAS		
			var schema = models.getSchema('procedimiento');
			
			for (var anualidad in schema.periodos) {

							
					var periodoscerrados = original.periodos[anualidad].periodoscerrados;

					if (puedeEscribirSiempre){
						/*
						for(var attr in schema){
							if (attr == 'codigo') continue;
							if (attr == 'periodos') continue;
							if (attr == 'idjerarquia') continue;
							if (attr == 'cod_plaza') continue;
							if (attr == 'fecha_creacion') continue;
							if (attr == 'fecha_fin') continue;
							if (attr == 'fecha_version') continue;
							if (attr == 'etiquetas') continue;
							if (attr == 'padre') continue;
						}*/

						original.denominacion = procedimiento.denominacion;
					}


					for(var attr in schema.periodos[anualidad]){
						if (attr == 'periodoscerrados') continue;
						if (typeof original.periodos[anualidad][attr] === 'object' && Array.isArray(original.periodos[anualidad][attr]))
						{
							for(var mes =0, meses=periodoscerrados.length; mes< meses; mes++)
							{
								var val = periodoscerrados[mes];
								if (!val || puedeEscribirSiempre){//el periodo no está cerrado y se puede realizar la asignacion
									original.periodos[anualidad][attr][mes] =
										procedimiento.periodos[anualidad][attr][mes]!=null ?
										parseInt(procedimiento.periodos[anualidad][attr][mes]) : null;
								}
							}
						}else{
							console.log(attr+'=>'+procedimiento.periodos[anualidad][attr]);
							original.periodos[anualidad][attr] =
										procedimiento.periodos[anualidad][attr]!=null ?
										parseInt(procedimiento.periodos[anualidad][attr]) : null;
						}
					}
				
			}

			recalculate.softCalculateProcedimiento(Q, models, original).then(function(original){
				recalculate.softCalculateProcedimientoCache(Q, models, original).then(function(original){
					exports.saveVersion(models, Q, original).then(function(){
						original.fecha_version = new Date();
						Procedimiento.update({codigo:original.codigo}, JSON.parse(JSON.stringify(original)), {multi:false, upsert:false}, function(err,coincidencias, elemento){
							if (err){  console.error(err); res.status(500).send(JSON.stringify(err)); res.end(); return ;  }
							else{
								res.json(original);	
								console.log(JSON.stringify(elemento));
								console.log(coincidencias);
							}
						});
					});
			    });
			});
		});
	}
}


exports.procedimientoList = function(models, Q){
	return function(req,res){
		var Procedimiento= models.procedimiento();
		var restriccion = {};
		var fields = req.query.fields;
		var restriccion =
			(typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))) ?
				(typeof req.params.recursivo === 'undefined' || req.params.recursivo>0  ?
					{ '$and' : [ 
						{ 'ancestros.id' : { '$in' : [ parseInt(req.params.idjerarquia) ] } } ,
						{ 'idjerarquia' : { '$in' : req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura) } }
					]} :
					{ '$and' : [ 
						{ 'idjerarquia' : parseInt(req.params.idjerarquia) } ,
						{ 'idjerarquia' : { '$in' : req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura) } }
					]}
				)
				:
				{ 'idjerarquia' : { '$in' : req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura) } };

		var cb = function(err,data){
			if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }						
			res.json(data);
		};

		var query = Procedimiento.find(restriccion);
		if (typeof fields !== 'undefined'){
			query.select(fields);
		}
		query.exec(cb);
	};
}	

exports.saveVersion = function(models, Q, procedimiento){
	var defer = Q.defer();
	var Historico = models.historico();
	var v = JSON.parse(JSON.stringify(procedimiento));
	delete v._id;
	var version = new Historico(v);
	version.save(function(err){
		if (err) defer.reject(err);
		else defer.resolve();
	});
	return defer.promise;
}

