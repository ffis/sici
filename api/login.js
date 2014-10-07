exports.authenticate = function(parameters){
	var jwt = parameters.jwt;
	var secret = parameters.secret;

	return function(req, res){

		//TODO validate req.body.username and req.body.password
		//if is invalid, return 401
		if (!(req.body.username === 'mla25p' && req.body.password === 'password')) {
		  res.send(401, 'Wrong user or password');
		  return;
		}

		var profile = {
		  nombre: 'John',
		  apellidos: 'Doe',
		  genero:'M',
		  email: 'john@doe.com',
		  telefono: '968000000',
		  habilitado:1,
		  id: 123,
		  userId: 123,
		  perfil:'',
		  img:'',
		};

		// We are sending the profile inside the token
		var token = jwt.sign(profile, secret, { expiresInMinutes: 60*5 });
		res.json({ profile:profile, token: token });
  }
}
