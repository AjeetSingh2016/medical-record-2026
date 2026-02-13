import FontAwesome from "@expo/vector-icons/FontAwesome";
import BottomSheet from "@gorhom/bottom-sheet";
import { Tabs } from "expo-router";
import React, { useRef } from "react";

import { CustomHeader } from "@/components/CustomHeader";
import { ProfileBottomSheet } from "@/components/ProfileBottomSheet";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: useClientOnlyValue(false, true),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            header: () => (
              <CustomHeader
                onProfilePress={() => bottomSheetRef.current?.expand()}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="family"
          options={{
            title: "Family",
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="users" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
      </Tabs>

      <ProfileBottomSheet bottomSheetRef={bottomSheetRef} />
    </>
  );
}
