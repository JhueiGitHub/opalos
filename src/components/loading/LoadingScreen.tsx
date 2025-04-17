// src/components/LoadingScreen.tsx
import Image from "next/image";

const LoadingScreen = () => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center h-screen w-screen z-50"
      style={{ backgroundColor: "#010101" }}
    >
      <Image
        src="/media/spatial.gif"
        alt="Loading..."
        width={540}
        height={540}
        priority
      />
      <div
        className="absolute"
        style={{
          width: 759,
          height: 759,
          background:
            "radial-gradient(circle, rgba(1,1,1,0) 0%, rgba(1,1,1,1) 81%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default LoadingScreen;
