import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

const initialDocs = [
  { id: "1", label: "Aadhaar Card", checked: false },
  { id: "2", label: "PAN Card", checked: false },
  { id: "3", label: "Passport", checked: false },
];

export default function Documents() {
  const [docs, setDocs] = useState(initialDocs);

  const toggleDoc = (id: string) => {
    setDocs((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, checked: !doc.checked } : doc,
      ),
    );
  };

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold mb-4">Documents</Text>

      {docs.map((doc) => (
        <Pressable
          key={doc.id}
          onPress={() => toggleDoc(doc.id)}
          className="flex-row items-center justify-between py-3 border-b border-gray-200"
        >
          <Text className="text-base text-gray-800">{doc.label}</Text>

          <View
            className={`w-5 h-5 rounded border ${
              doc.checked ? "bg-blue-500 border-blue-500" : "border-gray-400"
            }`}
          />
        </Pressable>
      ))}
    </View>
  );
}
