import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Lab1Page from './pages/Lab1Page'
import Lab2Page from './pages/Lab2Page'
import StubPage from './pages/StubPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Lab1Page />} />
          <Route path="risk" element={<Lab2Page />} />
          <Route path="lab2" element={<Navigate to="/risk" replace />} />
          <Route path="*" element={<StubPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
