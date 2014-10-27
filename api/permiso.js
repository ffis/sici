

exports.permisosList = function(models, Q){
	return function(req,res){
		var Permiso = models.permiso();
		var restriccion = {};
		var dpermisos = Q.defer();
		var promise_permisos = dpermisos.promise;

		if (typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))) {
			// obtenemos todos los permisos otorgados sobre esta jerarquía y sus descendientes.
			var idj = parseInt(req.params.idjerarquia);
			var Jerarquia = models.jerarquia();
			var restriccionjerarquia = {};
			var d = Q.defer();
			var promise = d.promise;
			// buscamos la jerarquia indicada
			Jerarquia.findOne({'id':idj}, function(err, data){
				if (err) {  d.reject(err) ; }
				else d.resolve(data);
			});


			promise.then(function(jerarquia){
				// configuramos una búsqueda de la jerarquía actual más los descendientes
				var jerarquias_buscadas = jerarquía.descendientes;
				jerarquias_buscadas.push(jerarquia.id);
				var restriccion = {'jerarquiadirectalectura':{'$in':jerarquias_buscadas}};
				Permiso.find(restriccion, function(err, permisos){
					if (err) { dpermisos.reject(err); }
					else dpermisos.resolve(permisos);
				});
			}, function(error){
				dpermisos.reject(err);
			});
		} else {
			Permiso.find({},function(err, permisos){
				dpermisos.resolve(permisos);
			});
		}

		dpermisos.then(function(permisos){ // permisos ok
			res.json(permisos);
		}, function(err){ // error recuperando permisos
			console.error(restriccion); console.error(err); res.status(500); res.end(); return;
		})
				
	}	
};