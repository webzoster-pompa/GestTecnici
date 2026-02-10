"use client";

import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { trpc } from "@/lib/trpc";

interface CallsNotificationBadgeProps {
  daysThreshold?: number; // Numero di giorni per considerare una chiamata "in attesa da troppo tempo"
}

export function CallsNotificationBadge({ daysThreshold = 7 }: CallsNotificationBadgeProps) {
  const { data: calls } = trpc.calls.list.useQuery();
  
  // Calcola quante chiamate sono in attesa pezzi da più di X giorni
  const waitingCallsCount = useMemo(() => {
    if (!calls) return 0;
    
    const now = new Date();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;
    
    return calls.filter(call => {
      if (call.status !== "waiting_parts") return false;
      
      const callDate = new Date(call.callDate);
      const daysSinceCall = now.getTime() - callDate.getTime();
      
      return daysSinceCall > thresholdMs;
    }).length;
  }, [calls, daysThreshold]);
  
  if (waitingCallsCount === 0) return null;
  
  return (
    <View
      style={{
        position: "absolute",
        top: -4,
        right: -4,
        backgroundColor: "#DC2626",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
      }}
    >
      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}>
        {waitingCallsCount}
      </Text>
    </View>
  );
}
