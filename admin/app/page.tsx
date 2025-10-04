import AdminLayout from './(dashboard)/layout'
import Dashboard from './(dashboard)/page'

export default function Home() {
  return (
    <AdminLayout>
      <Dashboard />
    </AdminLayout>
  )
}