exports.getNodoJerarquia = function(models) {
	return function(req, res) {
		if (typeof req.params.idjerarquia == 'undefined' || isNaN(parseInt(req.params.idjerarquia)))
		{
			console.error('Invocación inválida para la eliminación de un permiso'); res.status(500); res.end(); return;
		} else {
			var idjerarquia = parseInt(req.params.idjerarquia);
			var Jerarquia = models.jerarquia();
			Jerarquia.find({"id":idjerarquia},function (err, data){
				if (err) {
					res.send(err); res.status(500); res.end(); return;
				} else {
					res.json(data[0]);
				}
			});
		}
	}
}

exports.getAncestros = function(models) {
	return function(req,res)
	{
		if (typeof req.params.idjerarquia == 'undefined' || isNaN(parseInt(req.params.idjerarquia)))
		{
			console.error('Invocación inválida para la eliminación de un permiso'); res.status(500); res.end(); return;
		} else {
			var idjerarquia = parseInt(req.params.idjerarquia);
			var Jerarquia = models.jerarquia();
			Jerarquia.find({'descendientes':idjerarquia},function (err, data){
				if (err) {
					res.send(err); res.status(500); res.end(); return;
				} else {
					res.json(data);
				}
			});			
		}
	}
}

exports.getResumenJerarquia = function(models,Q, exportador) {
	return function(req, res) {
		if (typeof req.params.idjerarquia == 'undefined' || isNaN(parseInt(req.params.idjerarquia)))
		{
			console.error('Invocación inválida para la recuperación de datos estadísticos de un nodo de e. orgánica'); res.status(500); res.end(); return;
		} else {
			var idjerarquia = parseInt(req.params.idjerarquia);
			exportador.mapReducePeriodos(Q,models,idjerarquia).then(
				function(data){
					res.json(data);
				}
				,function(err){
					console.error('Error calculando datos estadísticos de un nodo de e. orgánica'); res.status(500); res.end(); return;
				}
			);
		}
	}
}