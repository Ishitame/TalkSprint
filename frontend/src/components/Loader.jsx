import React from 'react';

const Loader = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#fffdea]">
      <div className="grid grid-cols-3 gap-2 animate-pulse mb-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="w-6 h-6 bg-yellow-500 rounded shadow-md"
            style={{
              animation: `loaderPulse 1s ease-in-out ${i * 0.1}s infinite`,
            }}
          ></div>
        ))}
      </div>

      <p className="text-yellow-800 text-lg font-medium tracking-wide">
        Loading, please wait…
      </p>

      <style>{`
        @keyframes loaderPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;
