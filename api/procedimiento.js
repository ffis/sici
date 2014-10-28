
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
		var Jerarquia = models.jerarquia();
		var Procedimiento= models.procedimiento();
		var restriccion = {};
		
		var d = Q.defer();
		var promise = d.promise;
		
		if (typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))){
			var idj = parseInt(req.params.idjerarquia);						
			Jerarquia.find({'id':idj},function(err, data){
				if (data.length>0) {
					var r_jerarquia = data[0].descendientes;
					r_jerarquia.push(idj);	
					restriccion = { '$and' : [ 
							{ 'idjerarquia' : { '$in' : r_jerarquia } } ,
							{ 'idjerarquia' : { '$in' : req.user.permisoscalculados.jerarquialectura } }
						]};
					d.resolve(restriccion);
				}
			});
		} else {
			d.resolve({ 'idjerarquia' : { '$in' : req.user.permisoscalculados.jerarquialectura } });			
		}
		
		promise.then(function(restriccion){			
			Procedimiento.find(restriccion,function(err,data){
				if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }						
				res.json(data);
			});
		});
		
		
		

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
	};
}