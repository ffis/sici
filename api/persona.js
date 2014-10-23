
exports.personasByPuesto = function(models){
	return function(req,res){
		var Persona = models.persona();
		var restriccion = {};
		if (typeof req.params.cod_plaza !== 'undefined')
			restriccion.codplaza = req.params.cod_plaza;
		Persona.find(restriccion,function(err,data){
			if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }
			res.json (data);
		});
	};
}
