import React, { useState } from 'react'
import Topbar from './components/Topbar.jsx'
import Sidebar from './components/Sidebar.jsx'
import CommandCenter from './views/CommandCenter.jsx'
import {
  ProductIntelligence, SprintBoard, SocialCommand,
  PipelineCRM, Infrastructure, BudgetView
} from './views/Placeholders.jsx'

const VIEWS = {
  command:  <CommandCenter />,
  products: <ProductIntelligence />,
  sprint:   <SprintBoard />,
  social:   <SocialCommand />,
  pipeline: <PipelineCRM />,
  infra:    <Infrastructure />,
  budget:   <BudgetView />,
}

export default function App() {
  const [active, setActive] = useState('command')
  return (
    <div className="app-shell">
      <Topbar />
      <Sidebar active={active} setActive={setActive} />
      <main className="main-content">
        {VIEWS[active] || VIEWS.command}
      </main>
    </div>
  )
}
