import './App.css'
import Header from './components/header'
import List from './components/list'
import QueryProvider from './components/providers/query-provider'
import { ThemeProvider } from './components/providers/theme-provider'

function App() {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <Header />
        <main className="pt-12">
          <List />
        </main>
      </ThemeProvider>
    </QueryProvider>
  )
}

export default App
