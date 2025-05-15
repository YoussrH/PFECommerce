const { Coupon, Client, Utilisateur } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const emailService = require('./emailService');
const sequelize = require('../config/db');

// Configuration
const POINTS_THRESHOLD = 600;
const COUPON_VALUE = 10;
const COUPON_EXPIRY_DAYS = 15;
const POINTS_PER_DINAR = 1;

const LoyaltyService = {

    async addPoints(clientId, pointsEarned, transaction = null) {
    const t = transaction || await sequelize.transaction();
    
    try {
        // 1. Get client with LOCK
        const client = await Client.findByPk(clientId, {
            transaction: t,
            lock: true
        });

        if (!client) {
            throw new Error('Client not found');
        }

        // 2. Calculate new points (NO DEDUCTION)
        const newPoints = (client.points_fidelite || 0) + pointsEarned;
        
        // 3. Check if threshold reached for coupon generation
        if (newPoints >= POINTS_THRESHOLD) {
            // Calculate how many coupons to generate
            const couponsToCreate = Math.floor(newPoints / POINTS_THRESHOLD);
            
            // 4. Generate coupons WITHOUT deducting points
            const coupons = await this._generateCoupons(
                clientId, 
                couponsToCreate, 
                t
            );

            // 5. Update client (only update points_fidelite with newPoints)
            await client.update({ 
                points_fidelite: newPoints, // Keep all accumulated points
                date_derniere_conversion: new Date() // Track last coupon generation
            }, { transaction: t });

            // 6. Send email notification
            const user = await Utilisateur.findByPk(clientId, { transaction: t });
            if (user) {
                await this._sendCouponNotification(user, coupons);
            }

            if (!transaction) await t.commit();
            return { 
                success: true,
                points: newPoints, // Return full points
                couponsGenerated: coupons.length 
            };
        }

        // 7. Just update points if threshold not reached
        await client.update({ 
            points_fidelite: newPoints 
        }, { transaction: t });

        if (!transaction) await t.commit();
        return { 
            success: true,
            points: newPoints,
            couponsGenerated: 0 
        };

    } catch (error) {
        if (!transaction) await t.rollback();
        console.error('LoyaltyService error:', error);
        throw error;
    }
},

  async validateCoupon(code, clientId, transaction = null) {
    const t = transaction || await sequelize.transaction();
    
    try {
      const coupon = await Coupon.findOne({
        where: {
          code,
          client_id: clientId,
          is_used: false,
          expires_at: { [Op.gt]: new Date() }
        },
        transaction: t,
        lock: true
      });

      if (!coupon) {
        throw new Error('Invalid or expired coupon');
      }

      await coupon.update({ 
        is_used: true,
        used_at: new Date()
      }, { transaction: t });

      if (!transaction) await t.commit();
      
      return {
        success: true,
        coupon: {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          expires_at: coupon.expires_at
        }
      };

    } catch (error) {
      if (!transaction) await t.rollback();
      console.error('Coupon validation error:', error);
      throw error;
    }
  },

  async getClientCoupons(clientId) {
    try {
      const coupons = await Coupon.findAll({
        where: {
          client_id: clientId,
          is_used: false,
          expires_at: { [Op.gt]: new Date() }
        },
        order: [['expires_at', 'ASC']]
      });

      return {
        success: true,
        coupons: coupons.map(c => ({
          code: c.code,
          type: c.type,
          value: c.value,
          expires_at: c.expires_at
        }))
      };
    } catch (error) {
      console.error('Get coupons error:', error);
      throw error;
    }
  },

  // PRIVATE METHODS
  async _generateCoupons(clientId, count, transaction) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + COUPON_EXPIRY_DAYS);

    const coupons = Array(count).fill().map(() => ({
      id: uuidv4(), // Explicit ID generation
      client_id: clientId,
      code: `FID-${uuidv4().substr(0, 8).toUpperCase()}`,
      type: 'fixed',
      value: COUPON_VALUE,
      expires_at: expiryDate,
      is_used: false,
      created_at: new Date(),
      updated_at: new Date()
    }));

    return Coupon.bulkCreate(coupons, { 
      transaction,
      returning: true 
    });
  },

  async _sendCouponNotification(user, coupons) {
    try {
      await emailService.envoyerEmail({
        to: user.email,
        subject: '🎉 Vos coupons fidélité sont prêts !',
        template: 'couponFidelite',
        context: {
          PRENOM: user.prenom,
          POINTS_UTILISES: coupons.length * POINTS_THRESHOLD,
          COUPONS: coupons.map(c => ({
            code: c.code,
            valeur: `${c.value} DT`,
            date_expiration: c.expires_at.toLocaleDateString('fr-FR'),
            minimum_commande: `${COUPON_VALUE} DT`
          }))
        }
      });
    } catch (error) {
      console.error('Failed to send coupon email:', error);
    }
  }
};

module.exports = LoyaltyService;