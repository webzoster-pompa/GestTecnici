"use client";

import React, { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Platform } from "react-native";

export function PendingInvoicesAlert() {
  const [isBlinking, setIsBlinking] = useState(true);
  
  // Query appuntamenti completati con fattura in attesa
  const { data: pendingInvoices, refetch } = trpc.appointments.getPendingInvoices.useQuery(undefined, {
    refetchInterval: 30000, // Refresh ogni 30 secondi
  });
  
  const count = pendingInvoices?.length || 0;
  
  // Animazione lampeggiante
  useEffect(() => {
    if (count === 0) return;
    
    const interval = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 800);
    
    return () => clearInterval(interval);
  }, [count]);
  
  if (count === 0 || Platform.OS !== "web") return null;
  
  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        zIndex: 1000,
        backgroundColor: isBlinking ? "#EF4444" : "#DC2626",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontWeight: "600",
        fontSize: "15px",
      }}
      onClick={() => {
        // Scroll alla sezione fatture o apri modal
        const event = new CustomEvent("openPendingInvoices", { detail: { invoices: pendingInvoices } });
        window.dispatchEvent(event);
      }}
    >
      <div style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        backgroundColor: "#fff",
        animation: isBlinking ? "pulse 0.8s infinite" : "none",
      }} />
      <span>
        {count} {count === 1 ? "Fattura" : "Fatture"} da Emettere
      </span>
      <span style={{ fontSize: "20px" }}>📄</span>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
