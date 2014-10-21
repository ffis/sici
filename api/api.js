exports.log = function(models){
  return function(req, res, next){
    var Registroactividad = models.registroactividad();
    var data = {
    	usr : req.user.login , 
		fecha : new Date(),
		url : req.url,
		req : {
			headers:req.headers,
			body:req.body
		},
    };
    (new Registroactividad(data)).save();
    next();
  }
}

/*
 * Serve JSON to our AngularJS client
 */

exports.procedimientoList = function(models, Q){
	return function(req,res){
		var Jerarquia = models.jerarquia();
		var Procedimiento= models.procedimiento();
		var restriccion = {};
		var jerarquia = req.user.permisoscalculados.jerarquialectura;				
		restriccion.id = {"$in" : jerarquia} ;		
		if (typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))){
			restriccion = { "$and" : [ restriccion , {'id': { "$in" : parseInt(req.params.idjerarquia)} } ] };
			//restriccion.id = parseInt(req.params.idjerarquia);
		}
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
					restriccion = { "idjerarquia" : { "$in" : ids} };
					Procedimiento.find(restriccion,function(err,data){
						if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }
						d.promise.resolve(data);
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
			/*
			var restriccion = {}
			if (typeof data[0].descendientes === 'undefined'){
				console.error('ESTO NO DEBERIA PASAR');
			}else{
				var ids =  data[0].descendientes;
				ids.push(parseInt(req.params.idjerarquia)) ;
			 restriccion = { "idjerarquia" : { "$in" : ids} };
		 	}
			Procedimiento.find(restriccion,function(err,data){
				if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }
				res.json (data);
			});
			*/
		});					   
	};
}

function cargahijos(Q,Jerarquia, nodo, nivel){
	var deferred = Q.defer();
	Jerarquia.find( {ancestros:nodo.id}, function(err, nodos){	
		var returnValue = [];			
		var promesas = [];
		nodos.forEach(function(hijo){
			if (hijo.ancestros.length!=nivel) return;
			if (hijo.descendientes && typeof hijo.descendientes === 'object' && hijo.descendientes.length > 0)
			{			
				var hijopromesa = cargahijos(Q,Jerarquia, hijo, nivel+1);
				promesas.push(hijopromesa);
				hijopromesa.then(function(val){
					returnValue.push({ _id:hijo._id, id:hijo.id, title: hijo.nombre, nodes: val});
				});
			}else{
				returnValue.push({ _id:hijo._id, id:hijo.id, title: hijo.nombre, nodes: []});
			}
		});
		Q.all(promesas).then(function(){
			deferred.resolve(returnValue);
		});
	});
	return deferred.promise;
}

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

exports.arbol = function(Q, models){
	return function(req,res){
	
		var Jerarquia = models.jerarquia();
		var returnValue = [];
		var promises = [];
		Jerarquia.find({ancestros:[]}, function(err, raiz){
			if (err){ console.error(err);res.status(500); res.json(err); res.end(); return; }
			//console.log(raiz);
			raiz.forEach(function(nodo, idx, arr){

				if (nodo.descendientes && typeof nodo.descendientes === 'object' && nodo.descendientes.length > 0)
				{
					var nodesPromise = cargahijos(Q,Jerarquia, nodo, 1);
					nodesPromise.then(function(val){
						returnValue.push({_id:nodo._id, id:nodo.id, title: nodo.nombre, nodes: val});
					});
					promises.push(nodesPromise);
				}else{
					returnValue.push({_id:nodo._id, id:nodo.id, title: nodo.nombre, nodes: [] });
				}
			});
			Q.all(promises).then(function(){
				res.json(returnValue);
			});
		});
	}
};
//[{ id: '', title:'', nodes:[]}]

exports.raw = function(models){
	return function(req,res){
		var modelname = req.params.modelname;
		if (typeof models[modelname] !== 'function')
		{
			console.error(modelname + " doesn't exists in model"); res.status(500); res.end(); return ; 
		}
		var Loader = models[modelname]();
		Loader.find({},function(err,data){
			if (err) { console.error(err); res.status(500); res.end(); return ; }
			res.json (data);
		});
	}
}

exports.aggregate = function(models){
	return function(req,res){
		var Procedimiento = models.procedimiento();
		var connection = Procedimiento.collection;
		var campostr = req.params.campo;
		var group = [];
		var groupfield = {};

		
		try{
			groupfield['_id'] = JSON.parse(campostr);
		}catch(e){
			groupfield['_id'] = "$"+campostr;
		}

		var matchstr = req.params.match;
		if (typeof matchstr === 'string'){

			var match = {};

			//probar 
			try{
				match = JSON.parse(matchstr);
			}catch(e){

				var condiciones = matchstr.split('|');
				
				condiciones.forEach(function(condicion){
					var partes = condicion.split(':');
					var campomatch = partes[0];
					var valor = typeof partes[1] !== 'undefined' ? (partes[1]) : '';
					if(/^(\-|\+)?([0-9]+|Infinity)$/.test(valor))
						valor = parseInt(valor);
					match[campomatch] = valor;
					
				});
			}
			//console.log(req.user);
			match.idjerarquia = {'$in':req.user.permisoscalculados.jerarquialectura};
			group.push({ "$match" : match });
		}
		

		groupfield['count'] = {'$sum':1};
		groupfield['porcumplimentar'] = { '$sum':{'$cond': { if: { '$eq':[0,'$periodos.'+cfg.anyo+'.totalsolicitudes']}, then:1, else: 0 } } };

		group.push({"$group" : groupfield});
		group.push({"$sort":{ 'count' : -1 } });
		//console.log(JSON.stringify(group));
		connection.aggregate(group ,function(err,data){
			if (err) { console.error(err); res.status(500); res.end(); return ; }
			res.json (data);
		});		
	}
}

 


