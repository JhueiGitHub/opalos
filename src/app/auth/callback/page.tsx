// src/app/auth/callback/page.tsx

import { onAuthenticateUser } from "@/actions/user";
import { redirect } from "next/navigation";

const AuthCallbackPage = async () => {
  const auth = await onAuthenticateUser();

  // After authentication (successful or not), redirect to the main page
  if (auth.status === 403 || auth.status === 400 || auth.status === 500) {
    return redirect("/auth/sign-in");
  }

  // Successful auth - go to main page instead of workspace
  return redirect("/");
};

export default AuthCallbackPage;
