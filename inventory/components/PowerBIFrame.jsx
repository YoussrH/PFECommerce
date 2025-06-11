import React, { useEffect, useRef, useState } from 'react';

function PowerBIFrame() {
  const iframeRef = useRef(null);
  const [key, setKey] = useState(Date.now()); // force reload via key

  useEffect(() => {
    const interval = setInterval(() => {
      setKey(Date.now()); // This updates the iframe key and reloads it
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl shadow-xl bg-white w-full h-screen p-4 relative overflow-hidden">
      <h2 className="text-xl font-semibold mb-2 text-gray-800">Tableau de board Power BI</h2>
      <div className="w-full h-[calc(100%-2.5rem)]">
        <iframe 
          key={key}
          title="MGMstat"
          className="w-full h-full rounded-xl border-0"
          src="https://app.powerbi.com/view?r=eyJrIjoiMzBjMzlhMjUtYzk2Yy00YmQ2LWE5ZTUtZmM5OTdhNmJhM2UyIiwidCI6ImRiZDY2NjRkLTRlYjktNDZlYi05OWQ4LTVjNDNiYTE1M2M2MSIsImMiOjl9" 
          frameBorder="0" 
          allowFullScreen={true}
        />
      </div>
    </div>
  );
}

export default PowerBIFrame;