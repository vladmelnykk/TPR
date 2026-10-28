import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Lab1Page from './pages/Lab1Page'
import Lab2Page from './pages/Lab2Page'
import GroupDecisionPage from './pages/GroupDecisionPage'
import HierarchyPage from './pages/HierarchyPage'
import ConflictPage from './pages/ConflictPage'
import StubPage from './pages/StubPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Lab1Page />} />
          <Route path="group-decisions" element={<GroupDecisionPage />} />
          <Route path="lab3" element={<Navigate to="/group-decisions" replace />} />
          <Route path="hierarchy" element={<HierarchyPage />} />
          <Route path="lab4" element={<Navigate to="/hierarchy" replace />} />
          <Route path="conflicting-criteria" element={<ConflictPage />} />
          <Route path="lab5" element={<Navigate to="/conflicting-criteria" replace />} />
          <Route path="risk" element={<Lab2Page />} />
          <Route path="lab2" element={<Navigate to="/risk" replace />} />
          <Route path="*" element={<StubPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
