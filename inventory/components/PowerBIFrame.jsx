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
      <h2 className="text-xl font-semibold mb-2 text-gray-800">📊 Tableau Power BI</h2>
      <div className="w-full h-[calc(100%-2.5rem)]">
        <iframe
          key={key}
          ref={iframeRef}
          title="dashboard"
          src="https://app.powerbi.com/view?r=eyJrIjoiNDVjZGYyNDgtYmRlYi00NjEzLWE4YWMtZjk0ZjBiOWM0ZTE1IiwidCI6ImRiZDY2NjRkLTRlYjktNDZlYi05OWQ4LTVjNDNiYTE1M2M2MSIsImMiOjl9"
          className="w-full h-full rounded-xl border-0"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default PowerBIFrame;
