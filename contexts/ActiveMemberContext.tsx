import { getFamilyMembers } from "@/lib/database";
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

  // Load "Self" member from database and set as default
  useEffect(() => {
    const loadSelfMember = async () => {
      if (session?.user?.id && !activeMember) {
        const { data } = await getFamilyMembers(session.user.id);
        const selfMember = data?.find((m) => m.relation === "Self");

        if (selfMember) {
          setActiveMember({
            id: selfMember.id,
            type: "user",
            label: selfMember.full_name,
          });
        }
      }
    };

    loadSelfMember();
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
