
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
		

			recalculate.softCalculateProcedimiento(Q, procedimiento).then(function(procedimiento){
				recalculate.softCalculateProcedimientoCache(Q, models, procedimiento).then(function(procedimiento){
					exports.saveVersion(models, Q, procedimiento).then(function(){
						res.json(procedimiento);
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

