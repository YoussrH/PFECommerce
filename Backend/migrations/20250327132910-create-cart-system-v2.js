'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableList = await queryInterface.showAllTables();
    if (!tableList.includes('panier')) {
      await queryInterface.createTable('panier', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: Sequelize.UUID,
          references: {
            model: 'utilisateurs',
            key: 'id',
          },
          allowNull: true,
        },
        guestToken: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        items: {
          type: Sequelize.JSONB,
          defaultValue: [],
        },
        expiresAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        }
      });
    }

    if (!tableList.includes('articles_panier')) {
      await queryInterface.createTable('articles_panier', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        articleId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'articles',
            key: 'id',
          },
          allowNull: false,
        },
        cartId: {
          type: Sequelize.UUID,
          references: {
            model: 'panier',
            key: 'id',
          },
          allowNull: false,
        },
        quantite: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        prixAuMomentAjout: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        }
      });

      await queryInterface.addConstraint('articles_panier', {
        fields: ['articleId', 'cartId'],
        type: 'unique',
        name: 'unique_article_cart_combination'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('articles_panier', 'unique_article_cart_combination');
    
    await queryInterface.dropTable('articles_panier');
    await queryInterface.dropTable('panier');
  }
};