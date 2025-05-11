'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const DiscountReviewModal = ({ discount, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    discountType: discount.discountType,
    value: discount.value,
    target: discount.target,
    startDate: discount.startDate,
    endDate: discount.endDate,
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave({
      ...discount,
      ...formData,
      status: 'approved',
    });
    onClose();
  };

  return (
    <Dialog open={!!discount} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Review Discount</DialogTitle>
          <DialogDescription>
            Adjust discount parameters for {discount?.eventName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="discountType" className="text-right">
              Type
            </Label>
            <Select
              value={formData.discountType}
              onValueChange={value => handleChange('discountType', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Discount Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
                <SelectItem value="bogo">Buy One Get One</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="value" className="text-right">
              Value
            </Label>
            <Input
              id="value"
              type="number"
              value={formData.value}
              onChange={e => handleChange('value', e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target" className="text-right">
              Target
            </Label>
            <Input
              id="target"
              value={formData.target}
              onChange={e => handleChange('target', e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dates" className="text-right">
              Duration
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Input
                type="date"
                value={formData.startDate}
                onChange={e => handleChange('startDate', e.target.value)}
              />
              <span>to</span>
              <Input
                type="date"
                value={formData.endDate}
                onChange={e => handleChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Current Status</Label>
            <Badge
              variant={
                discount.status === 'pending'
                  ? 'warning'
                  : discount.status === 'approved'
                  ? 'success'
                  : 'destructive'
              }
              className="col-span-3"
            >
              {discount.status}
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="destructive" onClick={() => onClose(true)}>
            Reject
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Approve Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};