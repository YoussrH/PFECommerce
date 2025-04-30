const db = require('../models');
const Marque = db.Marque;

const ajouterMarque = async (req, res) => {
  try {
    if (!req.body.libelle) {
      return res.status(400).send({
        message: "Le libellé de la marque ne peut pas être vide"
      });
    }

    const marque = {
      libelle: req.body.libelle
    };

    const marqueCree = await Marque.create(marque);
    res.status(201).send(marqueCree);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la création de la marque."
    });
  }
};

const obtenirToutesLesMarques = async (req, res) => {
  try {
    const marques = await Marque.findAll({
      include: ['articles']
    });
    res.status(200).send(marques);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la récupération des marques."
    });
  }
};

const obtenirMarqueParId = async (req, res) => {
  const id = req.params.id;

  try {
    const marque = await Marque.findByPk(id, {
      include: ['articles']
    });

    if (marque) {
      res.status(200).send(marque);
    } else {
      res.status(404).send({
        message: `Marque non trouvée avec l'id=${id}`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Erreur lors de la récupération de la marque avec l'id=${id}`
    });
  }
};

const mettreAJourMarque = async (req, res) => {
  const id = req.params.id;

  try {
    const [nombreLignesAffectees] = await Marque.update(req.body, {
      where: { id: id }
    });

    if (nombreLignesAffectees === 1) {
      res.status(200).send({
        message: "La marque a été mise à jour avec succès."
      });
    } else {
      res.status(404).send({
        message: `Impossible de mettre à jour la marque avec l'id=${id}. La marque n'a pas été trouvée ou les données sont les mêmes.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Erreur lors de la mise à jour de la marque avec l'id=${id}`
    });
  }
};

const supprimerMarque = async (req, res) => {
  const id = req.params.id;

  try {
    const nombreLignesSupprimees = await Marque.destroy({
      where: { id: id }
    });

    if (nombreLignesSupprimees === 1) {
      const result = await db.sequelize.query(
        'SELECT setval(pg_get_serial_sequence(\'marque\', \'id\'), coalesce(max(id), 0) + 1, false) FROM marque'
      );
      
      res.status(200).send({
        message: "La marque a été supprimée avec succès!"
      });
    } else {
      res.status(404).send({
        message: `Impossible de supprimer la marque avec l'id=${id}. La marque n'a pas été trouvée.`
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `Impossible de supprimer la marque avec l'id=${id}`
    });
  }
};

const supprimerToutesLesMarques = async (req, res) => {
  try {
    const nombreMarquesSupprimees = await Marque.destroy({
      where: {},
      truncate: false
    });

    res.status(200).send({
      message: `${nombreMarquesSupprimees} marques ont été supprimées avec succès!`
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Une erreur est survenue lors de la suppression de toutes les marques."
    });
  }
};

module.exports = {
  ajouterMarque,
  obtenirToutesLesMarques,
  obtenirMarqueParId,
  mettreAJourMarque,
  supprimerMarque,
  supprimerToutesLesMarques
};