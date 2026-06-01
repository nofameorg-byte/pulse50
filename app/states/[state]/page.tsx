"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StateRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/states");
  }, [router]);
  return null;
}