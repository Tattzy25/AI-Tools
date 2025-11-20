import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeSelect() {
  const { mode, setMode } = useTheme()
  return (
    <Select value={mode} onValueChange={(v: any) => setMode(v)}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  )
}