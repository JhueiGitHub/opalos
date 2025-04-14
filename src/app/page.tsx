// src/app/page.tsx

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { onAuthenticateUser } from "@/actions/user";
import { getWallpaperStyle } from "@/actions/styling";
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

  // Get wallpaper style from database
  const wallpaperStyle = await getWallpaperStyle();

  return (
    <div className="w-screen h-screen" style={wallpaperStyle}>
      <Desktop />
    </div>
  );
}
