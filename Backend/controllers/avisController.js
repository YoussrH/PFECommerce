const { Op, Sequelize } = require('sequelize');
const { Client, Article, CommandeArticle, Commande,Utilisateur, Avis } = require('../models');
const db = require('../models'); // Assuming your models are exported from this file
const sequelize = db.sequelize;

/* const createAvis = async (req, res) => {
  try {
    const { articleId, note, commentaire } = req.body;
    const clientId =req.utilisateur.id; // Assuming the authenticated user's ID is available here

    // Validate input
    if (!articleId || !note) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and rating are required'
      });
    }

    if (note < 1 || note > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if the client has purchased the product
    const hasPurchased = await Commande.findOne({
      include: [
        {
          model: CommandeArticle,
          as: 'commande_articles',
          where: { article_id: articleId },
          required: true
        }
      ],
      where: {
        client_id: clientId,
        statut: {
          [Op.in]: ['livree', 'expediee'] // Only consider delivered or shipped orders
        }
      }
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased'
      });
    }

    // Check if the client has already reviewed this product
    const existingReview = await Avis.findOne({
      where: {
        client_id: clientId,
        article_id: articleId
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Create the review
    const newReview = await Avis.create({
      note,
      commentaire,
      client_id: clientId,
      article_id: articleId
    });

    // Update product average rating (you'll need to implement this function)
    await updateProductRating(articleId);

    return res.status(201).json({
      success: true,
      data: newReview
    });

  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; */

const createAvis = async (req, res) => {
  try {
    const { articleId, note, commentaire } = req.body;
    const clientId = req.utilisateur.id; // Assuming the authenticated user's ID is available here
    console.log('Server: createAvis called', { articleId, note, commentaire, clientId });

    // Validate input
    if (!articleId || !note) {
      console.log('Server: Validation failed - missing articleId or note');
      return res.status(400).json({
        success: false,
        message: 'Product ID and rating are required'
      });
    }

    if (note < 1 || note > 5) {
      console.log('Server: Validation failed - invalid note', { note });
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if the client has purchased the product
    const hasPurchased = await Commande.findOne({
      include: [
        {
          model: CommandeArticle,
          as: 'commande_articles',
          where: { article_id: articleId },
          required: true
        }
      ],
      where: {
        client_id: clientId,
        statut: {
          [Op.in]: ['livree', 'expediee'] // Only consider delivered or shipped orders
        }
      }
    });

    if (!hasPurchased) {
      console.log('Server: User has not purchased the product', { clientId, articleId });
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased'
      });
    }

    // Check if the client has already reviewed this product
    const existingReview = await Avis.findOne({
      where: {
        client_id: clientId,
        article_id: articleId
      }
    });

    if (existingReview) {
      console.log('Server: User has already reviewed this product', { clientId, articleId });
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Create the review
    const newReview = await Avis.create({
      note,
      commentaire,
      client_id: clientId,
      article_id: articleId
    });
    console.log('Server: Review created', { reviewId: newReview.id });

    // Fetch client and article details for notification
    const client = await Client.findOne({
      where: { utilisateur_id: clientId },
      include: [{ 
        model: Utilisateur, 
        as: 'utilisateur', 
        attributes: ['prenom', 'nom', 'email'],
        required: false // Allow null utilisateur
      }]
    });
    const article = await Article.findByPk(articleId, {
      attributes: ['nom_produit']
    });
    console.log('Server: Fetched client and article', { 
      client: client ? { id: client.id, utilisateur: client.utilisateur } : null, 
      article: article ? article.nom_produit : null 
    });

    // Emit Socket.IO notification for new review
    if (req.app.get('io')) {
      const notification = {
        id: newReview.id,
        article_id: articleId,
        article_nom: article?.nom_produit || 'Produit inconnu',
        note: newReview.note,
        commentaire: commentaire || 'Aucun commentaire',
        prenom: client?.utilisateur?.prenom || 'Utilisateur',
        nom: client?.utilisateur?.nom || 'Inconnu',
        email: client?.utilisateur?.email || 'N/A',
        created_at: newReview.created_at,
        message: `Nouvel avis sur ${article?.nom_produit || 'un produit'} par ${client?.utilisateur?.prenom || 'Utilisateur'} ${client?.utilisateur?.nom || 'Inconnu'}`
      };
      console.log('Server: Emitting new-review notification', notification);
      req.app.get('io').to('admin-room').emit('new-review', notification);
    } else {
      console.warn('Server: Socket.IO instance not available');
    }

    // Update product average rating
    await updateProductRating(articleId);

    return res.status(201).json({
      success: true,
      data: newReview
    });

  } catch (error) {
    console.error('Server: Error creating review:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
// Helper function to update product average rating
async function updateProductRating(articleId) {
  try {
    const result = await Avis.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('note')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount']
      ],
      where: { article_id: articleId },
      raw: true
    });

    if (result && result[0]) {
      const { averageRating, reviewCount } = result[0];
      await Article.update(
        {
          note_moyenne: parseFloat(averageRating) || 0,
          nombre_avis: parseInt(reviewCount) || 0
        },
        { where: { id: articleId } }
      );
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

const getProductReviews = async (req, res) => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID is required' 
      });
    }
    
    const reviews = await Avis.findAll({
      where: { article_id: articleId },
      include: [
        { 
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['prenom', 'nom']
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Transform the data to match frontend expectations
    const transformedReviews = reviews.map(review => ({
      ...review.get({ plain: true }),
      utilisateur: review.client?.utilisateur || null
    }));
    
    return res.status(200).json({ 
      success: true, 
      data: transformedReviews 
    });
    
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

/**
 * Delete a review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateurId = req.user.id;
    const userRole = req.user.role;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Review ID is required' 
      });
    }
    
    const review = await Avis.findByPk(id);
    
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }
    
    // Only allow deletion by admin or the review author
    if (userRole !== 'admin' && userRole !== 'super_admin' && review.utilisateurId !== utilisateurId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to delete this review' 
      });
    }
    
    await review.destroy();
    
    // Update product average rating
    await updateProductRating(review.articleId);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Review deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

const getReviewStats = async (req, res) => {
  try {
    const { articleId } = req.params;
    
    const result = await Avis.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('note')), 'average'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { article_id: articleId },
      raw: true
    });
    
    return res.status(200).json({
      success: true,
      data: {
        average: parseFloat(result[0]?.average) || 0,
        count: parseInt(result[0]?.count) || 0
      }
    });
    
  } catch (error) {
    console.error('Error getting review stats:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};
module.exports = {
  createAvis,
  getProductReviews,
  deleteReview,
  getReviewStats
};