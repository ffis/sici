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

 


