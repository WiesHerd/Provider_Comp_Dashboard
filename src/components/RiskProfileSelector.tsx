import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'

export interface RiskThresholds {
  warning: number | null
  elevated: number | null
  critical: number | null
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
  const [enabledThresholds, setEnabledThresholds] = useState({
    warning: true,
    elevated: true,
    critical: true
  })
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false)

  const handleProfileChange = (value: string) => {
    setSelectedProfile(value)
    
    if (value === 'custom') {
      setIsCustomDialogOpen(true)
      return
    }

    const profile = defaultProfiles.find(p => p.id === value)
    if (profile) {
      onProfileChange(profile.thresholds)
    }
  }

  const handleCustomSubmit = () => {
    const thresholds: RiskThresholds = {
      warning: enabledThresholds.warning ? customThresholds.warning : null,
      elevated: enabledThresholds.elevated ? customThresholds.elevated : null,
      critical: enabledThresholds.critical ? customThresholds.critical : null
    }
    setSelectedProfile('custom')
    onProfileChange(thresholds)
    setIsCustomDialogOpen(false)
  }

  return (
    <div className={className}>
      <div className="border rounded-lg p-2 w-[160px]">
        <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          Risk Profile
        </Label>
        <Select 
          value={selectedProfile} 
          onValueChange={handleProfileChange}
        >
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="Select profile" />
          </SelectTrigger>
          <SelectContent>
            {defaultProfiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm">{profile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {profile.thresholds.warning}% → {profile.thresholds.elevated}% → {profile.thresholds.critical}%
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground hover:text-foreground -mt-1"
          onClick={() => {
            setSelectedProfile('custom')
            setIsCustomDialogOpen(true)
          }}
        >
          + Custom
        </Button>
      </div>

      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Risk Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <Label htmlFor="warning-enabled" className="text-right">
                Warning Level
              </Label>
              <Input
                id="warning"
                type="number"
                min={0}
                max={100}
                value={customThresholds.warning ?? ''}
                onChange={(e) => setCustomThresholds(prev => ({ ...prev, warning: Number(e.target.value) }))}
                disabled={!enabledThresholds.warning}
              />
              <Switch
                id="warning-enabled"
                checked={enabledThresholds.warning}
                onCheckedChange={(checked) => setEnabledThresholds(prev => ({ ...prev, warning: checked }))}
              />
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <Label htmlFor="elevated-enabled" className="text-right">
                Elevated Level
              </Label>
              <Input
                id="elevated"
                type="number"
                min={0}
                max={100}
                value={customThresholds.elevated ?? ''}
                onChange={(e) => setCustomThresholds(prev => ({ ...prev, elevated: Number(e.target.value) }))}
                disabled={!enabledThresholds.elevated}
              />
              <Switch
                id="elevated-enabled"
                checked={enabledThresholds.elevated}
                onCheckedChange={(checked) => setEnabledThresholds(prev => ({ ...prev, elevated: checked }))}
              />
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
              <Label htmlFor="critical-enabled" className="text-right">
                Critical Level
              </Label>
              <Input
                id="critical"
                type="number"
                min={0}
                max={100}
                value={customThresholds.critical ?? ''}
                onChange={(e) => setCustomThresholds(prev => ({ ...prev, critical: Number(e.target.value) }))}
                disabled={!enabledThresholds.critical}
              />
              <Switch
                id="critical-enabled"
                checked={enabledThresholds.critical}
                onCheckedChange={(checked) => setEnabledThresholds(prev => ({ ...prev, critical: checked }))}
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