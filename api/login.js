exports.authenticate = function(parameters){
	var jwt = parameters.jwt;
	var secret = parameters.secret;
	var Persona = parameters.models.persona();
	var Permisos = parameters.models.permiso();
	

	return function(req, res){

		//TODO validate req.body.username and req.body.password
		//if is invalid, return 401
		if (req.body.password !== 'password') {
		  res.send(401, 'Wrong user or password');
		  return;
		}

		Persona.find(
			{ username: req.body.username, habilitado:true },
			function(err,persona){
				if (err ||persona.length===0)
				{
					res.send(401, 'Wrong user or password');
					return;
				}

				var token = jwt.sign(persona[0], secret, { expiresInMinutes: 60*5 });
				res.json({ profile: persona[0], token: token });
			}
		);
  }
}
