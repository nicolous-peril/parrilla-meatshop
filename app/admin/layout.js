import { AdminAuthProvider } from "@/components/AdminAuthProvider";

export default function AdminLayout({ children }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
