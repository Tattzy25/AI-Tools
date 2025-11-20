import React from 'react'
import { Button } from '../../../components/ui/button'
import { Image as ImageIcon, Palette, Type, Search } from 'lucide-react'
import { TabKey } from '../hooks/useImageExtraction'

export function ResultsTabs(props: { activeTab: TabKey; setActiveTab: (t: TabKey) => void }) {
  const { activeTab, setActiveTab } = props
  const tabs = [
    { id: 'all', label: 'All Results', icon: ImageIcon },
    { id: 'objects', label: 'Objects', icon: Search },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'text', label: 'Text', icon: Type }
  ] as const
  return (
    <div className="mb-6">
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Button key={tab.id} variant={activeTab === tab.id ? 'secondary' : 'ghost'} onClick={() => setActiveTab(tab.id as TabKey)} className="inline-flex items-center gap-2">
                <Icon aria-hidden="true" className="h-4 w-4" />
                {tab.label}
              </Button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}