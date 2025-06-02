// components/FileDownloader.js
import { useState } from 'react';
import { toast } from 'sonner';
import { DownloadIcon, FileIcon, ImageIcon } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

export default function FileDownloader({ file, token }) {
  const [downloading, setDownloading] = useState(false);
    const { user } = useAuth()

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // For PDFs, get signed URL first
      if (file.type === 'application/pdf' || file.url.match(/\.pdf(\?|$)/i)) {
        const response = await fetch('http://localhost:5000/reclamations/signed-url', {
          method: 'POST',
           headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true,
          body: JSON.stringify({ fileUrl: file.url })
        });
        
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to get secure download');
        
        downloadFile(data.signedUrl, file.name);
      } 
      // For images, force download
      else {
        const downloadUrl = file.url.includes('?') 
          ? `${file.url}&fl_attachment`
          : `${file.url}?fl_attachment`;
        downloadFile(downloadUrl, file.name);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Download failed: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
        downloading ? 'bg-gray-100' : 'bg-secondary/30 hover:bg-secondary/50'
      }`}
      onClick={handleDownload}
    >
      {file.type?.startsWith('image/') ? (
        <ImageIcon className="h-4 w-4" />
      ) : (
        <FileIcon className="h-4 w-4" />
      )}
      <span className="truncate max-w-[120px] text-sm">{file.name}</span>
      <span className="text-xs text-muted-foreground">{file.size}</span>
      <DownloadIcon className="h-4 w-4 ml-1" />
    </div>
  );
}