
exports.setPeriodosCerrados = function(models){
	return function(req,res){
		//espera recibir en el body el array de periodos cerrados
		if (req.user.permisoscalculados && req.user.permisoscalculados.superuser){

			var anualidad = req.params.anualidad ? req.params.anualidad : new Date().getFullYear();

			var periodoscerrados = req.body,
				field = 'periodos.'+anualidad+'.periodoscerrados',
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
			req.body.nombre && 
			req.body.codigo)
		{
			var Procedimiento= models.procedimiento();
			var procedimiento = new Procedimiento();
			var idjerarquia = parseInt(req.body.idjerarquia);
			
			procedimiento.idjerarquia = parseInt(req.body.idjerarquia);
			procedimiento.denominacion = req.body.denominacion;
			procedimiento.codigo = req.body.codigo;
			if (req.body.responsable)
				procedimiento.responsable = req.body.responsable;
			if (req.body.padre && !isNaN(parseInt(req.body.padre)))
				procedimiento.padre = parseInt(req.body.padre);
		}
		
		procedimiento.save(function(err){
			console.error(err);
			res.status(500); res.end(); return ;
		});
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

			
			//TODO: eliminar este parche anualidad
			var periodoscerrados = original.periodos['2014'].periodoscerrados;
			var schema = models.getSchema('procedimiento');

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

			for(var attr in schema.periodos['2014']){
				if (attr == 'periodoscerrados') continue;
				if (typeof original.periodos['2014'][attr] === 'object' && Array.isArray(original.periodos['2014'][attr]))
				{
					for(var mes =0, meses=periodoscerrados.length; mes< meses; mes++)
					{
						var val = periodoscerrados[mes];
						if (!val || puedeEscribirSiempre){//el periodo no está cerrado y se puede realizar la asignacion
							original.periodos['2014'][attr][mes] =
								procedimiento.periodos['2014'][attr][mes]!=null ?
								parseInt(procedimiento.periodos['2014'][attr][mes]) : null;
						}
					}
				}else{
					console.log(attr+'=>'+procedimiento.periodos['2014'][attr]);
					original.periodos['2014'][attr] =
								procedimiento.periodos['2014'][attr]!=null ?
								parseInt(procedimiento.periodos['2014'][attr]) : null;
				}
			}

			recalculate.softCalculateProcedimiento(Q, original).then(function(original){
				recalculate.softCalculateProcedimientoCache(Q, models, original).then(function(original){
					exports.saveVersion(models, Q, original).then(function(){
						original.fecha_version = new Date();
						original.save(function(err){
							if (err){ console.error(err); }
							res.json(original);	
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

