
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.json('test');
//  res.render('index');
};

exports.partial = function (req, res) {
  var name = req.params.name;
	res.json('test2');
//  res.render('partials/partial' + name);
};
