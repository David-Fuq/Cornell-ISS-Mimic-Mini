import Scene from "@/components/Scene";
import dynamic from "next/dynamic";

// // const Scene = dynamic(() => import("@/components/Scene"), {
// //   ssr: false,
// // });

export default function Home() {
  return (
    <main className="h-screen w-full flex flex-col">
      <div className="w-full h-full">
        <Scene />
      </div>
    </main>
  );
}
