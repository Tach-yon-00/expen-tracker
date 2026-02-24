import { Slot } from "expo-router";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import ToastProvider from "../components/Toast";
import { ExpenseProvider } from "../context/ExpenseContext";

export default function Layout() {
  useEffect(() => {
    async function checkUpdate() {
      try {
        // ONLY run in production build
        if (!__DEV__) {
          const update = await Updates.checkForUpdateAsync();

          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        }
      } catch (e) {
        console.log("Update error:", e);
      }
    }

    checkUpdate();
  }, []);

  return (
    <ExpenseProvider>
      <ToastProvider>
        <Slot />
      </ToastProvider>
    </ExpenseProvider>
  );
}
