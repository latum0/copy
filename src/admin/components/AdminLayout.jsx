import Sidebar from './Sidebar'
import { Outlet } from 'react-router-dom'

const AdminLayout = () => {
  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
