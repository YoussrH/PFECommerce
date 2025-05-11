"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const ImageUploadModal = ({
  open,
  onOpenChange,
  couleur,
  onUpload,
  images = [],
  onRemoveImage,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Images for {couleur?.libelle}</DialogTitle>
          <DialogDescription>
            Add product images for this color
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Dropzone 
            onDrop={(files) => onUpload(files)}
            accept="image/*"
          />
          
          <div className="flex gap-2 flex-wrap">
            {images.map((file, index) => (
              <div key={index} className="relative group">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`Preview ${index}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};