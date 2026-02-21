import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Card, CardContent } from './Card'

type FABAction = {
  label: string
  icon: React.ReactNode
  onClick: () => void
}

type FABProps = {
  actions: FABAction[]
}

export function FAB({ actions }: FABProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <Card className="mb-4 shadow-xl">
          <CardContent className="p-2">
            <div className="space-y-1">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    action.onClick()
                    setIsOpen(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 ${
          isOpen ? 'rotate-45' : ''
        }`}
        aria-label="Quick Actions"
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  )
}
