(function(module) {
  'use strict';

  module.exports.getNodoJerarquia = function(req, res) {
    const jerarquiamodel = req.metaenvironment.models.jerarquia();
    const idjerarquia = req.params.idjerarquia;
    if (typeof idjerarquia === 'string' && idjerarquia !== '' && parseInt(idjerarquia, 10) > 0) {
      jerarquiamodel.findOne({
        'id': parseInt(idjerarquia, 10)
      }).exec().then(req.eh.okHelper(res, false), req.eh.errorHelper(res));
    } else {
      req.eh.notFoundHelper(res);
    }
  };

  module.exports.list = function(req, res) {
    const jerarquiamodel = req.metaenvironment.models.jerarquia();
    jerarquiamodel.find().lean().exec().then(req.eh.okHelper(res, true), req.eh.errorHelper(res));
  };

  module.exports.getAncestros = function(req, res) {
    const jerarquiamodel = req.metaenvironment.models.jerarquia();
    const idjerarquia = req.params.idjerarquia;
    if (typeof idjerarquia === 'string' && idjerarquia !== '' && parseInt(idjerarquia, 10) > 0) {
      jerarquiamodel.find({
        'descendientes': parseInt(idjerarquia, 10)
      }).exec().then(req.eh.okHelper(res, false), req.eh.errorHelper(res));
    } else {
      req.eh.notFoundHelper(res);
    }
  };

  module.exports.getDescendientes = function(req, res) {
    const jerarquiamodel = req.metaenvironment.models.jerarquia();
    const idjerarquia = req.params.idjerarquia;
    if (typeof idjerarquia === 'string' && idjerarquia !== '' && parseInt(idjerarquia, 10) > 0) {
      jerarquiamodel.find({
        'ancestrodirecto': parseInt(idjerarquia, 10)
      }).exec().then(req.eh.okHelper(res, false), req.eh.errorHelper(res));
    } else {
      req.eh.notFoundHelper(res);
    }
  };

  module.exports.getResumenJerarquia = function(req, res) {
    const idjerarquia = req.params.idjerarquia;
    if (typeof idjerarquia === 'string' && idjerarquia !== '' && parseInt(idjerarquia, 10) > 0) {
      const idj = parseInt(req.params.idjerarquia, 10);
      const exportador = req.metaenvironment.exportador;
      exportador.mapReducePeriodos(req.metaenvironment.models, idj, req.permisoscalculados).then(function(results) {
        const plain = results.filter(function(result) {
          return result._id.idjerarquia == idj;
        }).reduce(function(prev, element) {
          prev.periodos['a' + element._id.anualidad] = element.value;
          return prev;
        }, {
          periodos: {}
        });

        res.json(plain);
      }, req.eh.errorHelper(res));
    } else {
      req.eh.notFoundHelper(res);
    }
  };



  module.exports.newJerarquia = function(req, res) {
    const jerarquiamodel = req.metaenvironment.models.jerarquia();
    const jerarquia = {
      'id': req.body.id,
      'nombre': req.body.nombre,
      'nombrelargo': req.body.nombrelargo,
      'ancestrodirecto': req.body.ancestro,
      'numcartas': 0,
      'inicialestipo': 'TELETRABAJO',
      'tipo': 'teletrabajo',
      'numprocedimientos': 0
    };
    jerarquiamodel.create(jerarquia, req.eh.cbWithDefaultValue(res, jerarquia)).then(function(jerarquia) {
      console.log('creado');

    }, req.eh.errorHelper(res, 'Error 147 guardando'));
  };








})(module);
