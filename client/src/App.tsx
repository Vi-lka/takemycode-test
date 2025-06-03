import './App.css'
import Header from './components/header'
import { ThemeProvider } from './components/providers/theme-provider'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <Header />
      <main className="pt-12">
        Hello
      </main>
    </ThemeProvider>
  )
}

export default App
