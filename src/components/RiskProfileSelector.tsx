import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

export interface RiskThresholds {
  warning: number    // First threshold (e.g., 60)
  elevated: number   // Second threshold (e.g., 70)
  critical: number   // Third threshold (e.g., 80)
}

export interface RiskProfile {
  id: string
  name: string
  thresholds: RiskThresholds
}

const defaultProfiles: RiskProfile[] = [
  {
    id: 'standard',
    name: 'Standard',
    thresholds: { warning: 60, elevated: 70, critical: 80 }
  },
  {
    id: 'elevated',
    name: 'Elevated',
    thresholds: { warning: 70, elevated: 80, critical: 90 }
  },
  {
    id: 'critical',
    name: 'Critical',
    thresholds: { warning: 80, elevated: 90, critical: 95 }
  }
]

interface RiskProfileSelectorProps {
  onProfileChange: (thresholds: RiskThresholds) => void
  className?: string
}

export function RiskProfileSelector({ onProfileChange, className }: RiskProfileSelectorProps) {
  const [selectedProfile, setSelectedProfile] = useState<string>('standard')
  const [customThresholds, setCustomThresholds] = useState<RiskThresholds>({
    warning: 60,
    elevated: 70,
    critical: 80
  })
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false)

  const handleProfileChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomDialogOpen(true)
      return
    }

    setSelectedProfile(value)
    const profile = defaultProfiles.find(p => p.id === value)
    if (profile) {
      onProfileChange(profile.thresholds)
    }
  }

  const handleCustomSubmit = () => {
    setSelectedProfile('custom')
    onProfileChange(customThresholds)
    setIsCustomDialogOpen(false)
  }

  return (
    <div className={className}>
      <Select value={selectedProfile} onValueChange={handleProfileChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select risk profile" />
        </SelectTrigger>
        <SelectContent>
          {defaultProfiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.name} ({profile.thresholds.warning}/{profile.thresholds.elevated}/{profile.thresholds.critical})
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom...</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Risk Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="warning" className="text-right">
                Warning at
              </Label>
              <Input
                id="warning"
                type="number"
                min={0}
                max={100}
                value={customThresholds.warning}
                onChange={(e) => setCustomThresholds(prev => ({ ...prev, warning: Number(e.target.value) }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="elevated" className="text-right">
                Elevated at
              </Label>
              <Input
                id="elevated"
                type="number"
                min={0}
                max={100}
                value={customThresholds.elevated}
                onChange={(e) => setCustomThresholds(prev => ({ ...prev, elevated: Number(e.target.value) }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="critical" className="text-right">
                Critical at
              </Label>
              <Input
                id="critical"
                type="number"
                min={0}
                max={100}
                value={customThresholds.critical}
                onChange={(e) => setCustomThresholds(prev => ({ ...prev, critical: Number(e.target.value) }))}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomSubmit}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 