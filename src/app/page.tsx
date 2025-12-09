'use client'

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authProvider";
import { useEffect } from "react";
import { appRoutes } from "@/utils/appRoutes";

export default function Home() {

  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.user && !auth.loading) {
      router.push(appRoutes.login);
    }
    else {
      router.push(appRoutes.home);
    }
  }, [auth, router])

  if (auth.userData) {
    router.push(appRoutes.home);
  }

  return (

    <div></div>

  );
}
