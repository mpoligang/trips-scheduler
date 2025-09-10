'use client'

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authProvider";
import { useEffect } from "react";

export default function Home() {

  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.user && !auth.loading) {
      router.push('/login');
    }
    else {
      router.push('/dashboard');
    }
  }, [auth])

  if (auth.userData) {
    router.push('/dashboard');
  }

  return (

    <div></div>

  );
}
