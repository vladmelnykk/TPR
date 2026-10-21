import { BrowserRouter, Route, Routes } from 'react-router-dom'
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
          <Route path="lab2" element={<Lab2Page />} />
          <Route path="lab3" element={<StubPage number={3} />} />
          <Route path="lab4" element={<StubPage number={4} />} />
          <Route path="lab5" element={<StubPage number={5} />} />
          <Route path="*" element={<StubPage number={0} />} />
        </Route>
      </Routes>
      w
    </BrowserRouter>
  )
}
