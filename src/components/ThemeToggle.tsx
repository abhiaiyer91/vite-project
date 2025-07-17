import './ThemeToggle.css'

interface ThemeToggleProps {
  isDarkMode: boolean
  onToggle: () => void
}

const ThemeToggle = ({ isDarkMode, onToggle }: ThemeToggleProps) => {
  return (
    <button className="theme-toggle" onClick={onToggle} aria-label="Toggle theme">
      <span className="theme-toggle-icon">
        {isDarkMode ? '☀️' : '🌙'}
      </span>
      <span className="theme-toggle-text">
        {isDarkMode ? 'Light' : 'Dark'}
      </span>
    </button>
  )
}

export default ThemeToggle