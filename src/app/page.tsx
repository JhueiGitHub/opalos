// src/app/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { onAuthenticateUser } from "@/actions/user";
import { getWallpaperStyle, getDockIconStyles } from "@/actions/styling";
import { getUserCosmos } from "@/actions/cosmos";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import Desktop from "./components/Desktop";

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

  // Prefetch only the cosmos list (much more efficient than the entire hierarchy)
  await queryClient.prefetchQuery({
    queryKey: ["user-cosmos"],
    queryFn: getUserCosmos,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="w-screen h-screen" style={wallpaperStyle}>
        <Desktop iconStyles={dockIconStyles} />
      </div>
    </HydrationBoundary>
  );
}
