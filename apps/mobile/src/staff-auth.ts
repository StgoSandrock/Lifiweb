import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { isStaffUser, observeStaffUser } from "./services/staff";

export function useStaffAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let active = true;
    const unsubscribe = observeStaffUser(async (candidate) => {
      const authorized = candidate ? await isStaffUser(candidate).catch(() => false) : false;
      if (active) {
        setUser(authorized ? candidate : null);
        setChecking(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  return { user, checking };
}
