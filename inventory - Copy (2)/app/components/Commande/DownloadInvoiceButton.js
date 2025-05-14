// components/DownloadInvoiceButton.js
'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function DownloadInvoiceButton({ reference }) {
  const handleDownload = () => {
    // Open the PDF in a new tab for download
    window.open(`/api/commandes/${reference}/facture`, '_blank');
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleDownload}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Télécharger la facture
    </Button>
  );
}