import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select'
import { useTheme } from 'next-themes'

export default function ThemeSelect() {
  const { theme, setTheme } = useTheme()
  return (
    <Select value={theme || 'system'} onValueChange={(v: string) => setTheme(v)}>
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