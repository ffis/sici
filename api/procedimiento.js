
exports.procedimiento = function(models){
	return function(req,res){
		var Procedimiento= models.procedimiento();
		var restriccion = {};
		if (typeof req.params.codigo !== 'undefined')
			restriccion.codigo = parseInt(req.params.codigo);
		restriccion.idjerarquia = { '$in': req.user.permisoscalculados.jerarquialectura };
			
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
		restriccion.idjerarquia = { '$in': req.user.permisoscalculados.jerarquialectura };
			
		Procedimiento.findOne(restriccion,function(err,original){
			if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }

	    	var procedimiento = req.body;

			//comprobar qué puede cambiar y qué no

			recalculate.softCalculateProcedimiento(Q, procedimiento).then(function(procedimiento){
				recalculate.softCalculateProcedimientoCache(Q, models, procedimiento).then(function(procedimiento){

			    	res.json(procedimiento);
			    })
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
						{ 'idjerarquia' : { '$in' : req.user.permisoscalculados.jerarquialectura } }
					]} :
					{ '$and' : [ 
						{ 'idjerarquia' : parseInt(req.params.idjerarquia) } ,
						{ 'idjerarquia' : { '$in' : req.user.permisoscalculados.jerarquialectura } }
					]}
				)
				:
				{ 'idjerarquia' : { '$in' : req.user.permisoscalculados.jerarquialectura } };

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

		

		/*
		var jerarquia = req.user.permisoscalculados.jerarquialectura;				
		restriccion.id = {"$in" : jerarquia} ;		
		if (typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))){
			restriccion = { "$and" : [ restriccion , {'id':  parseInt(req.params.idjerarquia) } ] };			
		}
		//if (typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))){
		//	restriccion.id = parseInt(req.params.idjerarquia);
		//}
		Jerarquia.find(restriccion,function(err,data){
			if (err) {  console.error(restriccion); console.error(err); res.status(500); res.end();  return ; }
			console.error(data);
			
			if (data.length>0) {
				var dfs = [];
				for(var i=0;i<data.length;i++){
					var d = Q.defer();					
					dfs.push(d.promise);
					var descendientes = data[i].descendientes;
					descendientes.push(data[i].id);
					restriccion = { "idjerarquia" : { "$in" : descendientes} };
					Procedimiento.find(restriccion,function(err,data){
						if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }						
						d.resolve(data);
					});
				}
				var resultado = [];
				Q.all(dfs).then(function(data){
					for(var j=0;j<data.length;j++)
					{
						if (Array.isArray(data[j]))
							resultado = resultado.concat(data[j]);
					}
					res.json(resultado);
				});
			}

		});*/					   
