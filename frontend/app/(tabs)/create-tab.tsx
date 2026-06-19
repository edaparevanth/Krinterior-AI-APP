// Stub – routes to /create via center FAB; never actually rendered.
import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function CreateTabStub() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/create");
  }, [router]);
  return null;
}
