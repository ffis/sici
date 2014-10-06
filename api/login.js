exports.authenticate = function(parameters){
	var jwt = parameters.jwt;
	var secret = parameters.secret;

	return function(req, res){

		//TODO validate req.body.username and req.body.password
		//if is invalid, return 401
		if (!(req.body.username === 'john.doe' && req.body.password === 'foobar')) {
		  res.send(401, 'Wrong user or password');
		  return;
		}

		var profile = {
		  first_name: 'John',
		  last_name: 'Doe',
		  email: 'john@doe.com',
		  id: 123
		};

		// We are sending the profile inside the token
		var token = jwt.sign(profile, secret, { expiresInMinutes: 60*5 });
		res.json({ token: token });
  }
}
