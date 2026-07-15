"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useI18n } from "@/lib/i18n";

interface RealtimeContextType {
  pendingCount: number;
  triggerRefresh: () => void;
  subscribeToUpdates: (callback: () => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined,
);

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}

export default function RealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [subscribers, setSubscribers] = useState<(() => void)[]>([]);
  const { t } = useI18n();

  const triggerRefresh = useCallback(() => {
    subscribers.forEach((cb) => cb());
  }, [subscribers]);

  const subscribeToUpdates = useCallback((callback: () => void) => {
    setSubscribers((prev) => [...prev, callback]);
    return () => {
      setSubscribers((prev) => prev.filter((cb) => cb !== callback));
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      console.log("[Realtime] Connecting to updates stream...");
      eventSource = new EventSource("/api/updates");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.pendingCount !== undefined) {
            setPendingCount(data.pendingCount);
          }

          if (data.type === "proposal:created") {
            const titleText = t("new_proposal_title");
            const message = t("new_proposal_msg", {
              label: data.proposal.label,
              type: data.proposal.type,
            });

            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              try {
                const notif = new Notification(
                  `${t("brand_name")} - ${titleText}`,
                  {
                    body: message,
                    icon: "/favicon.ico",
                  },
                );
                notif.onclick = () => {
                  window.focus();
                  window.location.href = "/gate";
                };
              } catch (e) {
                console.error(
                  "[Realtime] Error showing native notification:",
                  e,
                );
              }
            }

            triggerRefresh();
          } else if (data.type === "proposal:updated") {
            const titleText = t("proposal_status_title");
            const message = t("proposal_status_msg", {
              action: data.action,
            });

            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              try {
                const notif = new Notification(
                  `${t("brand_name")} - ${titleText}`,
                  {
                    body: message,
                    icon: "/favicon.ico",
                  },
                );
                notif.onclick = () => {
                  window.focus();
                };
              } catch (e) {
                console.error(
                  "[Realtime] Error showing native notification:",
                  e,
                );
              }
            }

            triggerRefresh();
          }
        } catch {
          // Keep-alive pings can be ignored
        }
      };

      eventSource.onerror = () => {
        console.warn(
          "[Realtime] Stream connection lost. Attempting to reconnect in 5s...",
        );
        eventSource?.close();
        reconnectTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [t, triggerRefresh]);

  return (
    <RealtimeContext.Provider
      value={{ pendingCount, triggerRefresh, subscribeToUpdates }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}
