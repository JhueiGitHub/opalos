// src/app/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { onAuthenticateUser } from "@/actions/user";
import { getWallpaperStyle, getDockIconStyles } from "@/actions/styling";
import { getCosmosHierarchy } from "@/actions/debug";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import Desktop from "./components/Desktop";
import Image from "next/image";

export default async function Home() {
  // Check authentication
  const user = await currentUser();

  if (!user) {
    return redirect("/auth/sign-in");
  }

  // Run authentication to ensure user data exists
  const auth = await onAuthenticateUser();

  if (auth.status !== 200 && auth.status !== 201) {
    return redirect("/auth/sign-in");
  }

  // Get wallpaper and dock icon styles from database
  const wallpaperStyle = await getWallpaperStyle();
  const dockIconStyles = await getDockIconStyles();

  // Initialize QueryClient and prefetch cosmos data
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["cosmos-hierarchy"],
    queryFn: getCosmosHierarchy,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="w-screen h-screen">
        <Image
          src="/media/bg.png"
          alt="bg"
          width={1080}
          height={540}
          className="h-full w-full object-cover"
        />
        {/* <div className="w-screen h-screen" style={wallpaperStyle}> */}
        <Desktop iconStyles={dockIconStyles} />
      </div>
    </HydrationBoundary>
  );
}
