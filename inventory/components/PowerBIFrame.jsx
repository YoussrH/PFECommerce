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
    <div className="rounded-2xl shadow-xl bg-white p-4 w-full h-screen relative overflow-hidden">
      <h2 className="text-xl font-semibold mb-2 text-gray-800">📊 Tableau Power BI</h2>
      <iframe title="dashaboard" width="600" height="373.5" src="https://app.powerbi.com/view?r=eyJrIjoiNDVjZGYyNDgtYmRlYi00NjEzLWE4YWMtZjk0ZjBiOWM0ZTE1IiwidCI6ImRiZDY2NjRkLTRlYjktNDZlYi05OWQ4LTVjNDNiYTE1M2M2MSIsImMiOjl9" frameborder="0" allowFullScreen="true"></iframe>
    </div>
  );
}
export default PowerBIFrame;