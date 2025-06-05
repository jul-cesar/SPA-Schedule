

import { createAuthClient } from "better-auth/client";
import { inferAdditionalFields } from "better-auth/client/plugins";

import { auth } from "./auth";
 export const authClient =  createAuthClient({
      plugins: [inferAdditionalFields<typeof auth>()],
 })
 
export const signIn = async () => {
    const data = await authClient.signIn.social({
        provider: "google"
    })
  
}

