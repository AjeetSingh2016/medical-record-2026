import { useAuth } from "@/lib/useAuth";
import React, { createContext, useContext, useEffect, useState } from "react";

type MemberType = "user" | "family";

interface ActiveMember {
  id: string;
  type: MemberType;
  label: string;
}

interface ActiveMemberContextType {
  activeMember: ActiveMember | null;
  setActiveMember: (member: ActiveMember) => void;
}

const ActiveMemberContext = createContext<ActiveMemberContextType | undefined>(
  undefined,
);

export function ActiveMemberProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useAuth();
  const [activeMember, setActiveMember] = useState<ActiveMember | null>(null);

  // Default to Self when user logs in
  useEffect(() => {
    if (session?.user?.id && !activeMember) {
      setActiveMember({
        id: session.user.id,
        type: "user",
        label: "Self",
      });
    }
  }, [session]);

  return (
    <ActiveMemberContext.Provider value={{ activeMember, setActiveMember }}>
      {children}
    </ActiveMemberContext.Provider>
  );
}

export function useActiveMember() {
  const context = useContext(ActiveMemberContext);
  if (context === undefined) {
    throw new Error("useActiveMember must be used within ActiveMemberProvider");
  }
  return context;
}
