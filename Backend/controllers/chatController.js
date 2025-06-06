const { Op } = require('sequelize');
const cloudinary = require('cloudinary').v2;
const OpenAI = require('openai');
const { Article } = require('../models/Article');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handleChat = async (req, res, next) => {
  try {
    const { message } = req.body;
    let imageUrl = null;

    // Handle image upload if present
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'chat_uploads',
        public_id: `chat_image_${Date.now()}`,
      });
      imageUrl = result.secure_url;
    }

    // Extract keywords from user message for database query
    const keywords = message.toLowerCase().split(/\s+/).filter(word => 
      ['jean', 'chemise', 'pull', 't-shirt', 'pantalon'].includes(word)
    );

    // Query the database for matching products
    let products = [];
    if (keywords.length > 0) {
      products = await Article.findAll({
        where: {
          nom_produit: {
            [Op.iLike]: `%${keywords.join('%')}%`,
          },
          est_actif: true,
        },
        include: [
          { association: 'inventory', include: ['taille', 'couleur'] },
          { association: 'images_couleurs', include: ['couleur'] },
        ],
      });
    }

    // Prepare AI prompt
    const systemPrompt = `
      You are a friendly and knowledgeable e-commerce assistant for a clothing store. Your task is to:
      - Analyze the user's message and any provided image to identify the clothing item (type, color, style).
      - If an image is provided, describe the item and suggest complementary products from the provided product catalog.
      - If the item in the image matches a product in the catalog, confirm its availability and provide details (name, price, SKU).
      - If the item is not in the catalog, suggest similar or complementary items from the catalog.
      - If the user asks about availability or complementary items (e.g., "what pull could work with these jeans?"), use the provided product data to make specific recommendations.
      - If you cannot analyze the image or understand the request, politely ask for a textual description of the item.
      - Always respond in a concise, friendly, and professional manner.

      Product Catalog:
      ${JSON.stringify(products.map(p => ({
        nom_produit: p.nom_produit,
        description: p.description,
        prix: p.prix,
        sku: p.sku,
        variations: p.inventory.map(v => ({
          taille: v.taille?.nom_taille,
          couleur: v.couleur?.nom_couleur,
          quantite: v.quantite,
        })),
        images: p.images_couleurs.map(i => i.url),
      })), null, 2)}
    `;

    const messages = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: [
          { type: 'text', text: message },
          ...(imageUrl ? [{ type: 'image_url', image_url: { url: imageUrl } }] : []),
        ],
      },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0].message.content;

    // Clean up uploaded image from Cloudinary
    if (imageUrl) {
      const publicId = imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`chat_uploads/${publicId}`);
    }

    res.json({ response: aiResponse });
  } catch (error) {
    next(error);
  }
};