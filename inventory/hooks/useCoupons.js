import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function useCoupons() {
  const [data, setData] = useState({
    summary: {
      totalPoints: 0,
      totalCoupons: 0,
      usedCoupons: 0,
      totalValue: '0.00',
      usedValue: '0.00'
    },
    coupons: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/coupons/overview');
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const validateCoupon = async (code) => {
    try {
      const response = await axios.post('http://localhost:5000/coupons/validate', { code });
      toast.success('Coupon validated successfully!');
      await fetchData(); // Refresh data
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { ...data, loading, error, validateCoupon, refresh: fetchData };
}