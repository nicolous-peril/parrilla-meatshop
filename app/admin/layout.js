import { AdminAuthProvider } from "@/components/AdminAuthProvider";
import { AdminShell } from "@/components/AdminShell";

export default function AdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
